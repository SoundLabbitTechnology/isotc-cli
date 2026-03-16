import * as fs from "fs/promises";
import * as fsSync from "fs";
import * as path from "path";
import { IFileSystem } from "../ports/iFileSystem";

export class LocalFileSystemAdapter implements IFileSystem {
  async readFile(filePath: string): Promise<string> {
    return fs.readFile(path.resolve(filePath), "utf-8");
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.resolve(filePath), content, "utf-8");
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(path.resolve(filePath));
      return true;
    } catch {
      return false;
    }
  }

  readFileSync(filePath: string): string {
    return fsSync.readFileSync(path.resolve(filePath), "utf-8");
  }

  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(path.resolve(dirPath), { recursive: true });
  }
}
