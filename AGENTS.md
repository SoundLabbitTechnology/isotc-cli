# isotc-cli — AI エージェント向けガイド

isotc-cli は **Spec Compiler + Agent Runtime Policy + Human-Centered Guardrail** として、requirements / constraints / architecture decisions を実行可能な repo policy に変換する。コマンド契約・終了コード・I/O の詳細は [docs/2_REQUIREMENTS.md](docs/2_REQUIREMENTS.md) に準拠する。

## 最短導線

- **推奨**: npm パッケージを一行で実行する。`npx isotc-cli@latest <command>`
- **ソースビルド**: 開発時のみ。`git clone` → `npm install && npm run build` は貢献者向け。

## 機械可読コマンド一覧（--format json 対応）

| コマンド | 用途 |
|----------|------|
| `init --force --format json` | 初期化結果（specDir, constitutionPath） |
| `intent --format json` | 要件生成サマリ（functionalRequirementsCount 等） |
| `plan --format json` | タスク生成サマリ（taskCount, tasksPath 等） |
| `handoff --format json` | 役割別ハンドオフ（role, taskId, content） |
| `verify --format json` | 検証結果（status, violations, repairPrompt） |
| `doctor --format json` | 環境チェック（constitution, openApiKeySet 等） |
| `emit copilot --format json` | 生成パス（outputPath） |

CI / AI 連携時は必ず `--format json` を指定する。stdout に純粋な JSON のみ出力される。

## 検証コマンド

- アーキテクチャ検証: `isotc verify --format json`
- pre-commit hook 用: `isotc verify --staged --format json`
- 対象ファイル指定: `isotc verify --changed-files "src/a.ts,src/b.ts" --format json`
- 出力読者指定: `isotc verify --audience agent`（developer | architect | agent）

## 環境チェック

- `isotc doctor --format json`: constitution 存在、requirements.json、OPENAI_API_KEY 等をチェック。CI で事前確認に利用。

## Agent 配布（emit）

constitution から Agent 環境向けの設定を生成する。

- `isotc emit copilot --force`: .github/copilot-instructions.md（GitHub Copilot 用）
- `isotc emit claude --force`: CLAUDE.md（Claude Code 用）
- `isotc emit agents --force`: .github/agents/architecture.agent.md

## 終了コード契約

| コード | 意味 |
|-------|------|
| 0 | 成功（検証パス、タスク完了） |
| 1 | 一般的なエラー（引数間違い、設定欠損） |
| 2 | 検証エラー（アーキテクチャ違反）— AI の自己修復ループに利用 |
| 3 | 致命的なエラー（設定ファイル破損、解析不能） |

## 環境

- **Node.js**: 20 を推奨（engines は >=18）
- **非対話モード**: `init --force`、`plan --approve`、`plan --force` で自動実行可能。
