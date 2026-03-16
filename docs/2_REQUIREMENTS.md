# isotc-cli 要求仕様書 (Requirements Specification)

**バージョン:** 1.2  
**最終更新:** 2026-03-14

---

## 1. 文書の目的

本ドキュメントは、isotc-cli が満たすべき**機能的・非機能的な振る舞い**と、人間・AI・CI間の「コマンド契約」を定義する。

---

## 2. コマンド一覧と基本仕様

### 2.1 サマリ

| コマンド | 目的 | 主要引数 / オプション | 成功時 stdout |
|----------|------|------------------------|---------------|
| `init` | プロジェクトの初期化と憲法ファイルの生成 | `--pattern <hexagonal\|mvc>`, `--force`, `--format json` | 初期化完了メッセージ、`.spec/` の生成 |
| `intent` | 自然言語要件から構造化要件（Requirements）の生成 | `"<要件テキスト>"`, `--file`, `--format json` | 生成された要件のサマリ |
| `plan` | 要件からの技術設計とタスク（DAG）分解 | `--approve`, `--force`, `--format json` | `tasks.json` および `design.md` |
| `impl` | 指定タスクの隔離環境での実装（AIエージェントへの委譲） | `--task-id <ID>`, `--agent <aider\|cline>`, `--isolated-prompt` | 実装完了のステータス、または隔離プロンプト |
| `handoff` | 役割別ハンドオフ出力 | `--for <implementer\|reviewer\|tester\|architect>`, `--task-id`, `--format json` | 役割別プロンプト |
| `verify` | アーキテクチャおよび仕様の検証と反例（進化圧）の生成 | `--format <text\|json>`, `--staged`, `--changed-files`, `--audience`, `--auto-fix` | 検証結果レポート（違反時は反例） |
| `emit` | constitution から Agent 環境向け設定を生成 | `copilot`, `claude`, `agents` サブコマンド | 生成ファイルのパス |
| `doctor` | 環境と .spec の健全性チェック | `--format json` | チェック結果（JSON） |
| `config` | LLM アダプター設定の表示・変更 | `set`, `show`, `list-providers` サブコマンド | 設定結果 |

### 2.2 コマンド詳細

#### `isotc init`

プロジェクトに `.spec/` ディレクトリと憲法ファイルを生成する。

```
isotc init [--pattern hexagonal|mvc] [--force] [--format json]
```

- **--pattern**: テンプレートパターン。未指定時は対話式またはデフォルト（hexagonal）
- **--force**: 既存ファイルを上書き
- **--format json**: 機械可読な初期化結果を stdout に出力
- **出力**: `.spec/constitution.toml` の生成、初期化完了メッセージ

#### `isotc intent`

自然言語の要件テキストを構造化された Requirements に変換する。

```
isotc intent [要件テキスト] [--file <path>] [--format json]
```

- **入力**: 自然言語の要件（引用符で囲む）、または `--file` でファイル指定
- **--format json**: 生成結果のサマリを stdout に JSON で出力
- **出力**: `.spec/requirements.json`、`.spec/open_questions.md`、`.spec/assumptions.toml` を同時生成
- **前提**: `ISOTC_LLM_PROVIDER` で指定したプロバイダーに対応する API キー（OPENAI_API_KEY / GEMINI_API_KEY / ANTHROPIC_API_KEY）が必要

#### `isotc plan`

構造化要件から技術設計とタスクDAGを生成する。

```
isotc plan [--approve] [--force] [--format json]
```

- **--approve**: 対話確認をスキップし、自動で設計を確定
- **--force**: 未解決の質問（open_questions.md）があっても強制実行
- **--format json**: 生成結果のサマリを stdout に JSON で出力
- **出力**: `tasks.json`、`design.md`、`adr/0001-*.md`、`model.puml`、`testplan.json`、`trace-seed.json`
- **制御**: `openQuestionIds` が 1 件以上ある場合、`--force` なしでは失敗（clarification loop）

#### `isotc trace`

トレーサビリティグラフの構築と照会。

```
isotc trace build
isotc trace diff --files <path...>
isotc trace explain <target>
```

