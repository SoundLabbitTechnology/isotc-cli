import { IFileSystem } from "../../infrastructure/ports/iFileSystem";
import { TraceGraph } from "../../domain/entities/traceGraph";

export interface TraceDiffResult {
  affectedRequirements: string[];
  affectedTests: string[];
  affectedTasks: string[];
}

export class TraceDiffUseCase {
  constructor(private fileSystem: IFileSystem) {}

  async execute(projectPath: string, changedFiles: string[]): Promise<TraceDiffResult> {
    const tracePath = `${projectPath}/.spec/trace.json`;
    if (!(await this.fileSystem.exists(tracePath))) {
      return { affectedRequirements: [], affectedTests: [], affectedTasks: [] };
    }

    const raw = await this.fileSystem.readFile(tracePath);
    const graph = JSON.parse(raw) as TraceGraph;

    const affectedRequirements = new Set<string>();
    const affectedTests = new Set<string>();
    const affectedTasks = new Set<string>();

    for (const file of changedFiles) {
      const fileNorm = file.replace(/\\/g, "/");
      const nodesFromFile = this.getReachableFrom(graph, fileNorm);
      for (const nodeId of nodesFromFile) {
        const node = graph.nodes.find((n) => n.id === nodeId);
        if (node?.type === "requirement") affectedRequirements.add(nodeId);
        if (node?.type === "test") affectedTests.add(nodeId);
        if (node?.type === "task") affectedTasks.add(nodeId);
      }
    }

    return {
      affectedRequirements: Array.from(affectedRequirements),
      affectedTests: Array.from(affectedTests),
      affectedTasks: Array.from(affectedTasks),
    };
  }

  private getReachableFrom(graph: TraceGraph, startFileOrSymbol: string): Set<string> {
    const reached = new Set<string>();
    let toVisit: string[] = [startFileOrSymbol];

    const fileNodes = graph.nodes.filter((n) => n.file === startFileOrSymbol);
    for (const n of fileNodes) toVisit.push(n.id);

    const edgesByFrom = new Map<string, string[]>();
    const edgesByTo = new Map<string, string[]>();
    for (const e of graph.edges) {
      if (!edgesByFrom.has(e.from)) edgesByFrom.set(e.from, []);
      edgesByFrom.get(e.from)!.push(e.to);
      if (!edgesByTo.has(e.to)) edgesByTo.set(e.to, []);
      edgesByTo.get(e.to)!.push(e.from);
    }

    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      if (reached.has(current)) continue;
      reached.add(current);

      const node = graph.nodes.find((n) => n.id === current);
      if (node?.type === "file") {
        for (const n of graph.nodes) {
          if (n.file === current && !reached.has(n.id)) toVisit.push(n.id);
        }
      }

      for (const next of edgesByFrom.get(current) ?? []) toVisit.push(next);
      for (const from of edgesByTo.get(current) ?? []) toVisit.push(from);
    }
    return reached;
  }
}
