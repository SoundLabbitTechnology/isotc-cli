import { IFileSystem } from "../../infrastructure/ports/iFileSystem";
import { ISymbolExtractor } from "../../infrastructure/ports/iSymbolExtractor";
import { TraceGraph, TraceNode, TraceEdge } from "../../domain/entities/traceGraph";
import { RequirementsDocument } from "../../domain/entities/requirements";

interface TaskEntry {
  id: string;
  title?: string;
  description?: string;
  layer?: string;
  ownership?: string;
  dependsOn?: string[];
}

interface TasksFile {
  tasks?: TaskEntry[];
}

interface TraceSeed {
  requirementTaskEdges?: { requirementId: string; taskId: string }[];
}

export class BuildTraceUseCase {
  constructor(
    private fileSystem: IFileSystem,
    private symbolExtractor: ISymbolExtractor
  ) {}

  async execute(projectPath: string): Promise<TraceGraph> {
    const nodes: TraceNode[] = [];
    const edges: TraceEdge[] = [];
    const generatedAt = new Date().toISOString();

    const specDir = `${projectPath}/.spec`;

    const requirements = await this.loadRequirements(specDir);
    if (requirements) {
      for (const fr of requirements.functionalRequirements) {
        nodes.push({ id: fr.id, type: "requirement", label: fr.summary });
      }
      for (const nfr of requirements.nonFunctionalRequirements) {
        nodes.push({ id: nfr.id, type: "requirement", label: nfr.summary });
      }
    }

    const tasks = await this.loadTasks(specDir);
    if (tasks) {
      for (const t of tasks) {
        nodes.push({
          id: t.id,
          type: "task",
          label: t.title ?? t.description ?? t.id,
        });
      }
    }

    const traceSeed = await this.loadTraceSeed(specDir);
    if (traceSeed?.requirementTaskEdges) {
      for (const e of traceSeed.requirementTaskEdges) {
        edges.push({ from: e.taskId, to: e.requirementId, type: "satisfies" });
      }
    }

    const symbols = this.symbolExtractor.extractSymbols(projectPath);
    const fileIds = new Set<string>();
    for (const sym of symbols) {
      if (!fileIds.has(sym.filePath)) {
        fileIds.add(sym.filePath);
        const label = sym.filePath.split("/").pop() ?? sym.filePath;
        nodes.push({ id: sym.filePath, type: "file", label });
      }
      const symbolId = `${sym.filePath}::${sym.name}`;
      if (!nodes.some((n) => n.id === symbolId && n.type === "symbol")) {
        nodes.push({
          id: symbolId,
          type: "symbol",
          label: sym.name,
          file: sym.filePath,
        });
        edges.push({
          from: sym.filePath,
          to: symbolId,
          type: "defines",
        });
      }
    }

    const testFiles = symbols.filter(
      (s) => s.filePath.includes(".test.") || s.filePath.includes(".spec.")
    );
    for (const t of testFiles) {
      const testId = t.filePath;
      if (!nodes.some((n) => n.id === testId && n.type === "test")) {
        nodes.push({
          id: testId,
          type: "test",
          label: t.filePath.split("/").pop() ?? testId,
        });
      }
    }

    return {
      version: "1.0",
      generatedAt,
      nodes,
      edges,
    };
  }

  private async loadRequirements(specDir: string): Promise<RequirementsDocument | null> {
    const path = `${specDir}/requirements.json`;
    if (!(await this.fileSystem.exists(path))) return null;
    try {
      const raw = await this.fileSystem.readFile(path);
      return JSON.parse(raw) as RequirementsDocument;
    } catch {
      return null;
    }
  }

  private async loadTasks(specDir: string): Promise<TaskEntry[] | null> {
    const path = `${specDir}/tasks.json`;
    if (!(await this.fileSystem.exists(path))) return null;
    try {
      const raw = await this.fileSystem.readFile(path);
      const data = JSON.parse(raw) as TasksFile;
      return data.tasks ?? null;
    } catch {
      return null;
    }
  }

  private async loadTraceSeed(specDir: string): Promise<TraceSeed | null> {
    const path = `${specDir}/trace-seed.json`;
    if (!(await this.fileSystem.exists(path))) return null;
    try {
      const raw = await this.fileSystem.readFile(path);
      return JSON.parse(raw) as TraceSeed;
    } catch {
      return null;
    }
  }
}
