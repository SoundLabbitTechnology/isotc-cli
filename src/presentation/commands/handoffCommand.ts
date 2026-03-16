import { Command } from "commander";
import * as path from "path";
import * as toml from "@iarna/toml";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { Constitution } from "../../domain/entities/constitution";
import { loadLlmConfig, getEffectiveMode } from "../../application/services/configLoader";

type HandoffRole = "implementer" | "reviewer" | "tester" | "architect";

interface TaskEntry {
  id: string;
  title?: string;
  description?: string;
  layer?: string;
  dependsOn?: string[];
  requirementIds?: string[];
  [key: string]: unknown;
}

interface TasksFile {
  tasks?: TaskEntry[];
  [key: string]: unknown;
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

function buildHandoffForRole(
  role: HandoffRole,
  task: TaskEntry | null,
  constitutionSummary: string,
  mode: "llm" | "agent"
): string {
  const taskDesc = task?.description ?? task?.title ?? "(タスク未指定)";
  const taskTitle = task?.title ? `## タスク: ${task.title}\n\n` : "";
  const taskId = task?.id ? `**タスク ID**: ${task.id}\n\n` : "";

  const implHeader =
    mode === "agent"
      ? "以下のタスクを実装してください。LLM API キーを使わず、IDE エージェントとしてこのプロンプトの内容のみに従ってください。"
      : "以下のタスクを実装してください。コンテキストを切ってこのプロンプトのみに従ってください。";

  switch (role) {
    case "implementer":
      return `${implHeader}

${constitutionSummary}

---
${taskTitle}${taskId}**内容**:
${taskDesc}

---
実装後、isotc verify でアーキテクチャ検証を実行してください。`;
    case "reviewer":
      return `以下のタスクの実装をレビューしてください。

${constitutionSummary}

---
${taskTitle}${taskId}**レビュー対象**:
${taskDesc}

**確認項目**:
- アーキテクチャ規約（憲法）の遵守
- レイヤー依存ルールの違反がないこと
- 要件（acceptance criteria）の充足

isotc verify で検証済みであることを確認してください。`;
    case "tester":
      return `以下のタスクに対するテストを実施してください。

${taskTitle}${taskId}**テスト対象**:
${taskDesc}

**確認項目**:
- 受け入れ基準の充足
- 境界値・異常系の検証
- テスト計画（testplan.json）との整合`;
    case "architect":
      return `設計レビュー用のコンテキストです。

${constitutionSummary}

---
${taskTitle}${taskId}**設計対象**:
${taskDesc}

**確認項目**:
- レイヤー分離の妥当性
- 依存関係の方向
- ADR との整合`;

    default:
      return taskDesc;
  }
}

export function handoffCommand(): Command {
  const cmd = new Command("handoff")
    .description("役割別ハンドオフ出力（implementer / reviewer / tester / architect）")
    .option("-f, --for <role>", "役割: implementer | reviewer | tester | architect", "implementer")
    .option("-t, --task-id <id>", "タスク ID（未指定時は概要のみ）", "")
    .option("--format <format>", "出力形式: text | json", "text")
    .action(async (options: { for?: string; taskId?: string; format?: string }) => {
      const cwd = process.cwd();
      const fileSystem = new LocalFileSystemAdapter();
      const specDir = path.join(cwd, ".spec");
      const constitutionPath = path.join(specDir, "constitution.toml");
      const tasksPath = path.join(specDir, "tasks.json");

      const role = (options.for ?? "implementer") as HandoffRole;
      const validRoles: HandoffRole[] = ["implementer", "reviewer", "tester", "architect"];
      if (!validRoles.includes(role)) {
        console.error(`❌ 無効な役割: ${role}。implementer | reviewer | tester | architect を指定してください。`);
        process.exit(1);
      }

      let constitution: Constitution = { layers: [], rules: {} };
      if (await fileSystem.exists(constitutionPath)) {
        try {
          const raw = fileSystem.readFileSync(constitutionPath);
          constitution = toml.parse(raw) as unknown as Constitution;
        } catch {
          console.error("⚠️ constitution.toml の読み込みに失敗。続行します。");
        }
      }
      const constitutionSummary = buildConstitutionSummary(constitution);

      const llmConfig = await loadLlmConfig(cwd);
      const mode = getEffectiveMode(llmConfig);

      let task: TaskEntry | null = null;
      if (options.taskId && (await fileSystem.exists(tasksPath))) {
        try {
          const raw = fileSystem.readFileSync(tasksPath);
          const tasksData = JSON.parse(raw) as TasksFile;
          const tasks = tasksData.tasks ?? [];
          task = tasks.find((t) => t.id === options.taskId) ?? null;
        } catch {
          console.error("⚠️ tasks.json の読み込みに失敗。");
        }
      }

      const content = buildHandoffForRole(role, task, constitutionSummary, mode);

      const format = options.format ?? "text";
      if (format === "json") {
        console.log(
          JSON.stringify({
            role,
            taskId: task?.id ?? null,
            content,
          })
        );
      } else {
        console.log(content);
      }
    });

  return cmd;
}
