# isotc-cli

**Intent-to-Spec Optimal Transport Compiler CLI** — Spec Compiler + Agent Runtime Policy + Human-Centered Guardrail

isotc-cli は、**requirements / constraints / architecture decisions を実行可能な repo policy に変換する spec compiler** である。単なる architecture linter ではなく、仕様をコンパイルし、AI/人間/CI に同じ境界を配布し、違反を継続検査する CLI として設計されている。憲法（Constitution）に基づいた検証と自己修復により、AIエージェントによる ad-hoc prompt-based development（Vibe-coding）が引き起こすアーキテクチャ破壊を防ぐ。

## インストール

```bash
# 一行で実行（推奨）
npx isotc-cli@latest verify

# または
npm exec --yes isotc-cli@latest -- verify
```

以下、`isotc` は `npx isotc-cli@latest` の省略形として記載します。

### 開発者向け（ソースビルド）

```bash
git clone https://github.com/SoundLabbitTechnology/isotc-cli.git
cd isotc-cli
npm install && npm run build
npm link  # 任意
```

## 使い方

### 1. プロジェクトの初期化

```bash
isotc init
# → .spec/constitution.toml が生成される
```

### 2. 仕様→計画→実装→検証のフロー

```bash
# 自然言語要件を構造化（OPENAI_API_KEY が必要）
isotc intent "ユーザーはメールでログインできる。応答は200ms以内とする。"
# → .spec/requirements.json, open_questions.md, assumptions.toml を生成

# 設計とタスク分解（未解決の質問がある場合は失敗。--force で強制実行可）
isotc plan
# → .spec/tasks.json, design.md, adr/, model.puml, testplan.json, trace-seed.json を生成

# トレーサビリティグラフの構築
isotc trace build
# → .spec/trace.json を生成

# タスク単位の隔離プロンプトで実装委譲
isotc impl --task-id 1.1 --isolated-prompt > prompt.txt

# アーキテクチャ検証
isotc verify
```

### 3. アーキテクチャ検証

```bash
# 人間向けテキスト出力
isotc verify

# CI / AI連携用 JSON 出力
isotc verify --format json

# pre-commit hook 用（ステージ済みファイルのみ検証）
isotc verify --staged --format json

# 対象ファイルを指定して検証
isotc verify --changed-files "src/a.ts,src/b.ts" --format json
```

**終了コード**（[2_REQUIREMENTS.md](docs/2_REQUIREMENTS.md) 3.4 準拠）:

| コード | 意味 |
|-------|------|
| 0 | 成功（検証パス、タスク完了） |
| 1 | 一般的なエラー（引数間違い、設定欠損） |
| 2 | 検証エラー（アーキテクチャ違反）— AI の自己修復ループに利用 |
| 3 | 致命的なエラー（設定ファイル破損、解析不能） |

### 4. CI での利用（GitHub Actions）

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: "npm"
- run: npx isotc-cli@latest init --force
- run: npx isotc-cli@latest verify --format json
```

CI / AI 連携時は `verify --format json` を指定し、stdout に純粋な JSON のみ出力させることを推奨します。

composite action を使う場合:

```yaml
- uses: actions/checkout@v4
- uses: SoundLabbitTechnology/isotc-cli/.github/actions/setup-isotc@main
- run: npx isotc-cli@latest init --force
- run: npx isotc-cli@latest verify --format json
```

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `init` | 憲法ファイル（.spec/constitution.toml）の生成 |
| `intent` | 自然言語要件から構造化要件の生成（requirements.json, open_questions.md, assumptions.toml） |
| `plan` | 技術設計とタスク分解（design.md, adr/, model.puml, testplan.json, trace-seed.json） |
| `impl` | AIエージェントへの実装委譲（`--isolated-prompt` で隔離プロンプト生成） |
| `handoff` | 役割別ハンドオフ出力（implementer / reviewer / tester / architect） |
| `verify` | アーキテクチャ検証（import/re-export/パッケージ/循環依存）と反例の出力 |
| `trace build` | トレーサビリティグラフ（trace.json）の構築 |
| `trace diff` | 変更ファイルから影響する requirement / test を列挙 |
| `trace explain` | ファイル・違反がどの要件にぶつかるかを返す |
| `emit copilot` | constitution から .github/copilot-instructions.md を生成 |
| `emit claude` | constitution から CLAUDE.md を生成（Claude Code 用） |
| `emit agents` | constitution から .github/agents/architecture.agent.md を生成 |
| `doctor` | 環境と .spec の健全性チェック |

### 環境変数

| 変数 | 説明 |
|------|------|
| `OPENAI_API_KEY` | intent / plan で LLM 呼び出し時に必須 |
| `ISOTC_LLM_MODEL` | 使用するモデル（デフォルト: gpt-4o-mini） |

### コンテキストクリアの推奨ワークフロー

タスク切り替え時は、前タスクの会話履歴に引っ張られず仕様に集中するため、**コンテキストを切る**ことを推奨します。

```bash
# タスク 1.1 の隔離プロンプトを生成
isotc impl --task-id 1.1 --isolated-prompt > prompt_1.1.txt

