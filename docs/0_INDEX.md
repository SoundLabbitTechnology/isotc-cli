# isotc-cli ドキュメント一覧

**最終更新:** 2026-03-14

---

## ドキュメント構成

```
docs/
├── 0_INDEX.md              # 本ファイル（ナビゲーション）
├── 1_PRD.md                # プロダクト要求仕様書
├── 2_REQUIREMENTS.md       # コマンド契約・I/O仕様
├── 3_ARCHITECTURE.md       # 内部アーキテクチャ設計
├── 4_RESEARCH_BACKGROUND.md  # 学術的裏付けと参考文献
└── TEST_SIMULATION_REPORT.md  # テストシミュレーション・棚卸し表（レビュー対応）
```

## 読者別ガイド

| 読者 | 推奨ドキュメント |
|------|------------------|
| **利用者** | [README](../README.md) → [2_REQUIREMENTS.md](2_REQUIREMENTS.md) |
| **AI エージェント** | [AGENTS.md](../AGENTS.md) → [2_REQUIREMENTS.md](2_REQUIREMENTS.md) |
| **貢献者** | [CONTRIBUTING.md](../CONTRIBUTING.md) → [3_ARCHITECTURE.md](3_ARCHITECTURE.md) |
| **プロダクト担当** | [1_PRD.md](1_PRD.md) → [4_RESEARCH_BACKGROUND.md](4_RESEARCH_BACKGROUND.md) |
| **品質・契約確認** | [TEST_SIMULATION_REPORT.md](TEST_SIMULATION_REPORT.md) → [2_REQUIREMENTS.md](2_REQUIREMENTS.md) |

## ドキュメント概要

### [1_PRD.md](1_PRD.md) — プロダクト要求仕様書

- 存在意義・対象ユーザー・解決課題
- 主要ユースケース・提供価値
- Spec Compiler + Agent Runtime Policy + Human-Centered Guardrail の位置づけ

### [2_REQUIREMENTS.md](2_REQUIREMENTS.md) — 要求仕様書

- コマンド一覧と詳細仕様
- 機械可読 I/O（JSON 出力、終了コード）
- verify 出力スキーマ、JSON Schema 一覧
- 実装状況

### [3_ARCHITECTURE.md](3_ARCHITECTURE.md) — アーキテクチャ設計

- ディレクトリ構造
- レイヤー責務（Presentation / Application / Domain / Infrastructure）
- コマンドとレイヤー対応表

### [4_RESEARCH_BACKGROUND.md](4_RESEARCH_BACKGROUND.md) — 研究背景

- 学術的・実証的裏付け
- 強く支持される点 / 研究が薄い点
- 参考文献一覧

## 関連リソース

| リソース | 説明 |
|----------|------|
| [schemas/](../schemas/) | JSON Schema（verify-result, requirements, tasks, trace） |
| [resources/prompts/](../resources/prompts/) | LLM プロンプトテンプレート（intent_extract 等） |
| [AGENTS.md](../AGENTS.md) | AI エージェント向けガイド |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | 貢献ガイドライン・互換性ポリシー |
| [CHANGELOG.md](../CHANGELOG.md) | 変更履歴 |
