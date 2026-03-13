import { Command } from "commander";
import * as path from "path";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { OpenAILlmAdapter } from "../../infrastructure/adapters/openAILlmAdapter";
import { ExtractIntentUseCase } from "../../application/usecases/extractIntentUseCase";
import { renderOpenQuestionsMarkdown } from "../../application/services/intentOutputRenderer";
import { renderAssumptionsToml } from "../../application/services/intentOutputRenderer";

export function intentCommand(): Command {
  const cmd = new Command("intent")
    .description("自然言語要件から構造化要件（Requirements）の生成")
    .argument("[requirement]", "要件テキスト（自然言語）")
    .option("-f, --file <path>", "要件ファイルパス（長文向け）")
    .action(async (requirement: string | undefined, options: { file?: string }) => {
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

      try {
        const llmAdapter = new OpenAILlmAdapter();
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

        console.error(`✅ .spec/requirements.json を生成しました（FR: ${frCount}, NFR: ${nfrCount}）`);
        console.error(`✅ .spec/open_questions.md を生成しました（未解決: ${oqCount} 件）`);
        console.error(`✅ .spec/assumptions.toml を生成しました`);

        if (oqCount > 0) {
          console.error(`\n⚠️ 未解決の質問が ${oqCount} 件あります。解決後に isotc plan を実行してください。`);
        }
      } catch (e) {
        console.error(`❌ エラー: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    });

  return cmd;
}
