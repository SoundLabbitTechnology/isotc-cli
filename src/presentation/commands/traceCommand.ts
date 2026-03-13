import { Command } from "commander";
import * as path from "path";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { TypeScriptSymbolExtractor } from "../../infrastructure/adapters/typeScriptSymbolExtractor";
import { BuildTraceUseCase } from "../../application/usecases/buildTraceUseCase";
import { TraceDiffUseCase } from "../../application/usecases/traceDiffUseCase";
import { TraceExplainUseCase } from "../../application/usecases/traceExplainUseCase";

export function traceCommand(): Command {
  const cmd = new Command("trace")
    .description("トレーサビリティグラフの構築と照会")
    .addCommand(createBuildSubcommand())
    .addCommand(createDiffSubcommand())
    .addCommand(createExplainSubcommand());

  return cmd;
}

function createBuildSubcommand(): Command {
  return new Command("build")
    .description("requirements + tasks + AST から trace.json を生成")
    .action(async () => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();
      const symbolExtractor = new TypeScriptSymbolExtractor();
      const useCase = new BuildTraceUseCase(fileSystem, symbolExtractor);

      try {
        const graph = await useCase.execute(cwd);
        const tracePath = path.join(cwd, ".spec", "trace.json");
        await fileSystem.writeFile(
          tracePath,
          JSON.stringify(graph, null, 2)
        );
        console.error(`✅ .spec/trace.json を生成しました（ノード: ${graph.nodes.length}, エッジ: ${graph.edges.length}）`);
      } catch (e) {
        console.error(`❌ エラー: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    });
}

function createDiffSubcommand(): Command {
  return new Command("diff")
    .description("変更ファイルから影響する requirement / test を列挙")
    .option("-f, --files <paths...>", "変更されたファイルパス")
    .action(async (options: { files?: string[] }) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();
      const useCase = new TraceDiffUseCase(fileSystem);
      const files = options.files ?? [];
      if (files.length === 0) {
        console.error("❌ -f/--files で変更ファイルを指定してください。");
        process.exit(1);
      }
      try {
        const result = await useCase.execute(cwd, files);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.error(`❌ エラー: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    });
}

function createExplainSubcommand(): Command {
  return new Command("explain")
    .description("ファイルまたは違反がどの要件にぶつかるかを返す")
    .argument("<target>", "ファイルパスまたはノード ID")
    .action(async (target: string) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();
      const useCase = new TraceExplainUseCase(fileSystem);
      try {
        const result = await useCase.execute(cwd, target);
        if (!result) {
          console.error(`❌ トレースが見つかりません。isotc trace build を先に実行してください。`);
          process.exit(1);
        }
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.error(`❌ エラー: ${e instanceof Error ? e.message : String(e)}`);
        process.exit(1);
      }
    });
}