- **build**: requirements + tasks + AST から `.spec/trace.json` を生成
- **diff**: 変更ファイルから影響する requirement / test / task を列挙
- **explain**: ファイルまたはノード ID がどの要件にぶつかるかを返す

#### `isotc impl`

指定タスクを隔離環境でAIエージェントに実装させる。

```
isotc impl --task-id <ID> [--agent aider|cline] [--isolated-prompt]
```

- **--task-id**: 実装対象タスクのID（`tasks.json` 参照）
- **--agent**: 委譲先AIエージェント。未指定時は環境変数 `ISOTC_AGENT` またはデフォルト
- **--isolated-prompt**: タスク単位の隔離プロンプトを stdout に出力。新規チャットに貼り付けてコンテキストクリアを実現
- **出力**: 実装完了ステータス、または `--isolated-prompt` 時は隔離プロンプト

#### `isotc verify`

アーキテクチャ規約および仕様への準拠を検証する。

```
isotc verify [--format text|json] [--staged] [--changed-files <paths>] [--audience <developer|architect|agent>] [--auto-fix]
```

- **--format**: 出力形式。`text`（人間向け）、`json`（機械可読）。デフォルト: `text`
- **--staged**: ステージ済みファイルのみ検証（pre-commit hook 用）
- **--changed-files**: 検証対象ファイルをカンマ区切りで指定
- **--audience**: 出力の想定読者。`developer`（デフォルト）| `architect` | `agent`
- **--auto-fix**: 自動修正を試行（将来拡張）
- **出力**: 検証結果。違反時は反例を出力。JSON 時は `audience` フィールドを含む

#### `isotc handoff`

役割別のハンドオフコンテキストを出力する。

```
isotc handoff [--for implementer|reviewer|tester|architect] [--task-id <id>] [--format json]
```

- **--for**: 役割。`implementer`（デフォルト）| `reviewer` | `tester` | `architect`
- **--task-id**: タスク ID（未指定時は概要のみ）
- **--format json**: 機械可読な出力（role, taskId, content）

#### `isotc emit`

constitution から Agent 環境向けの設定ファイルを生成する。

```
isotc emit copilot [--force] [--format json]
isotc emit claude [--force] [--format json]
isotc emit agents [--force] [--format json]
```

- **copilot**: `.github/copilot-instructions.md` を生成
- **claude**: `CLAUDE.md`（Claude Code 用）を生成
- **agents**: `.github/agents/architecture.agent.md` を生成

#### `isotc doctor`

環境と .spec の健全性をチェックする。

```
isotc doctor [--format json]
```

- **--format json**: チェック結果を JSON で出力（デフォルト）
- **出力**: constitution 存在、requirements.json、LLM プロバイダー別 API キー（OPENAI_API_KEY / GEMINI_API_KEY / ANTHROPIC_API_KEY）の状態

#### `isotc config`

LLM アダプター設定を `.spec/config.toml` で管理する。API キーは保存せず、プロバイダーとモデルのみ。

```
isotc config set <key> <value>
isotc config show [--format json]
isotc config list-providers [--format json]
```

- **set**: `provider`（openai | gemini | claude）または `model` を設定
- **show**: 有効な設定を表示（優先順位: 環境変数 > config ファイル > デフォルト）
- **list-providers**: 利用可能なプロバイダーと必要な環境変数を表示
- **前提**: `isotc init` 実行済み（.spec が存在すること）

---

## 3. 機械可読I/O仕様（AI / CI連携用）

AIエージェントやCIからの呼び出しを前提とするため、入出力の安定性を厳格に保証する。

### 3.1 JSON出力モード

`--format json` 指定時は、**stdout に純粋なJSONのみ**を出力する。プログレス表示やログは stderr に出力する。

### 3.2 `isotc verify --format json` の出力スキーマ

**成功時:**

```json
{
  "status": "passed",
  "violations": [],
  "durationMs": 1234
}
```

**失敗時（アーキテクチャ違反）:**

