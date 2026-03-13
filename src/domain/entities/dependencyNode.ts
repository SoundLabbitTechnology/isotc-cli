export type DependencyKind = "import" | "reexport" | "package";

export interface DependencyNode {
  sourceFilePath: string;
  importedModule: string;
  lineNumber: number;
  codeSnippet: string;
  kind?: DependencyKind;
}
