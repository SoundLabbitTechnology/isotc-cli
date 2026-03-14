import Anthropic from "@anthropic-ai/sdk";
import { ILlmAdapter } from "../ports/iLlmAdapter";

export class ClaudeLlmAdapter implements ILlmAdapter {
  private client: Anthropic;
  private readonly model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!key?.trim()) {
      throw new Error(
        "ANTHROPIC_API_KEY が設定されていません。環境変数で設定するか、API キーを渡してください。"
      );
    }
    this.client = new Anthropic({ apiKey: key });
    this.model = model ?? process.env.ISOTC_LLM_MODEL ?? "claude-3-5-sonnet-20241022";
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {

    const params: Anthropic.MessageCreateParams = {
      model: this.model,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    };
    if (systemPrompt) {
      params.system = systemPrompt;
    }

    const message = await this.client.messages.create(params);

    const textBlock = message.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock?.text) {
      throw new Error("LLM から空の応答が返されました。");
    }
    return textBlock.text;
  }
}
