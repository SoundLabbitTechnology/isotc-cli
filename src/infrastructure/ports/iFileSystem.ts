/**
 * ファイルシステム操作のポート（ドメイン層が要求するインターフェース）
 * インフラ層の実装（ローカルFS、メモリFS等）から抽象化する
 */
export interface IFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readFileSync(path: string): string;
}
