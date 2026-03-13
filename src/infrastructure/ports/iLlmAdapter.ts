/**
 * LLM 呼び出しのポート
 * OpenAI / Anthropic 等を差し替え可能にする
 */
export interface ILlmAdapter {
  complete(prompt: string, systemPrompt?: string): Promise<string>;
}
