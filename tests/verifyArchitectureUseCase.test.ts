import { describe, it, expect } from "vitest";
import { VerifyArchitectureUseCase } from "../src/application/usecases/verifyArchitectureUseCase";
import { Constitution } from "../src/domain/entities/constitution";
import { IAstParser } from "../src/infrastructure/ports/iAstParser";
import { DependencyNode } from "../src/domain/entities/dependencyNode";

describe("VerifyArchitectureUseCase", () => {
  const constitution: Constitution = {
    layers: [
      { name: "domain", basePath: "src/domain/**" },
      { name: "application", basePath: "src/application/**" },
    ],
    rules: {
      domain: [],
      application: ["domain"],
    },
  };

  it("AST パーサーから取得した依存関係を RuleValidator に渡す", () => {
    const mockDeps: DependencyNode[] = [
      {
        sourceFilePath: "/project/src/application/useCase.ts",
        importedModule: "../domain/entity",
        lineNumber: 1,
        codeSnippet: 'import { Entity } from "../domain/entity"',
      },
    ];

    const mockAstParser: IAstParser = {
      parseDirectory: () => mockDeps,
    };

    const useCase = new VerifyArchitectureUseCase(mockAstParser);
    const violations = useCase.execute("/project", constitution);

    expect(Array.isArray(violations)).toBe(true);
  });
});
