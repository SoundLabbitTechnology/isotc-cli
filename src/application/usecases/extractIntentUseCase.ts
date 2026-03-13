import { ILlmAdapter } from "../../infrastructure/ports/iLlmAdapter";
import { IFileSystem } from "../../infrastructure/ports/iFileSystem";
import {
  RequirementsDocument,
  FunctionalRequirement,
  NonFunctionalRequirement,
  Invariant,
  GlossaryEntry,
  ForbiddenRule,
  AmbiguousTerm,
} from "../../domain/entities/requirements";
import { OpenQuestion } from "../../domain/entities/openQuestion";
import { Assumption } from "../../domain/entities/assumptions";
import { INTENT_EXTRACT_SYSTEM_PROMPT } from "../prompts/intentExtractPrompt";

export interface IntentExtractResult {
  requirements: RequirementsDocument;
  openQuestions: OpenQuestion[];
  assumptions: Record<string, Assumption>;
}

export class ExtractIntentUseCase {
  constructor(
    private llmAdapter: ILlmAdapter,
    private fileSystem: IFileSystem
  ) {}

  async execute(requirementText: string): Promise<IntentExtractResult> {
    const userPrompt = `以下の要件を構造化してください。\n\n---\n\n${requirementText}\n\n---\n\n上記を JSON 形式で出力してください。`;
    const rawResponse = await this.llmAdapter.complete(
      userPrompt,
      INTENT_EXTRACT_SYSTEM_PROMPT
    );

    const parsed = this.parseLlmResponse(rawResponse);

    const generatedAt = new Date().toISOString();
    const openQuestionIds = parsed.openQuestions.map((q) => q.id);
    const assumptionIds = Object.keys(parsed.assumptions);

    const requirements: RequirementsDocument = {
      version: "1.0",
      generatedAt,
      functionalRequirements: parsed.functionalRequirements ?? [],
      nonFunctionalRequirements: parsed.nonFunctionalRequirements ?? [],
      invariants: parsed.invariants ?? [],
      glossary: parsed.glossary ?? [],
      forbidden: parsed.forbidden ?? [],
      ambiguousTerms: parsed.ambiguousTerms ?? [],
      openQuestionIds,
      assumptionIds,
    };

    return {
      requirements,
      openQuestions: parsed.openQuestions ?? [],
      assumptions: parsed.assumptions ?? {},
    };
  }

  private parseLlmResponse(raw: string): {
    functionalRequirements: FunctionalRequirement[];
    nonFunctionalRequirements: NonFunctionalRequirement[];
    invariants: Invariant[];
    glossary: GlossaryEntry[];
    forbidden: ForbiddenRule[];
    ambiguousTerms: AmbiguousTerm[];
    openQuestions: OpenQuestion[];
    assumptions: Record<string, Assumption>;
  } {
    const trimmed = raw.trim();
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}") + 1;
    const jsonStr = jsonStart >= 0 && jsonEnd > jsonStart ? trimmed.slice(jsonStart, jsonEnd) : trimmed;

    try {
      return JSON.parse(jsonStr) as ReturnType<ExtractIntentUseCase["parseLlmResponse"]>;
    } catch (e) {
      throw new Error(
        `LLM の応答を JSON として解析できませんでした: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}
