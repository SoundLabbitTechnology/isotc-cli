import { Command } from "commander";
import * as path from "path";
import * as toml from "@iarna/toml";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import {
  loadLlmConfig,
  getEffectiveProvider,
  getEffectiveModel,
  getEffectiveMode,
} from "../../application/services/configLoader";
import { hasLlmApiKey } from "../../infrastructure/adapters/llmAdapterFactory";
import type { IsotcMode, LlmProvider } from "../../domain/entities/llmConfig";

const CONFIG_PATH = ".spec/config.toml";
const VALID_PROVIDERS: LlmProvider[] = ["openai", "gemini", "claude"];

const PROVIDER_ENV_VARS: Record<LlmProvider, string[]> = {
  openai: ["OPENAI_API_KEY"],
  gemini: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  claude: ["ANTHROPIC_API_KEY"],
};

function ensureSpecExists(cwd: string): Promise<boolean> {
  const fileSystem = new LocalFileSystemAdapter();
  return fileSystem.exists(path.join(cwd, ".spec", "constitution.toml"));
}

export function configCommand(): Command {
  const cmd = new Command("config")
    .description("LLM アダプター設定の表示・変更（.spec/config.toml）");

  cmd
    .command("set")
    .description("設定を変更する")
    .argument("<key>", "provider | model | mode")
    .argument(
      "<value>",
      "値（provider: openai | gemini | claude、model: モデル名、mode: llm | agent）"
    )
    .option("--format <format>", "出力形式: text | json", "text")
    .action(async (key: string, value: string, options: { format?: string }) => {
      const cwd = process.cwd();
      if (!(await ensureSpecExists(cwd))) {
        console.error("❌ .spec/constitution.toml がありません。isotc init を先に実行してください。");
        process.exit(1);
      }

      const fileSystem = new LocalFileSystemAdapter();
      const configPath = path.join(cwd, ".spec", "config.toml");

      let parsed: Record<string, unknown> = {};
      if (await fileSystem.exists(configPath)) {
        try {
          const raw = await fileSystem.readFile(configPath);
          parsed = toml.parse(raw) as Record<string, unknown>;
        } catch (e) {
          console.error("❌ config.toml の読み込みに失敗しました:", e);
          process.exit(1);
        }
      }

      if (!parsed.llm || typeof parsed.llm !== "object") {
        parsed.llm = {};
      }
      const llm = parsed.llm as Record<string, unknown>;

      const k = key.toLowerCase();
      if (k === "provider") {
        const v = value.toLowerCase();
        if (!VALID_PROVIDERS.includes(v as LlmProvider)) {
          console.error(`❌ 無効なプロバイダー: ${value}。openai | gemini | claude を指定してください。`);
          process.exit(1);
        }
        llm.provider = v;
      } else if (k === "model") {
        llm.model = value.trim();
      } else if (k === "mode") {
        const v = value.toLowerCase() as IsotcMode | string;
        if (v !== "llm" && v !== "agent") {
          console.error(`❌ 無効な mode: ${value}。llm | agent を指定してください。`);
          process.exit(1);
        }
        llm.mode = v;
      } else {
        console.error(`❌ 無効なキー: ${key}。provider | model | mode を指定してください。`);
        process.exit(1);
      }

      // 他セクションを保持しつつ llm を更新
      const tomlObj: Record<string, unknown> = {
        ...Object.fromEntries(Object.entries(parsed).filter(([key]) => key !== "llm")),
        llm: {
          ...(typeof llm.provider === "string" && { provider: llm.provider }),
          ...(typeof llm.model === "string" && { model: llm.model }),
          ...(typeof llm.mode === "string" && { mode: llm.mode }),
        },
      };
      const tomlContent = toml.stringify(tomlObj as Parameters<typeof toml.stringify>[0]);
      await fileSystem.writeFile(configPath, tomlContent);

      const format = options.format ?? "text";
      if (format === "json") {
        console.log(
          JSON.stringify({
            status: "ok",
            configPath: CONFIG_PATH,
            [key]: llm[key as keyof typeof llm],
          })
        );
      } else {
        console.log(`✅ ${CONFIG_PATH} を更新しました: ${key} = ${value}`);
      }
    });

  cmd
    .command("show")
    .description("現在の有効な設定を表示（環境変数 > config ファイル）")
    .option("--format <format>", "出力形式: text | json", "text")
    .action(async (options: { format?: string }) => {
      const cwd = process.cwd();
      const config = await loadLlmConfig(cwd);
      const provider = getEffectiveProvider(cwd, config);
      const model = getEffectiveModel(provider, config);
      const mode = getEffectiveMode(config);

      const source = {
        provider: process.env.ISOTC_LLM_PROVIDER ? "env" : config?.provider ? "config" : "default",
        model: process.env.ISOTC_LLM_MODEL ? "env" : config?.model ? "config" : "default",
        mode: process.env.ISOTC_MODE ? "env" : config?.mode ? "config" : "default",
      };

      const format = options.format ?? "text";
      if (format === "json") {
        console.log(
          JSON.stringify({
            provider,
            model,
            source,
            apiKeySet: hasLlmApiKey(provider),
            mode,
            configPath: config ? CONFIG_PATH : null,
          })
        );
      } else {
        console.error("現在の LLM アダプター設定:");
        console.error(`  プロバイダー: ${provider} (${source.provider})`);
        console.error(`  モデル: ${model} (${source.model})`);
        console.error(`  モード: ${mode} (${source.mode})`);
        console.error(`  API キー: ${hasLlmApiKey(provider) ? "設定済み" : "未設定"}`);
        if (config) {
          console.error(`  設定ファイル: ${CONFIG_PATH}`);
        }
      }
    });

  cmd
    .command("list-providers")
    .description("利用可能なプロバイダーと必要な環境変数を表示")
    .option("--format <format>", "出力形式: text | json", "text")
    .action(async (options: { format?: string }) => {
      const format = options.format ?? "text";
      const providers = VALID_PROVIDERS.map((p) => ({
        id: p,
        envVars: PROVIDER_ENV_VARS[p],
        apiKeySet: hasLlmApiKey(p),
      }));

      if (format === "json") {
        console.log(JSON.stringify({ providers }));
      } else {
        console.error("利用可能な LLM プロバイダー:");
        for (const p of providers) {
          const status = p.apiKeySet ? "✅" : "○";
          console.error(`  ${status} ${p.id}: ${p.envVars.join(", ")}`);
        }
        console.error("\n設定例: isotc config set provider gemini");
      }
    });

  return cmd;
}
