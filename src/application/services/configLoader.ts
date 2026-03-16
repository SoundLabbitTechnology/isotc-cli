import * as path from "path";
import * as toml from "@iarna/toml";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import type { IsotcMode, LlmConfig, LlmProvider } from "../../domain/entities/llmConfig";

const CONFIG_FILENAME = "config.toml";

/**
 * .spec/config.toml から LLM 設定を読み込む。
 * ファイルが存在しない、または [llm] セクションがない場合は null を返す。
 */
export async function loadLlmConfig(cwd: string): Promise<LlmConfig | null> {
  const fileSystem = new LocalFileSystemAdapter();
  const configPath = path.join(cwd, ".spec", CONFIG_FILENAME);

  if (!(await fileSystem.exists(configPath))) {
    return null;
  }

  try {
    const raw = await fileSystem.readFile(configPath);
    const parsed = toml.parse(raw) as Record<string, unknown>;
    const llm = parsed.llm as Record<string, unknown> | undefined;
    if (!llm || typeof llm !== "object") {
      return null;
    }

    const provider = typeof llm.provider === "string" ? llm.provider.toLowerCase() : undefined;
    const model = typeof llm.model === "string" ? llm.model.trim() : undefined;
    const mode =
      typeof llm.mode === "string" ? (llm.mode.toLowerCase() as IsotcMode | string) : undefined;

    return {
      provider: isValidProvider(provider) ? provider : undefined,
      model: model || undefined,
      mode: isValidMode(mode) ? mode : undefined,
    };
  } catch {
    return null;
  }
}

function isValidProvider(p: string | undefined): p is "openai" | "gemini" | "claude" {
  return p === "openai" || p === "gemini" || p === "claude";
}

function isValidMode(m: string | undefined): m is IsotcMode {
  return m === "llm" || m === "agent";
}

/**
 * 有効な設定を取得。優先順位: 環境変数 > config ファイル > デフォルト
 */
export function getEffectiveProvider(_cwd: string, config: LlmConfig | null): LlmProvider {
  const envProvider = process.env.ISOTC_LLM_PROVIDER?.toLowerCase();
  if (envProvider === "openai" || envProvider === "gemini" || envProvider === "claude") {
    return envProvider;
  }
  if (config?.provider) {
    return config.provider;
  }
  return "openai";
}

/**
 * 有効なモードを取得。優先順位: 環境変数 > config ファイル > デフォルト(llm)
 */
export function getEffectiveMode(config: LlmConfig | null): IsotcMode {
  const envMode = process.env.ISOTC_MODE?.toLowerCase();
  if (envMode === "llm" || envMode === "agent") {
    return envMode;
  }
  if (config?.mode === "llm" || config?.mode === "agent") {
    return config.mode;
  }
  return "llm";
}

/**
 * 有効なモデルを取得。優先順位: 環境変数 > config ファイル > デフォルト（プロバイダー依存）
 */
export function getEffectiveModel(provider: LlmProvider, config: LlmConfig | null): string {
  const envModel = process.env.ISOTC_LLM_MODEL?.trim();
  if (envModel) {
    return envModel;
  }
  if (config?.model) {
    return config.model;
  }
  const defaults: Record<LlmProvider, string> = {
    openai: "gpt-4o-mini",
    gemini: "gemini-2.0-flash",
    claude: "claude-3-5-sonnet-20241022",
  };
  return defaults[provider];
}
