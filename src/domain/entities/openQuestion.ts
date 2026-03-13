/**
 * 未解決の質問（clarification loop 用）
 * open_questions.md の構造化表現
 */

export interface OpenQuestion {
  id: string;
  title: string;
  source: string;
  question: string;
  options?: string[];
}
