/**
 * 暫定仮定（plan 実行時の前提）
 * assumptions.toml の構造化表現
 */

export type AssumptionConfidence = "high" | "medium" | "low";

export interface Assumption {
  description: string;
  confidence?: AssumptionConfidence;
  source?: string;
}

export interface AssumptionsDocument {
  assumptions: Record<string, Assumption>;
}
