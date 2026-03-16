import { Command } from "commander";
import * as path from "path";
import * as toml from "@iarna/toml";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { Constitution } from "../../domain/entities/constitution";
import { loadLlmConfig, getEffectiveMode } from "../../application/services/configLoader";

interface TaskEntry {
  id: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

interface TasksFile {
  tasks?: TaskEntry[];
  [key: string]: unknown;
}

export function implCommand(): Command {
  const cmd = new Command("impl")
    .description("指定タスクの隔離環境での実装（AIエージェントへの委譲）")
    .requiredOption("-t, --task-id <id>", "実装対象タスクのID")
    .option("-a, --agent <name>", "委譲先AIエージェント: aider | cline", "aider")
    .option("--isolated-prompt", "タスク単位の隔離プロンプトを stdout に出力（コンテキストクリア用）", false)
    .action(async (options) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();

      if (options.isolatedPrompt) {
        const tasksPath = path.join(cwd, ".spec", "tasks.json");
        const constitutionPath = path.join(cwd, ".spec", "constitution.toml");

        if (!(await fileSystem.exists(tasksPath))) {
          console.error("❌ .spec/tasks.json が見つかりません。isotc plan を先に実行してください。");
          process.exit(1);
        }

        let tasksData: TasksFile;
        try {
          const raw = fileSystem.readFileSync(tasksPath);
          tasksData = JSON.parse(raw) as TasksFile;
        } catch (err) {
          console.error("❌ tasks.json の読み込みに失敗しました:", err);
          process.exit(1);
        }

        const tasks = tasksData.tasks ?? [];
        const task = tasks.find((t) => t.id === options.taskId);
        if (!task) {
          console.error(`❌ タスク ID "${options.taskId}" が見つかりません。`);
          process.exit(1);
        }

        let constitutionSummary = "";
        if (await fileSystem.exists(constitutionPath)) {
          try {
            const constitutionRaw = fileSystem.readFileSync(constitutionPath);
            const constitution = toml.parse(constitutionRaw) as unknown as Constitution;
            constitutionSummary = buildConstitutionSummary(constitution);
          } catch {
            constitutionSummary = "（憲法の読み込みに失敗）";
          }
        }

        const config = await loadLlmConfig(cwd);
        const mode = getEffectiveMode(config);
        const prompt = buildIsolatedPrompt(task, constitutionSummary, mode);
        console.log(prompt);
        process.exit(0);
      }

      console.error("impl コマンドは未実装です。--isolated-prompt で隔離プロンプトの生成のみ利用できます。");
      process.exit(1);
    });

  return cmd;
}

function buildConstitutionSummary(constitution: Constitution): string {
  const layers = constitution.layers?.map((l) => `- ${l.name}: ${l.basePath}`).join("\n") ?? "";
  const rules =
    constitution.rules &&
    Object.entries(constitution.rules)
      .map(([layer, allowed]) => `- ${layer} は ${allowed.length ? allowed.join(", ") : "なし"} に依存可`)
      .join("\n");
  let steeringBlock = "";
  if (constitution.steering && Object.keys(constitution.steering).length > 0) {
    const steeringLines = Object.entries(constitution.steering)
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    steeringBlock = `\n\n【Agent Steering】\n${steeringLines}`;
  }
  return `【憲法（アーキテクチャ規約）】\nレイヤー:\n${layers}\n\n依存ルール:\n${rules ?? ""}${steeringBlock}`;
}

function buildIsolatedPrompt(
  task: TaskEntry,
  constitutionSummary: string,
  mode: "llm" | "agent"
): string {
  const taskDesc = task.description ?? task.title ?? "(説明なし)";
  const taskTitle = task.title ? `## タスク: ${task.title}\n\n` : "";

  const header =
    mode === "agent"
      ? "以下のタスクのみを実装してください。LLM API キーを使わず、IDE エージェントとしてこのプロンプトの内容のみに従ってください。"
      : "以下のタスクのみを実装してください。前のタスクの会話履歴は参照せず、このプロンプトの内容のみに従ってください。";

  return `${header}

${constitutionSummary}

---
${taskTitle}**タスク ID**: ${task.id}

**内容**:
${taskDesc}

---
実装後、isotc verify でアーキテクチャ検証を実行してください。`;
}
