import { IFileSystem } from "../../infrastructure/ports/iFileSystem";
import { TraceGraph } from "../../domain/entities/traceGraph";

export interface TraceExplainResult {
  targetId: string;
  affectedRequirements: string[];
  path: string[];
}

export class TraceExplainUseCase {
  constructor(private fileSystem: IFileSystem) {}

  async execute(projectPath: string, targetId: string): Promise<TraceExplainResult | null> {
    const tracePath = `${projectPath}/.spec/trace.json`;
    if (!(await this.fileSystem.exists(tracePath))) {
      return null;
    }

    const raw = await this.fileSystem.readFile(tracePath);
    const graph = JSON.parse(raw) as TraceGraph;

    const targetNode = graph.nodes.find((n) => n.id === targetId || n.file === targetId);
    const startId = targetNode?.id ?? targetId;

    const requirements = new Set<string>();
    const path: string[] = [];

    const edgesByTo = new Map<string, string[]>();
    for (const e of graph.edges) {
      if (!edgesByTo.has(e.to)) edgesByTo.set(e.to, []);
      edgesByTo.get(e.to)!.push(e.from);
    }

    const visit = (nodeId: string, depth: number) => {
      if (depth > 30) return;
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (node?.type === "requirement") requirements.add(nodeId);
      path.push(nodeId);
      for (const from of edgesByTo.get(nodeId) ?? []) {
        visit(from, depth + 1);
      }
    };

    visit(startId, 0);
    const reqNode = graph.nodes.find((n) => n.id === startId);
    if (reqNode?.type === "requirement") requirements.add(startId);

    return {
      targetId,
      affectedRequirements: Array.from(requirements),
      path: [...new Set(path)],
    };
  }
}
