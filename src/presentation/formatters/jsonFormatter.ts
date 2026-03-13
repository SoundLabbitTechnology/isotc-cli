import { Counterexample } from "../../domain/entities/counterexample";
import { Constitution } from "../../domain/entities/constitution";
import { IOutputFormatter } from "./outputFormatter";

/**
 * 機械可読なJSON出力（AI/CI連携用）
 * 要求仕様書 2_REQUIREMENTS.md のスキーマに準拠
 */
export class JsonFormatter implements IOutputFormatter {
  format(violations: Counterexample[], _constitution: Constitution, durationMs = 0): string {
    const violationDetails = violations.map((v) => {
      const base: Record<string, unknown> = {
        type: v.type,
        file: v.sourceFile,
        message: this.buildMessage(v),
        suggestion: v.suggestion,
      };
      if (v.lineNumber != null) base.line = v.lineNumber;
      if (v.importedModule != null) base.importedModule = v.importedModule;
      if (v.sourceLayer != null) base.sourceLayer = v.sourceLayer;
      if (v.targetLayer != null) base.targetLayer = v.targetLayer;
      if (v.codeSnippet != null) base.codeSnippet = v.codeSnippet;
      if (v.cycle != null) base.cycle = v.cycle;
      return base;
    });

    const output: Record<string, unknown> = {
      status: violations.length === 0 ? "passed" : "failed",
      violations: violationDetails,
      durationMs,
    };

    if (violations.length > 0) {
      output.repairPrompt = this.buildRepairPrompt(violations);
    }

    return JSON.stringify(output, null, 2);
  }

  private buildRepairPrompt(violations: Counterexample[]): string {
    const intro =
      "以下のアーキテクチャ違反を修正してください。内側のレイヤーは外側のレイヤーを直接 import できません。依存性注入を用い、interface を内側のレイヤーに定義してください。\n\n";
    const details = violations
      .map((v) => {
        if (v.type === "CyclicDependencyViolation" && v.cycle) {
          return `- 循環依存: ${v.cycle.join(" → ")} → ${v.cycle[0]}\n  ${v.suggestion}`;
        }
        const loc = v.lineNumber != null ? `:${v.lineNumber}` : "";
        const layerInfo = v.sourceLayer && v.targetLayer ? ` - ${v.sourceLayer} → ${v.targetLayer}` : "";
        const codeInfo = v.codeSnippet ? `\n  違反コード: ${v.codeSnippet}` : "";
        return `- ${v.sourceFile}${loc}${layerInfo}\n  ${v.suggestion}${codeInfo}`;
      })
      .join("\n\n");
    return intro + details;
  }

  private buildMessage(v: Counterexample): string {
    if (v.type === "CyclicDependencyViolation" && v.cycle) {
      return `Cyclic dependency: ${v.cycle.join(" → ")}`;
    }
    if (v.type === "PackageViolation") {
      return `${v.sourceLayer} layer must not use package ${v.importedModule}.`;
    }
    if (v.sourceLayer && v.targetLayer) {
      return `${v.sourceLayer} layer must not import ${v.targetLayer} layer.`;
    }
    return `Architecture violation: ${v.sourceFile} imports ${v.importedModule}`;
  }
}
