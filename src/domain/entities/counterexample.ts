export type ViolationType =
  | "ArchitectureViolation"
  | "PackageViolation"
  | "ReExportViolation"
  | "CyclicDependencyViolation";

export interface Counterexample {
  type: ViolationType;
  sourceFile: string;
  importedModule?: string;
  sourceLayer?: string;
  targetLayer?: string;
  targetFile?: string;
  lineNumber?: number;
  codeSnippet?: string;
  suggestion?: string;
  /** 循環依存の場合のファイルパスリスト */
  cycle?: string[];
}
