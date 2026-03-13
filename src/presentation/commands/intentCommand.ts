import { Command } from "commander";

export function intentCommand(): Command {
  const cmd = new Command("intent")
    .description("自然言語要件から構造化要件（Requirements）の生成")
    .argument("<requirement>", "要件テキスト（自然言語）")
    .action(async (requirement: string) => {
      // TODO: LLM による構造化、.spec/requirements.json への保存
      console.error("intent コマンドは未実装です。");
      process.exit(1);
    });

  return cmd;
}
