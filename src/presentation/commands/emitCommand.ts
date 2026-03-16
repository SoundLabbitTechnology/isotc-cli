import { Command } from "commander";
import * as path from "path";
import * as toml from "@iarna/toml";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { Constitution } from "../../domain/entities/constitution";

function buildLayersBlock(constitution: Constitution): string {
  return constitution.layers?.length > 0
    ? constitution.layers.map((l) => `- ${l.name}: \`${l.basePath}\``).join("\n")
    : "（レイヤー未定義）";
}

function buildRulesBlock(constitution: Constitution): string {
  return constitution.rules && Object.keys(constitution.rules).length > 0
    ? Object.entries(constitution.rules)
        .map(([layer, allowed]) => `- ${layer}: ${allowed?.length ? allowed.join(", ") : "なし"} に依存可`)
        .join("\n")
    : "（ルール未定義）";
}

function buildSteeringBlock(constitution: Constitution): string {
  return constitution.steering && Object.keys(constitution.steering).length > 0
    ? Object.entries(constitution.steering)
        .filter(([, v]) => v != null && v !== "")
        .map(([k, v]) => `- ${k}: ${v}`)
        .join("\n")
    : "";
}

const VERIFY_INSTRUCTIONS = `
## 検証コマンド

- アーキテクチャ検証: \`npx isotc-cli@latest verify --format json\`
- CI / 実装後は必ず \`--format json\` を指定すること。`;

function buildCopilotInstructions(constitution: Constitution): string {
  const layersBlock = buildLayersBlock(constitution);
  const rulesBlock = buildRulesBlock(constitution);
  const steeringBlock = buildSteeringBlock(constitution);

  return `# isotc-cli — GitHub Copilot 向け指示（constitution から生成）

## アーキテクチャ規約（憲法）

### レイヤー
${layersBlock}

### 依存ルール
${rulesBlock}
${steeringBlock ? `\n### Agent Steering\n${steeringBlock}` : ""}

## ビルド・テスト・検証の正解コマンド

- **ビルド**: \`npm ci && npm run build\`
- **テスト**: \`npm test\`
- **アーキテクチャ検証**: \`npx isotc-cli@latest verify --format json\`

## 開発フロー

1. 依存関係インストール: \`npm ci\`
2. ビルド: \`npm run build\`
3. テスト実行: \`npm test\`
4. 検証実行: \`npx isotc-cli@latest verify --format json\`

検証は必ず \`--format json\` を指定すること。stdout に機械可読な JSON が出力される。
`;
}

function buildClaudeInstructions(constitution: Constitution): string {
  const layersBlock = buildLayersBlock(constitution);
  const rulesBlock = buildRulesBlock(constitution);
  const steeringBlock = buildSteeringBlock(constitution);

  return `# isotc-cli — Claude Code 向け指示（constitution から生成）

## アーキテクチャ規約（憲法）

### レイヤー
${layersBlock}

### 依存ルール
${rulesBlock}
${steeringBlock ? `\n### Agent Steering\n${steeringBlock}` : ""}

## 厳守事項

- 内側のレイヤーは外側のレイヤーを直接 import できません。依存性注入を用い、interface を内側のレイヤーに定義してください。
- 実装後は必ず \`npx isotc-cli@latest verify --format json\` で検証すること。
${VERIFY_INSTRUCTIONS}
`;
}

function buildAgentMarkdown(constitution: Constitution): string {
  const layersBlock = buildLayersBlock(constitution);
  const rulesBlock = buildRulesBlock(constitution);
  const steeringBlock = buildSteeringBlock(constitution);

  return `# isotc-cli — Agent 向け指示（constitution から生成）

## アーキテクチャ規約（憲法）

### レイヤー
${layersBlock}

### 依存ルール
${rulesBlock}
${steeringBlock ? `\n### Agent Steering\n${steeringBlock}` : ""}

## 検証

実装後は \`npx isotc-cli@latest verify --format json\` で検証すること。

## モード

- LLM 直呼びモード: intent / plan が OpenAI / Gemini / Claude を直接呼び出します。
- Agent モード: intent / plan は LLM を呼ばず、.spec/requirements.json や .spec/tasks.json などのスケルトンと、IDE エージェント向けのプロンプト（.spec/agent/*.md）を生成します。

Agent モードでは API キーが不要であり、IDE 側のエージェント（Cursor など）が .spec/ 配下のファイルを読み書きする前提で動作します。
`;
}

