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
      output += `## ${v.sourceFile}:${v.lineNumber}\n`;
      output += `- **違反**: ${v.sourceLayer} → ${v.targetLayer}\n`;
      output += `- **インポート**: ${v.importedModule}\n`;
      output += `- **提案**: ${v.suggestion}\n`;
      output += `\`\`\`\n${v.codeSnippet}\n\`\`\`\n\n`;
    }
    return output;
  }
}
