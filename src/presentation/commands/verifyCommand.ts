import { Command } from "commander";
import * as path from "path";
import { execSync } from "child_process";
import * as toml from "@iarna/toml";
import { VerifyArchitectureUseCase } from "../../application/usecases/verifyArchitectureUseCase";
import { TypeScriptAstAdapter } from "../../infrastructure/adapters/typeScriptAstAdapter";
import { LocalFileSystemAdapter } from "../../infrastructure/adapters/localFileSystemAdapter";
import { Constitution } from "../../domain/entities/constitution";
import { Counterexample } from "../../domain/entities/counterexample";
import { JsonFormatter } from "../formatters/jsonFormatter";
import { TextFormatter } from "../formatters/textFormatter";
import { IOutputFormatter } from "../formatters/outputFormatter";

const EXIT_SUCCESS = 0;
const EXIT_VERIFICATION_FAILED = 2;
const EXIT_FATAL = 3;

function getStagedFiles(cwd: string): Set<string> {
  try {
    const out = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
      cwd,
    });
    return new Set(
      out
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0)
    );
  } catch {
    return new Set();
  }
}

function filterViolationsByFiles(
  violations: Counterexample[],
  fileSet: Set<string>
): Counterexample[] {
  if (fileSet.size === 0) return violations;
  const norm = (p: string) => p.replace(/\\/g, "/");
  return violations.filter((v) => {
    if (v.type === "CyclicDependencyViolation" && v.cycle) {
      return v.cycle.some((f) => fileSet.has(norm(f)) || fileSet.has(f));
    }
    return fileSet.has(norm(v.sourceFile)) || fileSet.has(v.sourceFile);
  });
}

export function verifyCommand(): Command {
  const cmd = new Command("verify")
    .description("アーキテクチャおよび仕様の検証。違反時は反例（進化圧）を出力")
    .option("-f, --format <format>", "出力形式: text | json", "text")
    .option("--auto-fix", "自動修正を試行（将来拡張）", false)
    .option("--staged", "ステージ済みファイルのみ検証（pre-commit hook 用）", false)
    .option("--changed-files <paths>", "検証対象ファイル（カンマ区切り）。未指定時は全ファイル", "")
    .option("--audience <audience>", "出力の想定読者: developer | architect | agent", "developer")
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

      if (options.format === "text") {
        console.error("解析中...");
      }

      const astParser = new TypeScriptAstAdapter();
      const useCase = new VerifyArchitectureUseCase(astParser);
      let violations = useCase.execute(cwd, constitution);

      let fileSet = new Set<string>();
      if (options.staged) {
        fileSet = getStagedFiles(cwd);
        if (fileSet.size > 0) {
          violations = filterViolationsByFiles(violations, fileSet);
        }
      } else if (options.changedFiles && String(options.changedFiles).trim()) {
        fileSet = new Set(
          String(options.changedFiles)
            .split(",")
            .map((f: string) => f.trim())
            .filter((f: string) => f.length > 0)
        );
        if (fileSet.size > 0) {
          violations = filterViolationsByFiles(violations, fileSet);
        }
      }

      const durationMs = Date.now() - startTime;
      const formatter: IOutputFormatter =
        options.format === "json" ? new JsonFormatter() : new TextFormatter();
      let output = formatter.format(violations, constitution, durationMs);

      if (options.format === "json") {
        const parsed = JSON.parse(output) as Record<string, unknown>;
        parsed.audience = options.audience ?? "developer";
        output = JSON.stringify(parsed, null, 2);
      }

      // JSON 時は stdout に純粋な JSON のみ。プログレス・ログは stderr。
      console.log(output);

      if (violations.length > 0) {
        process.exit(EXIT_VERIFICATION_FAILED);
      }
      process.exit(EXIT_SUCCESS);
    });

  return cmd;
}
