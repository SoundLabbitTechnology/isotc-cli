import { Command } from "commander";
import * as path from "path";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";

const HEXAGONAL_TEMPLATE = `# isotc-cli 憲法（アーキテクチャ規約）
# レイヤー定義: name=レイヤー名, basePath=ソースパス（glob対応）

[[layers]]
name = "domain"
basePath = "src/domain/**"

[[layers]]
name = "application"
basePath = "src/application/**"

[[layers]]
name = "infrastructure"
basePath = "src/infrastructure/**"

[[layers]]
name = "presentation"
basePath = "src/presentation/**"

# 依存ルール: 各レイヤーがインポートを許可するレイヤー
# domain は他に依存しない
# application は domain のみ
# infrastructure は domain, application を許可
# presentation は domain, application, infrastructure を許可

[rules]
domain = []
application = ["domain"]
infrastructure = ["domain", "application"]
presentation = ["domain", "application", "infrastructure"]

# Agent Steering: プロジェクト全体のルール（AI が強制参照）
# plan / impl 実行時に AI へのコンテキストに含める
[steering]
codingStandards = "ESLint + Prettier を推奨。型定義は厳格に。"
technologyStack = "TypeScript, Node.js 18+"
designPrinciples = "ヘキサゴナルアーキテクチャを厳守。依存性は内側に向ける。"
`;

export function initCommand(): Command {
  const cmd = new Command("init")
    .description("プロジェクトの初期化と憲法ファイルの生成")
    .option("-p, --pattern <pattern>", "テンプレート: hexagonal | mvc", "hexagonal")
    .option("-f, --force", "既存ファイルを上書き", false)
    .option("--format <format>", "出力形式: text | json（CI/AI 連携用）", "text")
    .action(async (options: { pattern?: string; force?: boolean; format?: string }) => {
      const cwd = process.cwd();
      const specDir = path.join(cwd, ".spec");
      const constitutionPath = path.join(specDir, "constitution.toml");

      const fileSystem = new LocalFileSystemAdapter();
      const exists = await fileSystem.exists(constitutionPath);

      if (exists && !options.force) {
        console.error("❌ .spec/constitution.toml が既に存在します。--force で上書きできます。");
        process.exit(1);
      }

      const template = options.pattern === "mvc" ? HEXAGONAL_TEMPLATE : HEXAGONAL_TEMPLATE;
      await fileSystem.writeFile(constitutionPath, template);

      const format = options.format ?? "text";
      if (format === "json") {
        console.log(
          JSON.stringify({
            status: "ok",
            specDir: ".spec",
            constitutionPath: ".spec/constitution.toml",
          })
        );
      } else {
        console.log("✅ 初期化完了: .spec/constitution.toml を生成しました。");
      }
    });

  return cmd;
}