# 新規チャットを開き、prompt_1.1.txt の内容を貼り付けて実装
# タスク 1.2 に進む際は /clear または新規チャットで再度
isotc impl --task-id 1.2 --isolated-prompt > prompt_1.2.txt
```

## 憲法（Constitution）

`.spec/constitution.toml` でレイヤー、依存ルール、Agent Steering を定義します。AI が扱えるコンテキスト境界を保つ設計が有利だという仮説に基づき、モジュール境界を明示的に検証可能にします。

```toml
[[layers]]
name = "domain"
basePath = "src/domain/**"

[rules]
domain = []
application = ["domain"]
infrastructure = ["domain", "application"]

# オプション: レイヤーごとのパッケージ import ルール
[rules.packages.domain]
allow = []
deny = ["fs", "path", "process"]

[steering]
codingStandards = "ESLint + Prettier を推奨"
technologyStack = "TypeScript, Node.js 18+"
designPrinciples = "ヘキサゴナルアーキテクチャを厳守"
```

`verify` は import 違反に加え、re-export、パッケージ import、循環依存を検出します。

## Agent 配布（emit）

constitution を定義した後、`isotc emit` で各 Agent 環境向けの設定ファイルを生成できる。

```bash
# GitHub Copilot 用
isotc emit copilot --force

# Claude Code 用
isotc emit claude --force

# GitHub Agents 用
isotc emit agents --force
```

生成されたファイルは、各 Agent が constitution に基づいたアーキテクチャ規約を参照するための指示として機能する。詳細は [AGENTS.md](AGENTS.md) を参照。

## ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [docs/0_INDEX.md](docs/0_INDEX.md) | ドキュメント一覧・ナビゲーション |
| [docs/1_PRD.md](docs/1_PRD.md) | プロダクト要求仕様書 |
| [docs/2_REQUIREMENTS.md](docs/2_REQUIREMENTS.md) | コマンド契約・I/O仕様・JSON Schema |
| [docs/3_ARCHITECTURE.md](docs/3_ARCHITECTURE.md) | 内部アーキテクチャ設計 |
| [docs/4_RESEARCH_BACKGROUND.md](docs/4_RESEARCH_BACKGROUND.md) | 学術的裏付けと参考文献 |
| [AGENTS.md](AGENTS.md) | AI エージェント向けガイド（機械可読コマンド一覧） |

## 開発

```bash
npm install
npm run build
npm test
```

## License

本プロジェクトは [MIT License](LICENSE) の下で公開されています。

Copyright (c) 2025 Sound Labbit Technology Inc.

---

- [CONTRIBUTING.md](CONTRIBUTING.md) - 貢献ガイドライン（互換性ポリシー・破壊的変更ポリシー含む）
- [SECURITY.md](SECURITY.md) - 脆弱性報告について
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - 行動規範
