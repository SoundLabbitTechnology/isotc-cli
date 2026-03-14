import { describe, it, expect } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { JsonFormatter } from "../src/presentation/formatters/jsonFormatter";
import { Counterexample } from "../src/domain/entities/counterexample";
import { Constitution } from "../src/domain/entities/constitution";

const SCHEMA_PATH = path.join(__dirname, "../schemas/verify-result.schema.json");

describe("verify --format json 出力と verify-result.schema.json の互換性", () => {
  const constitution: Constitution = { layers: [], rules: {} };
  const formatter = new JsonFormatter();

  const violationTypes = [
    "ArchitectureViolation",
    "ReExportViolation",
    "PackageViolation",
    "CyclicDependencyViolation",
  ] as const;

  function assertConformsToSchema(parsed: unknown): void {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));
    const required = schema.required as string[];
    const obj = parsed as Record<string, unknown>;
    for (const key of required) {
      expect(obj[key], `missing required: ${key}`).toBeDefined();
    }
    expect(["passed", "failed"]).toContain(obj.status);
    expect(Array.isArray(obj.violations)).toBe(true);
    expect(typeof obj.durationMs).toBe("number");
    for (const v of (obj.violations as Record<string, unknown>[]) || []) {
      expect(violationTypes).toContain(v.type);
      expect(typeof v.file).toBe("string");
      expect(typeof v.message).toBe("string");
    }
  }

  it("passed 時の出力がスキーマに準拠する", () => {
    const output = formatter.format([], constitution, 100);
    const parsed = JSON.parse(output);
    expect(parsed.status).toBe("passed");
    assertConformsToSchema(parsed);
  });

  it("failed 時（ArchitectureViolation）の出力がスキーマに準拠する", () => {
    const violations: Counterexample[] = [
      {
        type: "ArchitectureViolation",
        sourceFile: "src/domain/user.ts",
        importedModule: "../infrastructure/repo",
        sourceLayer: "domain",
        targetLayer: "infrastructure",
        lineNumber: 12,
        suggestion: "Use DI.",
      },
    ];
    const output = formatter.format(violations, constitution, 200);
    const parsed = JSON.parse(output);
    expect(parsed.status).toBe("failed");
    expect(parsed.repairPrompt).toBeDefined();
    assertConformsToSchema(parsed);
  });

  it("CyclicDependencyViolation の出力がスキーマに準拠する", () => {
    const violations: Counterexample[] = [
      {
        type: "CyclicDependencyViolation",
        sourceFile: "src/a.ts",
        cycle: ["src/a.ts", "src/b.ts"],
        suggestion: "循環を解消してください。",
      },
    ];
    const output = formatter.format(violations, constitution, 50);
    const parsed = JSON.parse(output);
    expect(parsed.violations[0].cycle).toEqual(["src/a.ts", "src/b.ts"]);
    assertConformsToSchema(parsed);
  });
});
