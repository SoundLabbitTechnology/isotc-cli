import { Project, SyntaxKind, Node } from "ts-morph";
import * as path from "path";
import { ISymbolExtractor, ExtractedSymbol } from "../ports/iSymbolExtractor";

export class TypeScriptSymbolExtractor implements ISymbolExtractor {
  extractSymbols(projectPath: string, globPattern = "src/**/*.ts"): ExtractedSymbol[] {
    const project = new Project({ compilerOptions: { allowJs: true } });
    project.addSourceFilesAtPaths(path.join(projectPath, globPattern));
    const symbols: ExtractedSymbol[] = [];

    for (const sourceFile of project.getSourceFiles()) {
      const filePath = path.relative(projectPath, sourceFile.getFilePath()).replace(/\\/g, "/");

      for (const decl of sourceFile.getExportedDeclarations().entries()) {
        const [name, nodes] = decl;
        const node = nodes[0];
        if (!node) continue;

        const kindNode = Node.isClassDeclaration(node)
          ? "class"
          : Node.isFunctionDeclaration(node) || Node.isFunctionExpression(node)
            ? "function"
            : Node.isInterfaceDeclaration(node)
              ? "interface"
              : Node.isTypeAliasDeclaration(node)
                ? "type"
                : "const";

        symbols.push({ name, kind: kindNode, filePath });
      }
    }

    return symbols;
  }
}
