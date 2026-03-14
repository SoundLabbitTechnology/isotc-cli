import { Command } from "commander";
import * as path from "path";
import * as toml from "@iarna/toml";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { createLlmAdapter } from "../../infrastructure/adapters/llmAdapterFactory";
import {
  loadLlmConfig,
  getEffectiveProvider,
  getEffectiveModel,
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
        const provider = getEffectiveProvider(cwd, config);
        const model = getEffectiveModel(provider, config);
        const llmAdapter = createLlmAdapter({ provider, model });
        const useCase = new GeneratePlanUseCase(llmAdapter, fileSystem);
        const result = await useCase.execute(requirements, constitution);

        await fileSystem.writeFile(
          path.join(specDir, "tasks.json"),
          JSON.stringify({ tasks: result.tasks }, null, 2)
        );
        await fileSystem.writeFile(
          path.join(specDir, "design.md"),
          result.designMd || "# 技術設計\n\n（生成中）\n"
        );

        const adrDir = path.join(specDir, "adr");
        const adrSlug = result.adrTitle
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf-]/g, "");
        const adrPath = path.join(adrDir, `0001-${adrSlug}.md`);
        await fileSystem.writeFile(adrPath, result.adrContent || "# ADR-0001\n\n（生成中）\n");

        await fileSystem.writeFile(
          path.join(specDir, "model.puml"),
          result.modelPuml || "@startuml\n' クラス図\n@enduml\n"
        );
        await fileSystem.writeFile(
          path.join(specDir, "testplan.json"),
          JSON.stringify({ testplan: result.testplan }, null, 2)
        );
        await fileSystem.writeFile(
          path.join(specDir, "trace-seed.json"),
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
