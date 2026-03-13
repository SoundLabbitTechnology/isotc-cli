import { Counterexample } from "../../domain/entities/counterexample";
import { Constitution } from "../../domain/entities/constitution";
import { IOutputFormatter } from "./outputFormatter";

/**
 * 機械可読なJSON出力（AI/CI連携用）
 * 要求仕様書 2_REQUIREMENTS.md のスキーマに準拠
 */
export class JsonFormatter implements IOutputFormatter {
  format(violations: Counterexample[], _constitution: Constitution, durationMs = 0): string {
    const output = {
      status: violations.length === 0 ? "passed" : "failed",
      violations: violations.map((v) => ({
        type: v.type,
        file: v.sourceFile,
        line: v.lineNumber,
        importedModule: v.importedModule,
        sourceLayer: v.sourceLayer,
        targetLayer: v.targetLayer,
        message: this.buildMessage(v),
        suggestion: v.suggestion,
        codeSnippet: v.codeSnippet,
      })),
      durationMs,
    };
    return JSON.stringify(output, null, 2);
  }

  private buildMessage(v: Counterexample): string {
    if (v.sourceLayer && v.targetLayer) {
      return `${v.sourceLayer} layer must not import ${v.targetLayer} layer.`;
    }
    return `Architecture violation: ${v.sourceFile} imports ${v.importedModule}`;
  }
}
