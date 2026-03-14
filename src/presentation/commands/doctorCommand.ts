import { Command } from "commander";
import * as path from "path";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";

interface DoctorResult {
  status: "ok" | "warning" | "error";
  nodeVersion: string;
  checks: {
    constitution: boolean;
    constitutionPath: string;
    requirementsJson: boolean;
    openApiKeySet: boolean;
  };
  message?: string;
}

export function doctorCommand(): Command {
  const cmd = new Command("doctor")
    .description("環境と .spec の健全性チェック（CI/AI 連携用）")
    .option("--format <format>", "出力形式: text | json", "json")
    .action(async (options: { format?: string }) => {
      const cwd = process.cwd();
      const specDir = path.join(cwd, ".spec");
      const constitutionPath = path.join(specDir, "constitution.toml");
      const requirementsPath = path.join(specDir, "requirements.json");
      const fileSystem = new LocalFileSystemAdapter();

      const constitutionExists = await fileSystem.exists(constitutionPath);
      const requirementsExists = await fileSystem.exists(requirementsPath);
      const openApiKeySet = Boolean(process.env.OPENAI_API_KEY?.trim());

      const result: DoctorResult = {
        status: constitutionExists ? (openApiKeySet || !requirementsExists ? "ok" : "warning") : "error",
        nodeVersion: process.version,
        checks: {
          constitution: constitutionExists,
          constitutionPath: ".spec/constitution.toml",
          requirementsJson: requirementsExists,
          openApiKeySet,
        },
      };

      if (!constitutionExists) {
        result.message = ".spec/constitution.toml がありません。isotc init を実行してください。";
      } else if (!openApiKeySet && requirementsExists) {
        result.message = "OPENAI_API_KEY が未設定です。intent / plan を使用する場合は設定してください。";
      }

      const format = options.format ?? "json";
      if (format === "json") {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const icon = result.status === "ok" ? "✅" : result.status === "warning" ? "⚠️" : "❌";
        console.error(`${icon} constitution: ${result.checks.constitution ? "あり" : "なし"} (${result.checks.constitutionPath})`);
        console.error(`${result.checks.requirementsJson ? "✅" : "○"} requirements.json: ${result.checks.requirementsJson ? "あり" : "なし"}`);
        console.error(`${result.checks.openApiKeySet ? "✅" : "○"} OPENAI_API_KEY: ${result.checks.openApiKeySet ? "設定済み" : "未設定"}`);
        console.error(`Node: ${result.nodeVersion}`);
        if (result.message) console.error(result.message);
      }
    });

  return cmd;
}
