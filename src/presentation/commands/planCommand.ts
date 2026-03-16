import { Command } from "commander";
import * as path from "path";
import * as toml from "@iarna/toml";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { createLlmAdapter } from "../../infrastructure/adapters/llmAdapterFactory";
import {
  loadLlmConfig,
  getEffectiveProvider,
  getEffectiveModel,
  getEffectiveMode,
} from "../../application/services/configLoader";
import { Constitution } from "../../domain/entities/constitution";
import { RequirementsDocument } from "../../domain/entities/requirements";
import { GeneratePlanUseCase } from "../../application/usecases/generatePlanUseCase";

export function planCommand(): Command {
  const cmd = new Command("plan")
    .description("要件からの技術設計とタスク（DAG）分解")
    .option("--approve", "対話確認をスキップし自動で設計を確定", false)
    .option("--force", "未解決の質問があっても強制実行", false)
    .option("--format <format>", "出力形式: text | json（CI/AI 連携用）", "text")
    .action(async (options: { approve?: boolean; force?: boolean; format?: string }) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();
      const specDir = path.join(cwd, ".spec");

      const requirementsPath = path.join(specDir, "requirements.json");
      const constitutionPath = path.join(specDir, "constitution.toml");

      if (!(await fileSystem.exists(requirementsPath))) {
        console.error("❌ .spec/requirements.json が見つかりません。isotc intent を先に実行してください。");
        process.exit(1);
      }

      let requirements: RequirementsDocument;
      try {
        const raw = await fileSystem.readFile(requirementsPath);
        requirements = JSON.parse(raw) as RequirementsDocument;
      } catch (e) {
        console.error("❌ requirements.json の読み込みに失敗しました:", e);
        process.exit(1);
      }

      if (
        !options.force &&
        requirements.openQuestionIds &&
        requirements.openQuestionIds.length > 0
      ) {
        console.error(
          `❌ 未解決の質問が ${requirements.openQuestionIds.length} 件あります。open_questions.md を解決するか、--force で強制実行してください。`
        );
        process.exit(1);
      }

      let constitution: Constitution = { layers: [], rules: {} };
      if (await fileSystem.exists(constitutionPath)) {
        try {
          const raw = await fileSystem.readFile(constitutionPath);
          constitution = toml.parse(raw) as unknown as Constitution;
        } catch {
          console.error("⚠️ constitution.toml の読み込みに失敗。デフォルトで続行します。");
        }
      }

      try {
        const config = await loadLlmConfig(cwd);
        const mode = getEffectiveMode(config);

        const tasksPath = path.join(specDir, "tasks.json");
        const designPath = path.join(specDir, "design.md");
        const adrDir = path.join(specDir, "adr");
        const modelPath = path.join(specDir, "model.puml");
        const testplanPath = path.join(specDir, "testplan.json");
        const traceSeedPath = path.join(specDir, "trace-seed.json");
        const agentDir = path.join(specDir, "agent");
        const planPromptPath = path.join(agentDir, "plan-prompt.md");

        if (mode === "agent") {
          // Agent モード: スケルトン成果物と plan 用プロンプト雛形のみ生成
          await fileSystem.writeFile(
            tasksPath,
            JSON.stringify({ tasks: [] }, null, 2)
          );
          await fileSystem.writeFile(
            designPath,
            "# 技術設計 (agent mode skeleton)\n\nTODO: IDE エージェントがここに設計を書き込みます。\n"
          );

          const adrSkeletonPath = path.join(adrDir, "0001-agent-mode.md");
          await fileSystem.writeFile(
            adrSkeletonPath,
            [
              "# ADR-0001: Agent モードでの計画生成",
              "",
              "この ADR は、isotc-cli の plan コマンドを mode=agent で実行した際の設計・タスク分解を IDE エージェント側で行う方針を記録するためのスケルトンです。",
              "",
              "TODO: IDE エージェント／人間がこのファイルを更新し、実際のアーキテクチャ判断を書き込んでください。",
              "",
            ].join("\n")
          );

          await fileSystem.writeFile(
            modelPath,
            "@startuml\n' Agent モード用のモデル図スケルトンです。IDE エージェントが編集してください。\n@enduml\n"
          );
          await fileSystem.writeFile(
            testplanPath,
            JSON.stringify({ testplan: [] }, null, 2)
          );
          await fileSystem.writeFile(
            traceSeedPath,
            JSON.stringify({ requirementTaskEdges: [] }, null, 2)
          );

          await fileSystem.ensureDir(agentDir);
          const planPrompt = [
            "# isotc plan (mode=agent) isolated prompt",
            "",
            "あなたは isotc-cli と協調して作業する IDE エージェントです。",
            "",
            "## あなたの役割",
            "",
            "- `.spec/requirements.json` を読み、技術設計とタスク分解を行います。",
            "- `.spec/tasks.json`, `.spec/design.md`, `.spec/adr/*`, `.spec/model.puml`, `.spec/testplan.json`, `.spec/trace-seed.json` を更新します。",
            "",
            "## ゴール",
            "",
            "- requirements に基づき、タスクDAG（tasks.json）と対応する設計・テスト計画を作成してください。",
            "- 各タスクは後続の `isotc impl` / `isotc verify` が扱いやすい粒度に分解してください。",
            "",
            "## 手順のヒント",
            "",
            "1. `.spec/requirements.json` を読み、FR/NFR を理解します。",
            "2. `.spec/constitution.toml` のレイヤーと依存ルールを確認します。",
            "3. tasks.json にタスクの一覧と依存関係を JSON Schema に沿って記述します。",
            "4. design.md にシステム構成・データフロー・レイヤー間の責務分担を書きます。",
            "5. 必要であれば `.spec/adr/*` にアーキテクチャ判断を追記します。",
            "6. testplan.json に要件→テストケースの対応を記述します。",
            "7. trace-seed.json に requirements と tasks の対応付けを記述します。",
            "",
            "## 重要",
            "",
            "- mode=agent では LLM API キーは不要であり、あなたがこれらのファイルを直接編集する前提です。",
            "- 既存の JSON/TOML/PlantUML の形式を崩さないようにしてください。",
            "",
            "完了したら、人間または呼び出し元エージェントに「plan の成果物を更新しました」と伝えてください。",
            "",
          ].join("\n");
          await fileSystem.writeFile(planPromptPath, planPrompt);

          const format = options.format ?? "text";
          if (format === "json") {
            console.log(
              JSON.stringify({
                status: "ok",
                mode: "agent",
                tasksPath: ".spec/tasks.json",
                designPath: ".spec/design.md",
                adrDir: ".spec/adr",
                modelPath: ".spec/model.puml",
                testplanPath: ".spec/testplan.json",
                traceSeedPath: ".spec/trace-seed.json",
                planPromptPath: ".spec/agent/plan-prompt.md",
              })
            );
          } else {
            console.error("✅ Agent モードで plan 用のスケルトン成果物を生成しました");
            console.error("✅ .spec/agent/plan-prompt.md を生成しました（IDE エージェントに貼り付けてください）");
          }
          return;
        }

        const provider = getEffectiveProvider(cwd, config);
        const model = getEffectiveModel(provider, config);
        const llmAdapter = createLlmAdapter({ provider, model });
        const useCase = new GeneratePlanUseCase(llmAdapter, fileSystem);
        const result = await useCase.execute(requirements, constitution);

        await fileSystem.writeFile(
          tasksPath,
          JSON.stringify({ tasks: result.tasks }, null, 2)
        );
        await fileSystem.writeFile(
          designPath,
          result.designMd || "# 技術設計\n\n（生成中）\n"
        );

        const adrSlug = result.adrTitle
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, "");
        const adrPath = path.join(adrDir, `0001-${adrSlug}.md`);
        await fileSystem.writeFile(adrPath, result.adrContent || "# ADR-0001\n\n（生成中）\n");

        await fileSystem.writeFile(
          modelPath,
          result.modelPuml || "@startuml\n' クラス図\n@enduml\n"
        );
        await fileSystem.writeFile(
          testplanPath,
          JSON.stringify({ testplan: result.testplan }, null, 2)
        );
        await fileSystem.writeFile(
          traceSeedPath,
          JSON.stringify(
            { requirementTaskEdges: result.requirementTaskEdges },
            null,
            2
          )
        );

        const format = options.format ?? "text";
        if (format === "json") {
          console.log(
            JSON.stringify({
              status: "ok",
              tasksPath: ".spec/tasks.json",
              taskCount: result.tasks.length,
              designPath: ".spec/design.md",
              testplanPath: ".spec/testplan.json",
              traceSeedPath: ".spec/trace-seed.json",
            })
          );
        } else {
          console.error(`✅ .spec/tasks.json を生成しました（タスク: ${result.tasks.length}）`);
          console.error(`✅ .spec/design.md を生成しました`);
          console.error(`✅ .spec/adr/0001-*.md を生成しました`);
          console.error(`✅ .spec/model.puml を生成しました`);
          console.error(`✅ .spec/testplan.json を生成しました`);
          console.error(`✅ .spec/trace-seed.json を生成しました`);
        }
      } catch (e) {
        console.error(`❌ エラー: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    });

  return cmd;
}
