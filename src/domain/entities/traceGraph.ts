/**
 * トレースグラフの最小データモデル
 * requirement -> adr -> task -> file -> symbol -> test -> violation の連結
 */

export type TraceNodeType =
  | "requirement"
  | "adr"
  | "task"
  | "file"
  | "symbol"
  | "test"
  | "violation";

export type TraceEdgeType =
  | "satisfies"
  | "implements"
  | "defines"
  | "tests"
  | "violates"
  | "decides"
  | "references";

export interface TraceNode {
  id: string;
  type: TraceNodeType;
  label: string;
  /** symbol 型の場合、所属ファイル */
  file?: string;
}

export interface TraceEdge {
  from: string;
  to: string;
  type: TraceEdgeType;
}

export interface TraceGraph {
  version: string;
  generatedAt: string;
  nodes: TraceNode[];
  edges: TraceEdge[];
}
