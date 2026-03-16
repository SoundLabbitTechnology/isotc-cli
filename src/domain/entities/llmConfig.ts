export type LlmProvider = "openai" | "gemini" | "claude";

export type IsotcMode = "llm" | "agent";

export interface LlmConfig {
  provider?: LlmProvider;
  model?: string;
  mode?: IsotcMode;
}
