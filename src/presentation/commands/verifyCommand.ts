import { Command } from "commander";
import * as path from "path";
import * as toml from "@iarna/toml";
import { VerifyArchitectureUseCase } from "../../application/usecases/verifyArchitectureUseCase";
import { TypeScriptAstAdapter } from "../../infrastructure/adapters/typeScriptAstAdapter";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { Constitution } from "../../domain/entities/constitution";
import { JsonFormatter } from "../formatters/jsonFormatter";
import { TextFormatter } from "../formatters/textFormatter";
import { IOutputFormatter } from "../formatters/outputFormatter";

const EXIT_SUCCESS = 0;
const EXIT_VERIFICATION_FAILED = 2;
const EXIT_FATAL = 3;

export function verifyCommand(): Command {
  const cmd = new Command("verify")
    .description("アーキテクチャおよび仕様の検証。違反時は反例（進化圧）を出力")
    .option("-f, --format <format>", "出力形式: text | json", "text")
    .option("--auto-fix", "自動修正を試行（将来拡張）", false)
    .action(async (options) => {
      const startTime = Date.now();
      const cwd = process.cwd();
      const specPath = path.join(cwd, ".spec", "constitution.toml");

      const fileSystem = new LocalFileSystemAdapter();
      const constitutionExists = await fileSystem.exists(specPath);

      if (!constitutionExists) {
        console.error("❌ .spec/constitution.toml が見つかりません。isotc init を実行してください。");
        process.exit(EXIT_FATAL);
      }

      let constitution: Constitution;
      try {
        const raw = fileSystem.readFileSync(specPath);
        constitution = toml.parse(raw) as unknown as Constitution;
      } catch (err) {
        console.error("❌ 憲法ファイルの読み込みに失敗しました:", err);
        process.exit(EXIT_FATAL);
      }

      const astParser = new TypeScriptAstAdapter();
      const useCase = new VerifyArchitectureUseCase(astParser);
      const violations = useCase.execute(cwd, constitution);

      const durationMs = Date.now() - startTime;
      const formatter: IOutputFormatter =
        options.format === "json" ? new JsonFormatter() : new TextFormatter();
      const output = formatter.format(violations, constitution, durationMs);

      // JSON 時は stdout に純粋な JSON のみ。テキスト時も stdout
      console.log(output);

      if (violations.length > 0) {
        process.exit(EXIT_VERIFICATION_FAILED);
      }
      process.exit(EXIT_SUCCESS);
    });

  return cmd;
}
