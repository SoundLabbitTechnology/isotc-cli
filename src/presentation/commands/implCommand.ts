import { Command } from "commander";

export function implCommand(): Command {
  const cmd = new Command("impl")
    .description("指定タスクの隔離環境での実装（AIエージェントへの委譲）")
    .requiredOption("-t, --task-id <id>", "実装対象タスクのID")
    .option("-a, --agent <name>", "委譲先AIエージェント: aider | cline", "aider")
    .action(async (options) => {
      // TODO: tasks.json 読み込み、隔離環境の構築、AIエージェントの起動
      console.error("impl コマンドは未実装です。");
      process.exit(1);
    });

  return cmd;
}