```json
{
  "status": "failed",
  "violations": [
    {
      "type": "ArchitectureViolation",
      "file": "src/domain/user.ts",
      "line": 12,
      "importedModule": "../infrastructure/userRepository",
      "sourceLayer": "domain",
      "targetLayer": "infrastructure",
      "message": "Domain layer must not import infrastructure layer.",
      "suggestion": "Use dependency injection and define an interface in the domain layer.",
      "codeSnippet": "import { UserRepository } from '../infrastructure/userRepository';"
    },
    {
      "type": "PackageViolation",
      "file": "src/domain/config.ts",
      "importedModule": "fs",
      "sourceLayer": "domain",
      "message": "domain layer must not use package fs."
    },
    {
      "type": "CyclicDependencyViolation",
      "file": "src/a.ts",
      "cycle": ["src/a.ts", "src/b.ts", "src/a.ts"],
      "message": "Cyclic dependency: src/a.ts → src/b.ts → src/a.ts"
    }
  ],
  "repairPrompt": "以下のアーキテクチャ違反を修正してください。...",
  "durationMs": 2345
}
```

- **violations[].type**: `ArchitectureViolation` | `ReExportViolation` | `PackageViolation` | `CyclicDependencyViolation`
- **repairPrompt**: AI がそのままプロンプトに使える修復指示文。自己修復ループで `verify` の出力を LLM に渡す際に利用
- **audience**: `--audience` オプションで指定した値（`developer` | `architect` | `agent`）
- **注**: `file` はプロジェクトルートからの相対パスで出力する。CIでの絶対パス解決は呼び出し側で行う
- **JSON Schema**: [schemas/verify-result.schema.json](../schemas/verify-result.schema.json) を参照

### 3.3 標準出力と標準エラー出力の分離

| ストリーム | 用途 |
|------------|------|
| **stdout** | 機械可読なデータ（JSON）または正常終了メッセージ |
| **stderr** | 人間向けのログ、プログレスバー、デバッグ情報 |

### 3.4 終了コード (Exit Codes)

| コード | 意味 | AIエージェントの推奨アクション |
|--------|------|------------------------------|
| **0** | 成功（検証パス、タスク完了） | 次のタスクへ進む |
| **1** | 一般的なエラー（引数間違い、設定欠損など） | エラーメッセージを表示し、人間に報告 |
| **2** | 検証エラー（アーキテクチャ違反、仕様違反） | 反例をコンテキストに含め、自己修復ループに入る |
| **3** | 致命的なエラー（設定ファイル破損、解析不能など） | 人間の介入を要する旨を報告 |

### 3.5 環境変数一覧

| 変数 | 説明 | デフォルト |
|------|------|------------|
| `ISOTC_LLM_PROVIDER` | LLM プロバイダー: `openai` \| `gemini` \| `claude` | openai |
| `ISOTC_LLM_MODEL` | 使用するモデル（プロバイダー依存） | gpt-4o-mini / gemini-2.0-flash / claude-3-5-sonnet-20241022 |
| `ISOTC_MODE` | isotc のモード: `llm` \| `agent` | llm |
| `OPENAI_API_KEY` | OpenAI API キー（openai 利用時） | - |
| `GEMINI_API_KEY` | Gemini API キー（gemini 利用時） | - |
| `GOOGLE_API_KEY` | Gemini 用の代替環境変数 | - |
| `ANTHROPIC_API_KEY` | Claude API キー（claude 利用時） | - |

詳細は [5_LLM_CONFIGURATION.md](./5_LLM_CONFIGURATION.md) を参照。

### 3.6 .spec/config.toml スキーマ

`isotc config set` で生成されるプロジェクト固有の LLM/モード設定。API キーは含めない。

```toml
[llm]
provider = "openai"      # openai | gemini | claude
model = "gpt-4o-mini"    # 任意。プロバイダーごとのデフォルトモデル
mode = "llm"             # llm | agent
```

### 3.7 `isotc config show --format json` の出力

```json
{
  "provider": "gemini",
  "model": "gemini-2.0-flash",
  "source": {
    "provider": "config",
    "model": "default",
    "mode": "config"
  },
  "apiKeySet": true,
  "mode": "agent",
  "configPath": ".spec/config.toml"
}
```

