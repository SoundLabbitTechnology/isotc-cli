import OpenAI from "openai";
import { ILlmAdapter } from "../ports/iLlmAdapter";

export class OpenAILlmAdapter implements ILlmAdapter {
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error(
        "OPENAI_API_KEY が設定されていません。環境変数で設定するか、API キーを渡してください。"
      );
    }
    this.client = new OpenAI({ apiKey: key });
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await this.client.chat.completions.create({
      model: process.env.ISOTC_LLM_MODEL ?? "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("LLM から空の応答が返されました。");
    }
    return content;
  }
}
