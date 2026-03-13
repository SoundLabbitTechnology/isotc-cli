import { Counterexample } from "../../domain/entities/counterexample";
import { Constitution } from "../../domain/entities/constitution";
import { IOutputFormatter } from "./outputFormatter";

/**
 * 人間向けのテキスト出力
 */
export class TextFormatter implements IOutputFormatter {
  format(violations: Counterexample[], _constitution: Constitution, _durationMs?: number): string {
    if (violations.length === 0) {
      return "✅ Architecture Verification Passed.";
    }
    let output = "# 🚨 Architecture Verification Failed\n";
    output += "機能するかもしれませんが、アーキテクチャ規約に違反しています。\n\n";
    for (const v of violations) {
      const loc = v.lineNumber != null ? `:${v.lineNumber}` : "";
      output += `## ${v.sourceFile}${loc}\n`;
      if (v.type === "CyclicDependencyViolation" && v.cycle) {
        output += `- **違反**: 循環依存\n`;
        output += `- **サイクル**: ${v.cycle.join(" → ")} → ${v.cycle[0]}\n`;
      } else if (v.sourceLayer && v.targetLayer) {
        output += `- **違反**: ${v.sourceLayer} → ${v.targetLayer}\n`;
        if (v.importedModule) output += `- **インポート**: ${v.importedModule}\n`;
      } else if (v.importedModule) {
        output += `- **インポート**: ${v.importedModule}\n`;
      }
      if (v.suggestion) output += `- **提案**: ${v.suggestion}\n`;
      if (v.codeSnippet) output += `\`\`\`\n${v.codeSnippet}\n\`\`\`\n`;
      output += "\n";
    }
    return output;
  }
}
