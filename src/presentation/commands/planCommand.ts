import { Command } from "commander";

export function planCommand(): Command {
  const cmd = new Command("plan")
    .description("要件からの技術設計とタスク（DAG）分解")
    .option("--approve", "対話確認をスキップし自動で設計を確定", false)
    .action(async (options) => {
      // TODO: 構造化要件の読み込み、LLM による設計生成、tasks.json / design.md 出力
      console.error("plan コマンドは未実装です。");
      process.exit(1);
    });

  return cmd;
}
