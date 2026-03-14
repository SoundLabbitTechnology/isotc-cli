import { ILlmAdapter } from "../ports/iLlmAdapter";
import { OpenAILlmAdapter } from "./openAILlmAdapter";
import { GeminiLlmAdapter } from "./geminiLlmAdapter";
import { ClaudeLlmAdapter } from "./claudeLlmAdapter";
import type { LlmProvider } from "../../domain/entities/llmConfig";

export type { LlmProvider };

export interface CreateLlmAdapterOptions {
  provider?: LlmProvider;
  model?: string;
}

/**
 * 適切な LLM アダプターを生成する。
 * 優先順位: 引数 > 環境変数 > .spec/config.toml > デフォルト
 */
export function createLlmAdapter(options?: CreateLlmAdapterOptions | LlmProvider): ILlmAdapter {
  const provider = typeof options === "string"
    ? options
    : (options?.provider ?? process.env.ISOTC_LLM_PROVIDER ?? "openai").toLowerCase() as LlmProvider;
  const model = typeof options === "object" && options?.model ? options.model : undefined;

  switch (provider) {
    case "openai":
      return new OpenAILlmAdapter(undefined, model);
    case "gemini":
      return new GeminiLlmAdapter(undefined, model);
    case "claude":
      return new ClaudeLlmAdapter(undefined, model);
    default:
      throw new Error(
        `不明な LLM プロバイダー: ${provider}。ISOTC_LLM_PROVIDER は openai | gemini | claude のいずれかを指定してください。`
      );
  }
}

/**
 * 指定プロバイダーの API キーが設定されているかチェック
 */
export function hasLlmApiKey(provider: LlmProvider): boolean {
  switch (provider) {
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY?.trim());
    case "gemini":
      return Boolean(
        process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()
      );
    case "claude":
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
    default:
      return false;
  }
}

/**
 * いずれかの LLM プロバイダーの API キーが設定されているか
 */
export function hasAnyLlmApiKey(): boolean {
  return hasLlmApiKey("openai") || hasLlmApiKey("gemini") || hasLlmApiKey("claude");
}
