# Changelog

All notable changes to isotc-cli will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
