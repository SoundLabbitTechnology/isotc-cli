import { Command } from "commander";
import * as path from "path";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { createLlmAdapter } from "../../infrastructure/adapters/llmAdapterFactory";
import {
  loadLlmConfig,
  getEffectiveProvider,
  getEffectiveModel,
  getEffectiveMode,
} from "../../application/services/configLoader";
import { ExtractIntentUseCase } from "../../application/usecases/extractIntentUseCase";
import { renderOpenQuestionsMarkdown } from "../../application/services/intentOutputRenderer";
import { renderAssumptionsToml } from "../../application/services/intentOutputRenderer";

export function intentCommand(): Command {
  const cmd = new Command("intent")
    .description("自然言語要件から構造化要件（Requirements）の生成")
    .argument("[requirement]", "要件テキスト（自然言語）")
    .option("-f, --file <path>", "要件ファイルパス（長文向け）")
    .option("--format <format>", "出力形式: text | json（CI/AI 連携用）", "text")
    .action(async (requirement: string | undefined, options: { file?: string; format?: string }) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();

      let requirementText: string;
      if (options.file) {
        const filePath = path.resolve(cwd, options.file);
        try {
          requirementText = await fileSystem.readFile(filePath);
        } catch (e) {
          console.error(`❌ ファイルの読み込みに失敗しました: ${options.file}`);
          process.exit(1);
        }
      } else if (requirement && requirement.trim()) {
        requirementText = requirement.trim();
      } else {
        console.error("❌ 要件テキストまたは --file オプションを指定してください。");
        process.exit(1);
      }

      const specDir = path.join(cwd, ".spec");
      const requirementsPath = path.join(specDir, "requirements.json");
      const openQuestionsPath = path.join(specDir, "open_questions.md");
      const assumptionsPath = path.join(specDir, "assumptions.toml");
      const agentDir = path.join(specDir, "agent");
      const intentPromptPath = path.join(agentDir, "intent-prompt.md");

      try {
        const config = await loadLlmConfig(cwd);
        const mode = getEffectiveMode(config);

        if (mode === "agent") {
          // Agent モード: requirements スケルトンと Intent 用プロンプト雛形のみ生成
          const requirementsSkeleton = {
            title: "Project Requirements (skeleton)",
            description: "IDE エージェントが埋めるための requirements スケルトンです。",
            functionalRequirements: [],
            nonFunctionalRequirements: [],
            openQuestionIds: [],
          };

          await fileSystem.writeFile(
            requirementsPath,
            JSON.stringify(requirementsSkeleton, null, 2)
          );
          await fileSystem.writeFile(
            openQuestionsPath,
            "# Open Questions (agent mode)\n\n- TODO: IDE エージェントがここに未解決の質問を整理します。\n"
          );
          await fileSystem.writeFile(
            assumptionsPath,
            '[[assumptions]]\nkey = "agent-mode"\nvalue = "requirements は IDE エージェントによってこのスキーマに従って埋められます。"\n'
          );

          // .spec/agent ディレクトリと intent 用プロンプト
          await fileSystem.ensureDir(agentDir);
          const intentPrompt = [
            "# isotc intent (mode=agent) isolated prompt",
            "",
            "あなたはこのリポジトリの仕様コンパイラ isotc-cli と協調して作業する IDE エージェントです。",
            "",
            "## あなたの役割",
            "",
            "- `.spec/constitution.toml` に定義されたレイヤー構成と依存ルールを尊重します。",
            "- プロジェクトの既存コードやドキュメントを読み、.spec/requirements.json を埋める役割を担います。",
            "- open_questions.md / assumptions.toml も必要に応じて更新します。",
            "",
            "## ゴール",
            "",
            "- 自然言語で与えられた要件テキストを読み、`docs/requirements.schema.json` に準拠した `.spec/requirements.json` を完成させてください。",
            "- 必要なら `.spec/open_questions.md` に未解決の疑問を箇条書きで追加してください。",
            "- 前提・制約は `.spec/assumptions.toml` に追記してください。",
            "",
            "## 手順のヒント",
            "",
            "1. プロジェクトルートのドキュメントを確認します（README, docs/*.md など）。",
            "2. `.spec/constitution.toml` を読み、このプロジェクトのアーキテクチャ境界を把握します。",
            "3. `.spec/requirements.json` のスケルトンを開き、FR/NFR を埋めてください。",
            "4. 不明点があれば `.spec/open_questions.md` に日本語で列挙してください。",
            "5. 仮定した前提があれば `.spec/assumptions.toml` に TOML 形式で追記してください。",
            "",
            "## 重要",
            "",
            "- このプロンプトは isotc intent の Agent モード用であり、LLM API キーなしで利用されます。",
            "- 最終的な JSON/TOML の形式は既存のスキーマに合わせてください。",
            "",
            "完了したら、人間または呼び出し元エージェントに「requirements.json を更新しました」と伝えてください。",
            "",
          ].join("\n");
          await fileSystem.writeFile(intentPromptPath, intentPrompt);

          const format = options.format ?? "text";
          if (format === "json") {
            console.log(
              JSON.stringify({
                status: "ok",
                mode: "agent",
                requirementsPath: ".spec/requirements.json",
                openQuestionsPath: ".spec/open_questions.md",
                assumptionsPath: ".spec/assumptions.toml",
                intentPromptPath: ".spec/agent/intent-prompt.md",
              })
            );
          } else {
            console.error("✅ Agent モードで .spec/requirements.json のスケルトンを生成しました");
            console.error("✅ .spec/open_questions.md / assumptions.toml のテンプレートを生成しました");
            console.error("✅ .spec/agent/intent-prompt.md を生成しました（IDE エージェントに貼り付けてください）");
          }
          return;
        }

        const provider = getEffectiveProvider(cwd, config);
        const model = getEffectiveModel(provider, config);
        const llmAdapter = createLlmAdapter({ provider, model });
        const useCase = new ExtractIntentUseCase(llmAdapter, fileSystem);
        const result = await useCase.execute(requirementText);

        await fileSystem.writeFile(
          requirementsPath,
          JSON.stringify(result.requirements, null, 2)
        );
        await fileSystem.writeFile(
          openQuestionsPath,
          renderOpenQuestionsMarkdown(result.openQuestions)
        );
        await fileSystem.writeFile(
          assumptionsPath,
          renderAssumptionsToml(result.assumptions)
        );

        const frCount = result.requirements.functionalRequirements.length;
        const nfrCount = result.requirements.nonFunctionalRequirements.length;
        const oqCount = result.openQuestions.length;

        const format = options.format ?? "text";
        if (format === "json") {
          console.log(
            JSON.stringify({
              status: "ok",
              requirementsPath: ".spec/requirements.json",
              openQuestionsPath: ".spec/open_questions.md",
              assumptionsPath: ".spec/assumptions.toml",
              functionalRequirementsCount: frCount,
              nonFunctionalRequirementsCount: nfrCount,
              openQuestionsCount: oqCount,
            })
          );
        } else {
          console.error(`✅ .spec/requirements.json を生成しました（FR: ${frCount}, NFR: ${nfrCount}）`);
          console.error(`✅ .spec/open_questions.md を生成しました（未解決: ${oqCount} 件）`);
          console.error(`✅ .spec/assumptions.toml を生成しました`);
          if (oqCount > 0) {
            console.error(`\n⚠️ 未解決の質問が ${oqCount} 件あります。解決後に isotc plan を実行してください。`);
          }
        }
      } catch (e) {
        console.error(`❌ エラー: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    });

  return cmd;
}
