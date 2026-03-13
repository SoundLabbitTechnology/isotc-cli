/**
 * ソースファイルからシンボル（クラス、関数、型等）を抽出するポート
 */
export interface ExtractedSymbol {
  name: string;
  kind: "class" | "function" | "interface" | "type" | "const";
  filePath: string;
}

export interface ISymbolExtractor {
  extractSymbols(projectPath: string, globPattern?: string): ExtractedSymbol[];
}
