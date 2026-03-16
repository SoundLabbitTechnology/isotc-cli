# Changelog

All notable changes to isotc-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-03-16

### Added

- **Agent モード（LLM 不要モード）**: LLM API キーなしで IDE エージェント経由のワークフローをサポート
  - `.spec/config.toml` の `llm.mode = "llm" | "agent"` と環境変数 `ISOTC_MODE` を追加
  - `mode=agent` のとき、`intent` / `plan` は LLM を呼ばず、`.spec/requirements.json` / `.spec/tasks.json` などのスケルトンと `.spec/agent/intent-prompt.md` / `plan-prompt.md` を生成
  - `impl --isolated-prompt` / `handoff` を Agent モード前提のプロンプト文言に調整
- **Agent / LLM 設定ドキュメント拡張**:
  - README, AGENTS.md, docs/2_REQUIREMENTS.md, docs/5_LLM_CONFIGURATION.md に Agent モードの説明とフローを追記
  - `config show --format json` に `mode` とその由来（source.mode）を追加
  - `doctor --format json` に `mode` を追加し、Agent モード時の LLM キー未設定を正常扱いに変更

## [0.4.0] - 2026-03-14

### Added

- **LLM マルチプロバイダー対応**: intent / plan で OpenAI に加え Gemini・Claude を選択可能
  - `ISOTC_LLM_PROVIDER`: `openai` | `gemini` | `claude`（デフォルト: openai）
  - `GEMINI_API_KEY` / `GOOGLE_API_KEY`: Gemini 利用時
  - `ANTHROPIC_API_KEY`: Claude 利用時
  - `ISOTC_LLM_MODEL`: プロバイダーごとのモデル指定
- **doctor 拡張**: 3 プロバイダー別の API キー状態をチェック（openApiKeySet, geminiApiKeySet, claudeApiKeySet）
- **config コマンド**: LLM アダプター設定の管理
  - `config set provider <openai|gemini|claude>` / `config set model <name>`
  - `config show`: 有効な設定を表示（環境変数 > .spec/config.toml > デフォルト）
  - `config list-providers`: プロバイダー一覧と必要な環境変数

## [0.3.0] - 2026-03-14

### Added

- **プロダクト定義の更新**: Spec Compiler + Agent Runtime Policy + Human-Centered Guardrail として再定義
- **emit コマンド**: constitution から Agent 環境向け設定を生成
  - `emit copilot`: .github/copilot-instructions.md
  - `emit claude`: CLAUDE.md（Claude Code 用）
  - `emit agents`: .github/agents/architecture.agent.md
- **handoff コマンド**: 役割別ハンドオフ出力（implementer / reviewer / tester / architect）
- **verify 拡張**:
  - `--staged`: ステージ済みファイルのみ検証（pre-commit hook 用）
  - `--changed-files`: 検証対象ファイルの指定（カンマ区切り）
  - `--audience`: 出力の想定読者（developer | architect | agent）
- **doctor コマンド**: 環境と .spec の健全性チェック（--format json）
- **init / intent / plan**: `--format json` で機械可読出力
- **schemas/verify-result.schema.json**: verify 出力の JSON Schema
- **schemas/tasks.schema.json**: tasks.json の JSON Schema
- **CLI スナップショットテスト・E2E テスト**: init → verify、doctor、emit の一周

### Changed

- バージョンを package.json から一元管理
- README / PRD / AGENTS.md に新定義を反映

## [0.2.0] - 2026-03-14

### Added

- **intent コマンド**: 自然言語要件から構造化 IR への変換
  - `requirements.json`（機能/非機能要求、不変条件、用語集、禁止事項、曖昧語）
  - `open_questions.md`（clarification loop 用）
  - `assumptions.toml`（暫定仮定）
  - `--file` オプションで長文入力対応
- **plan コマンド**: 設計成果物の生成
  - `tasks.json`（dependsOn, layer, ownership）
  - `design.md`, `adr/0001-*.md`, `model.puml`, `testplan.json`, `trace-seed.json`
  - `--force` で未解決質問があっても強制実行
- **trace サブコマンド**:
  - `trace build`: requirements + tasks + AST から trace.json を生成
  - `trace diff`: 変更ファイルの影響範囲（requirement/test/task）を列挙
  - `trace explain`: ファイル・違反がどの要件にぶつかるかを返す
- **verify 拡張**:
  - re-export（ExportDeclaration）のレイヤー違反検出
  - パッケージ import の allow/deny ルール（constitution.packageRules）
  - 循環依存検出（Tarjan の SCC、node_modules 除外）
- JSON Schema: `schemas/requirements.schema.json`, `schemas/trace.schema.json`
- LLM アダプター: `ILlmAdapter` / `OpenAILlmAdapter`（OpenAI API）

### Changed

- `node_modules` を AST 解析対象から除外
- Counterexample に `PackageViolation`, `ReExportViolation`, `CyclicDependencyViolation` を追加
- Constitution に `packageRules`, `checks` を追加（オプション）

## [0.1.0] - 2025-03-14

### Added

- `init`: 憲法ファイル（constitution.toml）の生成
- `verify`: アーキテクチャ検証（ImportDeclaration ベース）
- `impl --isolated-prompt`: タスク単位の隔離プロンプト生成
- JSON/Text フォーマッター、repairPrompt 出力
