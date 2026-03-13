import { Project, SyntaxKind } from "ts-morph";
import { IAstParser } from "../ports/iAstParser";
import { DependencyNode } from "../../domain/entities/dependencyNode";

export class TypeScriptAstAdapter implements IAstParser {
  public parseDirectory(directoryPath: string): DependencyNode[] {
    const project = new Project({ compilerOptions: { allowJs: true } });
    project.addSourceFilesAtPaths(`${directoryPath}/**/*.ts`);
    const nodes: DependencyNode[] = [];
    for (const sourceFile of project.getSourceFiles()) {
      const imports = sourceFile.getDescendantsOfKind(SyntaxKind.ImportDeclaration);
      for (const imp of imports) {
        nodes.push({
          sourceFilePath: sourceFile.getFilePath(),
          importedModule: imp.getModuleSpecifierValue(),
          lineNumber: imp.getStartLineNumber(),
          codeSnippet: imp.getText()
        });
      }
    }
    return nodes;
  }
}
