export interface DependencyNode {
  sourceFilePath: string;
  importedModule: string;
  lineNumber: number;
  codeSnippet: string;
}
