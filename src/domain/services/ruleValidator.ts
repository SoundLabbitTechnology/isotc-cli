import * as path from "path";
import { minimatch } from "minimatch";
import { DependencyNode } from "../entities/dependencyNode";
import { Constitution } from "../entities/constitution";
import { Counterexample } from "../entities/counterexample";

export class RuleValidator {
  constructor(private constitution: Constitution, private projectRoot: string) {}

  public checkViolations(dependencies: DependencyNode[]): Counterexample[] {
    const violations: Counterexample[] = [];

    for (const dep of dependencies) {
      const sourceLayer = this.resolveLayer(dep.sourceFilePath);
      if (!sourceLayer) continue;

      const kind = dep.kind ?? "import";

      if (kind === "package") {
        const pkgViolations = this.checkPackageViolation(dep, sourceLayer);
        violations.push(...pkgViolations);
        continue;
      }

      const targetPath = this.resolveImportPath(dep.sourceFilePath, dep.importedModule);
      if (!targetPath) continue;

      const targetLayer = this.resolveLayer(targetPath);
      if (!targetLayer) continue;

      if (sourceLayer === targetLayer) continue;

      const allowedLayers = this.constitution.rules[sourceLayer] ?? [];
      if (!allowedLayers.includes(targetLayer)) {
        violations.push({
          type: kind === "reexport" ? "ReExportViolation" : "ArchitectureViolation",
          sourceFile: this.toRelativePath(dep.sourceFilePath),
          importedModule: dep.importedModule,
          sourceLayer,
          targetLayer,
          lineNumber: dep.lineNumber,
          codeSnippet: dep.codeSnippet,
          suggestion: this.buildSuggestion(sourceLayer, targetLayer),
        });
      }
    }

    const cycleViolations = this.detectCyclicDependencies(dependencies);
    violations.push(...cycleViolations);

    return violations;
  }

  private checkPackageViolation(dep: DependencyNode, sourceLayer: string): Counterexample[] {
    const violations: Counterexample[] = [];
    const pkgRules = this.constitution.packageRules?.[sourceLayer];
    if (!pkgRules) return violations;

    const pkgName = dep.importedModule.split("/")[0];

    if (pkgRules.deny?.includes(pkgName)) {
      violations.push({
        type: "PackageViolation",
        sourceFile: this.toRelativePath(dep.sourceFilePath),
        importedModule: dep.importedModule,
        sourceLayer,
        targetLayer: "package",
        lineNumber: dep.lineNumber,
        codeSnippet: dep.codeSnippet,
        suggestion: `${sourceLayer} 層ではパッケージ "${pkgName}" の使用が禁止されています。`,
      });
    }

    if (pkgRules.allow && pkgRules.allow.length > 0 && !pkgRules.allow.includes(pkgName)) {
      violations.push({
        type: "PackageViolation",
        sourceFile: this.toRelativePath(dep.sourceFilePath),
        importedModule: dep.importedModule,
        sourceLayer,
        targetLayer: "package",
        lineNumber: dep.lineNumber,
        codeSnippet: dep.codeSnippet,
        suggestion: `${sourceLayer} 層ではパッケージ "${pkgName}" は許可されていません。許可リスト: ${pkgRules.allow.join(", ")}`,
      });
    }

    return violations;
  }

  private detectCyclicDependencies(dependencies: DependencyNode[]): Counterexample[] {
    const fileToFile = new Map<string, Set<string>>();

    for (const dep of dependencies) {
      if (dep.kind === "package") continue;
      const targetPath = this.resolveImportPath(dep.sourceFilePath, dep.importedModule);
      if (!targetPath) continue;

      const srcRel = this.toRelativePath(dep.sourceFilePath);
      const tgtRel = this.toRelativePath(targetPath);
      if (srcRel.includes("node_modules") || tgtRel.includes("node_modules")) continue;

      if (!fileToFile.has(srcRel)) fileToFile.set(srcRel, new Set());
      fileToFile.get(srcRel)!.add(tgtRel);
    }

    const cycles = this.findScc(fileToFile);
    const violations: Counterexample[] = [];
    for (const cycle of cycles) {
      if (cycle.length > 1) {
        violations.push({
          type: "CyclicDependencyViolation",
          sourceFile: cycle[0],
          cycle,
          suggestion: `循環依存を検出しました: ${cycle.join(" → ")} → ${cycle[0]}`,
        });
      }
    }
    return violations;
  }

  private findScc(adj: Map<string, Set<string>>): string[][] {
    const allNodes = new Set<string>();
    adj.forEach((targets, src) => {
      allNodes.add(src);
      targets.forEach((t) => allNodes.add(t));
    });

    let index = 0;
    const indices = new Map<string, number>();
    const lowlinks = new Map<string, number>();
    const onStack = new Set<string>();
    const stack: string[] = [];
    const sccs: string[][] = [];

    const strongConnect = (v: string) => {
      indices.set(v, index);
      lowlinks.set(v, index);
      index++;
      stack.push(v);
      onStack.add(v);

      for (const w of adj.get(v) ?? []) {
        if (!indices.has(w)) {
          strongConnect(w);
          lowlinks.set(v, Math.min(lowlinks.get(v)!, lowlinks.get(w)!));
        } else if (onStack.has(w)) {
          lowlinks.set(v, Math.min(lowlinks.get(v)!, indices.get(w)!));
        }
      }

      if (lowlinks.get(v) === indices.get(v)) {
        const scc: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          scc.push(w);
        } while (w !== v);
        sccs.push(scc);
      }
    };

    for (const v of allNodes) {
      if (!indices.has(v)) strongConnect(v);
    }
    return sccs;
  }

  private resolveLayer(filePath: string): string | null {
    const relative = this.toRelativePath(filePath);
    for (const layer of this.constitution.layers) {
      if (minimatch(relative, layer.basePath)) {
        return layer.name;
      }
    }
    return null;
  }

  private resolveImportPath(sourceFilePath: string, importedModule: string): string | null {
    if (!importedModule.startsWith(".")) return null;

    const sourceDir = path.dirname(sourceFilePath);
    const resolved = path.resolve(sourceDir, importedModule);
    const ext = path.extname(resolved) || ".ts";
    const withExt = resolved.endsWith(ext) ? resolved : `${resolved}${ext}`;
    const indexPath = path.join(resolved, "index.ts");

    if (this.isWithinProject(withExt)) return withExt;
    if (this.isWithinProject(indexPath)) return indexPath;
    return this.isWithinProject(resolved) ? resolved : withExt;
  }

  private isWithinProject(filePath: string): boolean {
    const relative = path.relative(this.projectRoot, path.normalize(filePath));
    return !relative.startsWith("..") && !path.isAbsolute(relative);
  }

  private toRelativePath(filePath: string): string {
    const normalized = path.normalize(filePath);
    const relative = path.relative(this.projectRoot, normalized);
    return relative.replace(/\\/g, "/");
  }

  private buildSuggestion(sourceLayer: string, targetLayer: string): string {
    return `依存性注入を用い、${sourceLayer} 層に interface を定義し、${targetLayer} 層で実装してください。${sourceLayer} 層は ${targetLayer} 層を直接 import できません。`;
  }
}
