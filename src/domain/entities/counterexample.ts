export interface Counterexample {
  type: "ArchitectureViolation";
  sourceFile: string;
  importedModule: string;
  sourceLayer: string;
  targetLayer: string;
  lineNumber: number;
  codeSnippet: string;
  suggestion: string;
}