- **source.provider / source.model / source.mode**: `env` | `config` | `default`（設定の由来）

---

## 4. 非機能要件・制約条件

### 4.1 冪等性 (Idempotency)

`plan` および `verify` コマンドは、**何度実行してもシステムの状態を破壊しない**。  
`init` は既存の `.spec/` がある場合の挙動を明示する（上書き確認または `--force` で上書き）。

### 4.2 実行速度

| コマンド | 目標 | 理由 |
|----------|------|------|
| `verify`（AST解析） | **5秒以内** | AIのフィードバックループを阻害しないため |
| `plan` | 30秒以内（LLM呼び出し含む） | 対話的な設計支援の応答性 |
| `intent` | 15秒以内（LLM呼び出し含む） | 同上 |

> 通常規模: ソースファイル数 500 以下、依存関係 2000 以下を想定

### 4.3 セキュリティ

- **機密情報の扱い**: `.spec/constitution.toml` 等の設定ファイルに **APIキーなどの機密情報を平文で保存させない**。環境変数（`OPENAI_API_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY`）経由での注入を強制する。
- **サンドボックス**: `impl` 実行時、AIエージェントがアクセスできるディレクトリをタスク単位で制限する（将来拡張）。

### 4.4 互換性

- **Node.js**: v18 以上をサポート
- **設定ファイル**: TOML 形式（`constitution.toml`, `config.toml`）、JSON 形式（`requirements.json`, `tasks.json`）

---

## 5. 実装状況（現時点）

| コマンド | 状態 | 備考 |
|----------|------|------|
| `init` | **実装済** | `[steering]` セクション、`--format json` |
| `intent` | **実装済** | LLM による構造化（OpenAI / Gemini / Claude 対応）、3ファイル出力、`--format json` |
| `plan` | **実装済** | 設計成果物一式、open_questions チェック、`--force`、`--format json` |
| `impl` | **部分実装** | `--isolated-prompt` で隔離プロンプト生成のみ対応 |
| `handoff` | **実装済** | 役割別ハンドオフ、`--format json` |
| `verify` | **実装済** | import/re-export/パッケージ/循環依存、`--staged`/`--changed-files`/`--audience`、repairPrompt |
| `trace build` | **実装済** | requirements + tasks + AST から trace.json |
| `trace diff` | **実装済** | 変更影響範囲の列挙 |
| `trace explain` | **実装済** | ファイル→要件のトレース |
| `emit copilot` | **実装済** | .github/copilot-instructions.md を constitution から生成 |
| `emit claude` | **実装済** | CLAUDE.md を constitution から生成 |
| `emit agents` | **実装済** | .github/agents/architecture.agent.md を生成 |
| `doctor` | **実装済** | 環境・.spec 健全性チェック（LLM プロバイダー別 API キー確認）、`--format json` |
| `config` | **実装済** | set/show/list-providers、.spec/config.toml によるプロジェクト固有設定 |

---

## 6. JSON Schema 一覧

| スキーマ | 用途 |
|----------|------|
| [schemas/verify-result.schema.json](../schemas/verify-result.schema.json) | `verify --format json` の出力 |
| [schemas/requirements.schema.json](../schemas/requirements.schema.json) | `intent` の requirements.json |
| [schemas/tasks.schema.json](../schemas/tasks.schema.json) | `plan` の tasks.json |
| [schemas/trace.schema.json](../schemas/trace.schema.json) | `trace build` の trace.json |

## 7. 参照

- [0_INDEX.md](./0_INDEX.md) - ドキュメント一覧
- [5_LLM_CONFIGURATION.md](./5_LLM_CONFIGURATION.md) - LLM プロバイダー選択・設定ガイド
- [3_ARCHITECTURE.md](./3_ARCHITECTURE.md) - 内部アーキテクチャ設計
- [Counterexample エンティティ](../src/domain/entities/counterexample.ts) - 反例のドメインモデル（`sourceFile`→`file`, `lineNumber`→`line` でJSON出力にマッピング）
