import { GoogleGenAI } from "@google/genai";
import { ILlmAdapter } from "../ports/iLlmAdapter";

export class GeminiLlmAdapter implements ILlmAdapter {
  private client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!key?.trim()) {
      throw new Error(
        "GEMINI_API_KEY または GOOGLE_API_KEY が設定されていません。環境変数で設定するか、API キーを渡してください。"
      );
    }
    this.client = new GoogleGenAI({ apiKey: key });
    this.model = model ?? process.env.ISOTC_LLM_MODEL ?? "gemini-2.0-flash";
  }

  async complete(prompt: string, systemPrompt?: string): Promise<string> {
    const config: Record<string, unknown> = {};
    if (systemPrompt) {
      config.systemInstruction = systemPrompt;
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    const text = response.text;
    if (!text) {
      throw new Error("LLM から空の応答が返されました。");
    }
    return text;
  }
}
