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

  it("違反がある場合は Counterexample を返す", () => {
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
    expect(violations).toHaveLength(1);
    expect(violations[0].sourceLayer).toBe("domain");
    expect(violations[0].targetLayer).toBe("infrastructure");
    expect(violations[0].suggestion).toContain("依存性注入");
  });

  it("循環依存を検出すると CyclicDependencyViolation を返す", () => {
    const validator = new RuleValidator(constitution, "/project");
    const dependencies: DependencyNode[] = [
      {
        sourceFilePath: "/project/src/application/a.ts",
        importedModule: "./b",
        lineNumber: 1,
        codeSnippet: 'import { B } from "./b"',
      },
      {
        sourceFilePath: "/project/src/application/b.ts",
        importedModule: "./a",
        lineNumber: 1,
        codeSnippet: 'import { A } from "./a"',
      },
    ];
    const violations = validator.checkViolations(dependencies);
    const cycleViolation = violations.find((v) => v.type === "CyclicDependencyViolation");
    expect(cycleViolation).toBeDefined();
    expect(cycleViolation!.cycle).toBeDefined();
    expect(cycleViolation!.cycle!.length).toBeGreaterThanOrEqual(2);
    expect(cycleViolation!.suggestion).toContain("循環");
  });
});
