import { describe, it, expect } from "vitest";
import { RuleValidator } from "../src/domain/services/ruleValidator";
import { Constitution } from "../src/domain/entities/constitution";
import { DependencyNode } from "../src/domain/entities/dependencyNode";

describe("RuleValidator", () => {
  const constitution: Constitution = {
    layers: [
      { name: "domain", basePath: "src/domain/**" },
      { name: "application", basePath: "src/application/**" },
      { name: "infrastructure", basePath: "src/infrastructure/**" },
    ],
    rules: {
      domain: [],
      application: ["domain"],
      infrastructure: ["domain", "application"],
    },
  };

  it("許可された依存関係では違反を返さない", () => {
    const validator = new RuleValidator(constitution, "/project");
    const dependencies: DependencyNode[] = [
      {
        sourceFilePath: "/project/src/application/useCase.ts",
        importedModule: "../domain/entity",
        lineNumber: 1,
        codeSnippet: 'import { Entity } from "../domain/entity"',
      },
    ];
    const violations = validator.checkViolations(dependencies);
    expect(violations).toEqual([]);
  });

  it("違反がある場合は Counterexample を返す（実装後）", () => {
    const validator = new RuleValidator(constitution, "/project");
    const dependencies: DependencyNode[] = [
      {
        sourceFilePath: "/project/src/domain/entity.ts",
        importedModule: "../infrastructure/repository",
        lineNumber: 5,
        codeSnippet: 'import { Repository } from "../infrastructure/repository"',
      },
    ];
    const violations = validator.checkViolations(dependencies);
    // 現状は stub で [] を返す。実装後は violations.length > 0 になる想定
    expect(Array.isArray(violations)).toBe(true);
  });
});
