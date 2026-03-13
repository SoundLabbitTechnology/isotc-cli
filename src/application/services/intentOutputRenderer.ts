import { OpenQuestion } from "../../domain/entities/openQuestion";
import { Assumption } from "../../domain/entities/assumptions";
import * as toml from "@iarna/toml";

/**
 * open_questions.md の Markdown を生成
 */
export function renderOpenQuestionsMarkdown(questions: OpenQuestion[]): string {
  if (questions.length === 0) {
    return "# 未解決の質問\n\n（なし）\n";
  }

  const sections = questions.map((q) => {
    const optionsBlock =
      q.options && q.options.length > 0
        ? `- **選択肢**: ${q.options.join(" / ")}\n`
        : "";
    return `## ${q.id}: ${q.title}
- **出典**: ${q.source}
- **質問**: ${q.question}
${optionsBlock}`;
  });

  return `# 未解決の質問\n\n${sections.join("\n\n")}\n`;
}

/**
 * assumptions.toml の TOML を生成
 */
export function renderAssumptionsToml(
  assumptions: Record<string, Assumption>
): string {
  if (Object.keys(assumptions).length === 0) {
    return "# 暫定仮定（plan 実行時の前提）\n# （なし）\n";
  }

  const assumptionsTable: Record<string, Record<string, string>> = {};
  for (const [id, a] of Object.entries(assumptions)) {
    const section: Record<string, string> = {
      description: a.description,
    };
    if (a.confidence) section.confidence = a.confidence;
    if (a.source) section.source = a.source;
    assumptionsTable[id] = section;
  }

  return toml.stringify({ assumptions: assumptionsTable });
}
