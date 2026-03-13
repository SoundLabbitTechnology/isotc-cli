import { Counterexample } from "../../domain/entities/counterexample";
import { Constitution } from "../../domain/entities/constitution";
import { IOutputFormatter } from "./outputFormatter";

/**
 * 機械可読なJSON出力（AI/CI連携用）
 * 要求仕様書 2_REQUIREMENTS.md のスキーマに準拠
 */
export class JsonFormatter implements IOutputFormatter {
  format(violations: Counterexample[], _constitution: Constitution, durationMs = 0): string {
    const violationDetails = violations.map((v) => ({
      type: v.type,
      file: v.sourceFile,
      line: v.lineNumber,
      importedModule: v.importedModule,
      sourceLayer: v.sourceLayer,
      targetLayer: v.targetLayer,
      message: this.buildMessage(v),
      suggestion: v.suggestion,
      codeSnippet: v.codeSnippet,
    }));

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
      .map(
        (v) =>
          `- ${v.sourceFile}:${v.lineNumber} - ${v.sourceLayer} → ${v.targetLayer}\n  ${v.suggestion}\n  違反コード: ${v.codeSnippet}`
      )
      .join("\n\n");
    return intro + details;
  }

  private buildMessage(v: Counterexample): string {
    if (v.sourceLayer && v.targetLayer) {
      return `${v.sourceLayer} layer must not import ${v.targetLayer} layer.`;
    }
    return `Architecture violation: ${v.sourceFile} imports ${v.importedModule}`;
  }
}
