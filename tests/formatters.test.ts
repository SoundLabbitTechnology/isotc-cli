import { describe, it, expect } from "vitest";
import { JsonFormatter } from "../src/presentation/formatters/jsonFormatter";
import { TextFormatter } from "../src/presentation/formatters/textFormatter";
import { Counterexample } from "../src/domain/entities/counterexample";
import { Constitution } from "../src/domain/entities/constitution";

describe("Formatters", () => {
  const constitution: Constitution = {
    layers: [],
    rules: {},
  };

  describe("JsonFormatter", () => {
    it("違反がない場合は status: passed を返す", () => {
      const formatter = new JsonFormatter();
      const output = formatter.format([], constitution, 100);
      const parsed = JSON.parse(output);
      expect(parsed.status).toBe("passed");
      expect(parsed.violations).toEqual([]);
      expect(parsed.durationMs).toBe(100);
    });

    it("違反がある場合は status: failed と violations と repairPrompt を返す", () => {
      const violations: Counterexample[] = [
        {
          type: "ArchitectureViolation",
          sourceFile: "src/domain/user.ts",
          importedModule: "../infrastructure/userRepository",
          sourceLayer: "domain",
          targetLayer: "infrastructure",
          lineNumber: 12,
          codeSnippet: "import { UserRepository } from '../infrastructure/userRepository';",
          suggestion: "Use dependency injection.",
        },
      ];
      const formatter = new JsonFormatter();
      const output = formatter.format(violations, constitution, 200);
      const parsed = JSON.parse(output);
      expect(parsed.status).toBe("failed");
      expect(parsed.violations).toHaveLength(1);
      expect(parsed.violations[0].file).toBe("src/domain/user.ts");
      expect(parsed.violations[0].line).toBe(12);
      expect(parsed.repairPrompt).toBeDefined();
      expect(parsed.repairPrompt).toContain("アーキテクチャ違反");
      expect(parsed.repairPrompt).toContain("src/domain/user.ts");
    });
  });

  describe("TextFormatter", () => {
    it("違反がない場合は成功メッセージを返す", () => {
      const formatter = new TextFormatter();
      const output = formatter.format([], constitution);
      expect(output).toContain("✅");
      expect(output).toContain("Passed");
    });

    it("違反がある場合は詳細を返す", () => {
      const violations: Counterexample[] = [
        {
          type: "ArchitectureViolation",
          sourceFile: "src/domain/user.ts",
          importedModule: "../infra",
          sourceLayer: "domain",
          targetLayer: "infrastructure",
          lineNumber: 5,
          codeSnippet: "import { X } from '../infra'",
          suggestion: "Use DI.",
        },
      ];
      const formatter = new TextFormatter();
      const output = formatter.format(violations, constitution);
      expect(output).toContain("Failed");
      expect(output).toContain("src/domain/user.ts");
      expect(output).toContain("domain");
      expect(output).toContain("infrastructure");
    });
  });
});
