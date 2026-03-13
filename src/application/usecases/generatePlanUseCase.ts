import { ILlmAdapter } from "../../infrastructure/ports/iLlmAdapter";
import { IFileSystem } from "../../infrastructure/ports/iFileSystem";
import { Constitution } from "../../domain/entities/constitution";
import { RequirementsDocument } from "../../domain/entities/requirements";
import { PLAN_EXTRACT_SYSTEM_PROMPT } from "../prompts/planExtractPrompt";

export interface PlanTask {
  id: string;
  title?: string;
  description?: string;
  layer?: string;
  ownership?: string;
  dependsOn?: string[];
  requirementIds?: string[];
}

export interface PlanTestplanEntry {
  requirementId: string;
  testFocus: string;
  priority?: string;
}

export interface PlanResult {
  tasks: PlanTask[];
  designMd: string;
  adrTitle: string;
  adrContent: string;
  modelPuml: string;
  testplan: PlanTestplanEntry[];
  requirementTaskEdges: { requirementId: string; taskId: string }[];
}

export class GeneratePlanUseCase {
  constructor(
    private llmAdapter: ILlmAdapter,
    private fileSystem: IFileSystem
  ) {}

  async execute(
    requirements: RequirementsDocument,
    constitution: Constitution
  ): Promise<PlanResult> {
    const requirementsSummary = this.summarizeRequirements(requirements);
    const constitutionSummary = this.summarizeConstitution(constitution);

    const userPrompt = `以下の要件と憲法から、技術設計とタスク DAG を生成してください。

## 要件
${requirementsSummary}

## アーキテクチャ憲法
${constitutionSummary}

---
上記を JSON 形式で出力してください。`;

    const rawResponse = await this.llmAdapter.complete(
      userPrompt,
      PLAN_EXTRACT_SYSTEM_PROMPT
    );

    return this.parseLlmResponse(rawResponse);
  }

  private summarizeRequirements(req: RequirementsDocument): string {
    const parts: string[] = [];
    for (const fr of req.functionalRequirements) {
      parts.push(`- FR ${fr.id}: ${fr.summary}`);
    }
    for (const nfr of req.nonFunctionalRequirements) {
      parts.push(`- NFR ${nfr.id}: ${nfr.summary}`);
    }
    return parts.join("\n") || "（要件なし）";
  }

  private summarizeConstitution(c: Constitution): string {
    const layers = c.layers?.map((l) => `- ${l.name}: ${l.basePath}`).join("\n") ?? "";
    const rules =
      c.rules &&
      Object.entries(c.rules)
        .map(([layer, allowed]) => `- ${layer} は ${allowed.join(", ") || "なし"} に依存可`)
        .join("\n");
    return `レイヤー:\n${layers}\n\n依存ルール:\n${rules}`;
  }

  private parseLlmResponse(raw: string): PlanResult {
    const trimmed = raw.trim();
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}") + 1;
    const jsonStr =
      jsonStart >= 0 && jsonEnd > jsonStart ? trimmed.slice(jsonStart, jsonEnd) : trimmed;

    try {
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
      return {
        tasks: (parsed.tasks as PlanTask[]) ?? [],
        designMd: (parsed.designMd as string) ?? "",
        adrTitle: (parsed.adrTitle as string) ?? "設計決定",
        adrContent: (parsed.adrContent as string) ?? "",
        modelPuml: (parsed.modelPuml as string) ?? "",
        testplan: (parsed.testplan as PlanTestplanEntry[]) ?? [],
        requirementTaskEdges:
          (parsed.requirementTaskEdges as { requirementId: string; taskId: string }[]) ?? [],
      };
    } catch (e) {
      throw new Error(
        `LLM の応答を JSON として解析できませんでした: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}
