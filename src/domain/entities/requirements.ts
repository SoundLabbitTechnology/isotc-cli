/**
 * 構造化要件 IR（Intent コマンドの出力）
 * 曖昧さ除去済みの要求を表現する中間表現
 */

export type RequirementPriority = "must" | "should" | "could";

export interface FunctionalRequirement {
  id: string;
  summary: string;
  description?: string;
  acceptanceCriteria?: string[];
  priority?: RequirementPriority;
}

export interface NonFunctionalRequirement {
  id: string;
  category: string;
  summary: string;
  description?: string;
  metric?: string;
  priority?: RequirementPriority;
}

export interface Invariant {
  id: string;
  expression: string;
  description?: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface ForbiddenRule {
  id: string;
  rule: string;
  description?: string;
}

export interface AmbiguousTerm {
  term: string;
  location: string;
  suggestion: string;
}

export interface RequirementsDocument {
  version: string;
  generatedAt: string;
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  invariants: Invariant[];
  glossary: GlossaryEntry[];
  forbidden: ForbiddenRule[];
  ambiguousTerms: AmbiguousTerm[];
  openQuestionIds: string[];
  assumptionIds: string[];
}
