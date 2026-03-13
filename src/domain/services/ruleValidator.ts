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

      const targetPath = this.resolveImportPath(dep.sourceFilePath, dep.importedModule);
      if (!targetPath) continue;

      const targetLayer = this.resolveLayer(targetPath);
      if (!targetLayer) continue;

      if (sourceLayer === targetLayer) continue;

      const allowedLayers = this.constitution.rules[sourceLayer] ?? [];
      if (!allowedLayers.includes(targetLayer)) {
        violations.push({
          type: "ArchitectureViolation",
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

    return violations;
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