export function emitCommand(): Command {
  const cmd = new Command("emit")
    .description("constitution から Agent 環境向けの設定ファイルを生成する");

  cmd
    .command("copilot")
    .description(".github/copilot-instructions.md を constitution から生成")
    .option("-f, --force", "既存ファイルを上書き", false)
    .option("--format <format>", "出力形式: text | json", "text")
    .action(async (options: { force?: boolean; format?: string }) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();
      const constitutionPath = path.join(cwd, ".spec", "constitution.toml");
      const outputPath = path.join(cwd, ".github", "copilot-instructions.md");

      if (!(await fileSystem.exists(constitutionPath))) {
        console.error("❌ .spec/constitution.toml が見つかりません。isotc init を先に実行してください。");
        process.exit(1);
      }

      let constitution: Constitution = { layers: [], rules: {} };
      try {
        const raw = await fileSystem.readFile(constitutionPath);
        constitution = toml.parse(raw) as unknown as Constitution;
      } catch (e) {
        console.error("❌ constitution.toml の読み込みに失敗しました:", e);
        process.exit(1);
      }

      const exists = await fileSystem.exists(outputPath);
      if (exists && !options.force) {
        console.error("❌ .github/copilot-instructions.md が既に存在します。--force で上書きできます。");
        process.exit(1);
      }

      const content = buildCopilotInstructions(constitution);
      await fileSystem.writeFile(outputPath, content);

      const format = options.format ?? "text";
      if (format === "json") {
        console.log(
          JSON.stringify({
            status: "ok",
            outputPath: ".github/copilot-instructions.md",
          })
        );
      } else {
        console.log("✅ .github/copilot-instructions.md を生成しました。");
      }
    });

  cmd
    .command("claude")
    .description("CLAUDE.md を constitution から生成（Claude Code 用）")
    .option("-f, --force", "既存ファイルを上書き", false)
    .option("--format <format>", "出力形式: text | json", "text")
    .action(async (options: { force?: boolean; format?: string }) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();
      const constitutionPath = path.join(cwd, ".spec", "constitution.toml");
      const outputPath = path.join(cwd, "CLAUDE.md");

      if (!(await fileSystem.exists(constitutionPath))) {
        console.error("❌ .spec/constitution.toml が見つかりません。isotc init を先に実行してください。");
        process.exit(1);
      }

      let constitution: Constitution = { layers: [], rules: {} };
      try {
        const raw = await fileSystem.readFile(constitutionPath);
        constitution = toml.parse(raw) as unknown as Constitution;
      } catch (e) {
        console.error("❌ constitution.toml の読み込みに失敗しました:", e);
        process.exit(1);
      }

      const exists = await fileSystem.exists(outputPath);
      if (exists && !options.force) {
        console.error("❌ CLAUDE.md が既に存在します。--force で上書きできます。");
        process.exit(1);
      }

      const content = buildClaudeInstructions(constitution);
      await fileSystem.writeFile(outputPath, content);

      const format = options.format ?? "text";
      if (format === "json") {
        console.log(JSON.stringify({ status: "ok", outputPath: "CLAUDE.md" }));
      } else {
        console.log("✅ CLAUDE.md を生成しました。");
      }
    });

  cmd
    .command("agents")
    .description(".github/agents/ に Agent 向け指示を生成")
    .option("-f, --force", "既存ファイルを上書き", false)
    .option("--format <format>", "出力形式: text | json", "text")
    .action(async (options: { force?: boolean; format?: string }) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();
      const constitutionPath = path.join(cwd, ".spec", "constitution.toml");
      const agentsDir = path.join(cwd, ".github", "agents");
      const outputPath = path.join(agentsDir, "architecture.agent.md");

      if (!(await fileSystem.exists(constitutionPath))) {
        console.error("❌ .spec/constitution.toml が見つかりません。isotc init を先に実行してください。");
        process.exit(1);
      }

      let constitution: Constitution = { layers: [], rules: {} };
      try {
        const raw = await fileSystem.readFile(constitutionPath);
        constitution = toml.parse(raw) as unknown as Constitution;
      } catch (e) {
        console.error("❌ constitution.toml の読み込みに失敗しました:", e);
        process.exit(1);
      }

      const exists = await fileSystem.exists(outputPath);
      if (exists && !options.force) {
        console.error("❌ .github/agents/architecture.agent.md が既に存在します。--force で上書きできます。");
        process.exit(1);
      }

      const content = buildAgentMarkdown(constitution);
      await fileSystem.writeFile(outputPath, content);

      const format = options.format ?? "text";
      if (format === "json") {
        console.log(
          JSON.stringify({
            status: "ok",
            outputPath: ".github/agents/architecture.agent.md",
          })
        );
      } else {
        console.log("✅ .github/agents/architecture.agent.md を生成しました。");
      }
    });

  return cmd;
}
