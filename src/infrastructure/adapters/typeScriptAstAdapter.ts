import { Project, SyntaxKind } from "ts-morph";
import { IAstParser } from "../ports/iAstParser";
import { DependencyNode } from "../../domain/entities/dependencyNode";

export class TypeScriptAstAdapter implements IAstParser {
  public parseDirectory(directoryPath: string): DependencyNode[] {
    const project = new Project({ compilerOptions: { allowJs: true } });
    project.addSourceFilesAtPaths(`${directoryPath}/**/*.ts`);
    const nodes: DependencyNode[] = [];

    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      if (filePath.includes("node_modules")) continue;
      for (const imp of sourceFile.getDescendantsOfKind(SyntaxKind.ImportDeclaration)) {
        const moduleSpec = imp.getModuleSpecifierValue();
        const kind = moduleSpec.startsWith(".") ? "import" : "package";
        nodes.push({
          sourceFilePath: filePath,
          importedModule: moduleSpec,
          lineNumber: imp.getStartLineNumber(),
          codeSnippet: imp.getText(),
          kind,
        });
      }
      for (const exp of sourceFile.getDescendantsOfKind(SyntaxKind.ExportDeclaration)) {
        const moduleSpec = exp.getModuleSpecifierValue();
        if (moduleSpec && moduleSpec.startsWith(".")) {
          nodes.push({
            sourceFilePath: filePath,
            importedModule: moduleSpec,
            lineNumber: exp.getStartLineNumber(),
            codeSnippet: exp.getText(),
            kind: "reexport",
          });
        }
      }
    }
    return nodes;
  }
}
