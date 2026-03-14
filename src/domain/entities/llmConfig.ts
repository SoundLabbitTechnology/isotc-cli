export type LlmProvider = "openai" | "gemini" | "claude";

export interface LlmConfig {
  provider?: LlmProvider;
  model?: string;
}
