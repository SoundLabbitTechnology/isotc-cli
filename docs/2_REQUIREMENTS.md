# isotc-cli 要求仕様書 (Requirements Specification)

**バージョン:** 1.0  
**最終更新:** 2025-03-14

---

## 1. 文書の目的

本ドキュメントは、isotc-cli が満たすべき**機能的・非機能的な振る舞い**と、人間・AI・CI間の「コマンド契約」を定義する。

---

## 2. コマンド一覧と基本仕様

### 2.1 サマリ

| コマンド | 目的 | 主要引数 / オプション | 成功時 stdout |
|----------|------|------------------------|---------------|
| `init` | プロジェクトの初期化と憲法ファイルの生成 | `--pattern <hexagonal\|mvc>` | 初期化完了メッセージ、`.spec/` の生成 |
| `intent` | 自然言語要件から構造化要件（Requirements）の生成 | `"<要件テキスト>"` | 生成された要件のサマリ |
| `plan` | 要件からの技術設計とタスク（DAG）分解 | `--approve`（自動承認用） | `tasks.json` および `design.md` |
| `impl` | 指定タスクの隔離環境での実装（AIエージェントへの委譲） | `--task-id <ID>`, `--agent <aider\|cline>`, `--isolated-prompt` | 実装完了のステータス、または隔離プロンプト |
| `verify` | アーキテクチャおよび仕様の検証と反例（進化圧）の生成 | `--format <text\|json>`, `--auto-fix` | 検証結果レポート（違反時は反例） |

### 2.2 コマンド詳細

#### `isotc init`

プロジェクトに `.spec/` ディレクトリと憲法ファイルを生成する。

```
isotc init [--pattern hexagonal|mvc]
```

- **--pattern**: テンプレートパターン。未指定時は対話式またはデフォルト（hexagonal）
- **出力**: `.spec/constitution.toml` の生成、初期化完了メッセージ

#### `isotc intent`

自然言語の要件テキストを構造化された Requirements に変換する。

```
isotc intent "<要件テキスト>"
```

- **入力**: 自然言語の要件（引用符で囲む）
- **出力**: 生成された要件のサマリ（stdout）、`.spec/requirements.json` への保存

#### `isotc plan`

構造化要件から技術設計とタスクDAGを生成する。

```
isotc plan [--approve]
```

- **--approve**: 対話確認をスキップし、自動で設計を確定
- **出力**: `tasks.json`（タスクDAG）、`design.md`（技術設計）

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
isotc verify [--format text|json] [--auto-fix]
```

- **--format**: 出力形式。`text`（人間向け）、`json`（機械可読）。デフォルト: `text`
- **--auto-fix**: 自動修正を試行（将来拡張）
- **出力**: 検証結果。違反時は反例を出力

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
    }
  ],
  "repairPrompt": "以下のアーキテクチャ違反を修正してください。...",
  "durationMs": 2345
}
```

- **repairPrompt**: AI がそのままプロンプトに使える修復指示文。自己修復ループで `verify` の出力を LLM に渡す際に利用
- **注**: `file` はプロジェクトルートからの相対パスで出力する。CIでの絶対パス解決は呼び出し側で行う

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

- **機密情報の扱い**: `.spec/constitution.toml` 等の設定ファイルに **APIキーなどの機密情報を平文で保存させない**。環境変数（例: `OPENAI_API_KEY`）経由での注入を強制する。
- **サンドボックス**: `impl` 実行時、AIエージェントがアクセスできるディレクトリをタスク単位で制限する（将来拡張）。

### 4.4 互換性

- **Node.js**: v18 以上をサポート
- **設定ファイル**: TOML 形式（`constitution.toml`）、JSON 形式（`requirements.json`, `tasks.json`）

---

## 5. 実装状況（現時点）

| コマンド | 状態 | 備考 |
|----------|------|------|
| `init` | **実装済** | `[steering]` セクション対応 |
| `intent` | 未実装 | - |
| `plan` | 未実装 | - |
| `impl` | **部分実装** | `--isolated-prompt` で隔離プロンプト生成のみ対応 |
| `verify` | **実装済** | RuleValidator、JSON/Text 出力、repairPrompt、終了コード対応 |

---

## 6. 参照

- [3_ARCHITECTURE.md](./3_ARCHITECTURE.md) - 内部アーキテクチャ設計
- [Counterexample エンティティ](../src/domain/entities/counterexample.ts) - 反例のドメインモデル（`sourceFile`→`file`, `lineNumber`→`line` でJSON出力にマッピング）
