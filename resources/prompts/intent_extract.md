# 要件抽出プロンプト

以下の自然言語要件を構造化し、JSON 形式で出力してください。

## 出力形式

以下の JSON 構造に厳密に従ってください。配列は空でも構いません。

```json
{
  "functionalRequirements": [
    {
      "id": "FR-001",
      "summary": "要約（1行）",
      "description": "詳細説明（任意）",
      "acceptanceCriteria": ["AC-001", "AC-002"],
      "priority": "must"
    }
  ],
  "nonFunctionalRequirements": [
    {
      "id": "NFR-001",
      "category": "performance|security|usability|...",
      "summary": "要約",
      "metric": "測定指標（任意）",
      "priority": "must"
    }
  ],
  "invariants": [
    { "id": "INV-001", "expression": "不変条件の記述" }
  ],
  "glossary": [
    { "term": "用語", "definition": "定義" }
  ],
  "forbidden": [
    { "id": "FBD-001", "rule": "禁止事項" }
  ],
  "ambiguousTerms": [
    {
      "term": "曖昧な語",
      "location": "出現箇所（要件ID等）",
      "suggestion": "具体化の提案"
    }
  ],
  "openQuestions": [
    {
      "id": "OQ-001",
      "title": "質問のタイトル",
      "source": "出典（FR-001等）",
      "question": "質問文",
      "options": ["選択肢1", "選択肢2"]
    }
  ],
  "assumptions": {
    "ASM-001": {
      "description": "暫定仮定の説明",
      "confidence": "high",
      "source": "FR-001"
    }
  }
}
```

## ルール

- 機能要求・非機能要求には一意の ID（FR-001, NFR-001 形式）を付与
- 曖昧な表現（「適切に」「できるだけ」等）は ambiguousTerms に列挙し、suggestion で具体化を提案
- 未解決の判断が必要な点は openQuestions に列挙
- 暫定で仮定した事項は assumptions に記載し、confidence を付与
- priority は must / should / could のいずれか
- 出力は必ず有効な JSON のみとし、説明文やマークダウンは含めない
