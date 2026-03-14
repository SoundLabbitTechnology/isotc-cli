# isotc-cli テストシミュレーションレポート

**実施日**: 2026-03-14  
**目的**: レビュー指摘に基づく「README 約束と実装の一致」検証、棚卸し表の作成

---

## 1. 実行結果サマリ

### 1.1 既存テスト

| テストスイート | 結果 | 備考 |
|----------------|------|------|
| verifyResultSchema.test.ts | ✅ 3 passed | verify JSON 出力がスキーマ準拠 |
| formatters.test.ts | ✅ 5 passed | Text/JSON フォーマッタ |
| verifyArchitectureUseCase.test.ts | ✅ 1 passed | 検証ユースケース |
| ruleValidator.test.ts | ✅ 3 passed | ルール検証ロジック |
| cliSnapshot.test.ts | ✅ 4 passed | --help, --version, サブコマンド一覧 |
| e2e.test.ts | ✅ 3 passed | init→verify, doctor, emit copilot |

**全 19 テストパス**

### 1.2 実機シミュレーション結果

| コマンド | 実行結果 | JSON 出力 | 終了コード |
|----------|----------|------------|------------|
| `init --force --format json` | ✅ 成功 | 準拠 | 0 |
| `verify --format json` | ✅ 成功 | 準拠（違反時は 2） | 0 / 2 |
| `verify --staged --format json` | ✅ 動作 | 準拠 | - |
| `verify --changed-files "..." --format json` | ✅ 動作 | 準拠 | - |
| `doctor --format json` | ✅ 成功 | 準拠 | 0 |
| `emit copilot --force --format json` | ✅ 成功 | 準拠 | 0 |
| `emit claude --force --format json` | ✅ 成功 | 準拠 | 0 |
| `emit agents --force --format json` | ✅ 成功 | 準拠 | 0 |
| `handoff --format json` | ✅ 成功 | 準拠 | 0 |
| `trace build` | ✅ 成功 | trace.json 生成 | 0 |
| `trace diff --files src/index.ts` | ✅ 成功 | JSON 準拠 | 0 |
| `trace explain src/index.ts` | ✅ 成功 | JSON 準拠 | 0 |
| `impl --task-id 1.1 --isolated-prompt` | ✅ 成功 | 隔離プロンプト出力 | 0 |
| `intent "..." --format json` | ⚠️ LLM 必須 | OPENAI_API_KEY 必要 | - |
| `plan --format json` | ⚠️ LLM 必須 | requirements.json 前提 | - |

---

## 2. 棚卸し表（実装済み / 部分実装 / README先行）

README および docs/2_REQUIREMENTS.md に記載の各コマンドを基準に、実装状況を分類した。

| コマンド | 状態 | 入力 | 生成物 | 終了コード | JSON Schema | 失敗条件 | 備考 |
|----------|------|------|--------|------------|-------------|----------|------|
| **init** | ✅ 実装済 | --pattern, --force | .spec/constitution.toml | 0/1 | 非公式 | constitution 既存で --force なし | v0.3 核 |
| **verify** | ✅ 実装済 | --format, --staged, --changed-files, --audience | 検証結果 | 0/2/3 | verify-result.schema.json | constitution 欠損=3, 違反=2 | v0.3 核、守備範囲 README 相当 |
| **doctor** | ✅ 実装済 | --format | チェック結果 | 0/1 | 非公式 | - | v0.3 核 |
| **emit copilot** | ✅ 実装済 | --force, --format | .github/copilot-instructions.md | 0/1 | 非公式 | constitution 欠損 | v0.3 核 |
| **emit claude** | ✅ 実装済 | --force, --format | CLAUDE.md | 0/1 | 非公式 | constitution 欠損 | v0.5 想定 |
| **emit agents** | ✅ 実装済 | --force, --format | .github/agents/architecture.agent.md | 0/1 | 非公式 | constitution 欠損 | v0.5 想定 |
| **handoff** | ✅ 実装済 | --for, --task-id, --format | 役割別プロンプト | 0/1 | 非公式 | tasks.json 欠損時は概要のみ | v0.4 spec pipeline |
| **trace build** | ✅ 実装済 | (requirements+tasks+AST) | .spec/trace.json | 0/1 | trace.schema.json | 前提ファイル欠損 | v0.4 spec pipeline |
| **trace diff** | ✅ 実装済 | --files | 影響範囲 JSON | 0 | 非公式 | - | v0.4 |
| **trace explain** | ✅ 実装済 | target | トレースパス JSON | 0 | 非公式 | - | v0.4 |
| **impl** | ⚠️ 部分実装 | --task-id, --isolated-prompt | 隔離プロンプト | 0/1 | - | tasks.json 欠損 | `--isolated-prompt` のみ。実装委譲は未実装 |
| **intent** | ✅ 実装済* | 要件テキスト, --file | requirements.json, open_questions.md, assumptions.toml | 0/1 | requirements.schema.json | OPENAI_API_KEY 欠損 | *LLM 必須、E2E 未カバー |
| **plan** | ✅ 実装済* | --approve, --force | tasks.json, design.md, adr/, model.puml, testplan.json, trace-seed.json | 0/1 | tasks.schema.json | open_questions 未解決で --force なし | *LLM 必須、E2E 未カバー |

**凡例**
- ✅ 実装済: README の約束どおり動作し、契約が明確
- ⚠️ 部分実装: 一部機能のみ、または前提条件が重い
- ❌ README 先行: 未実装（本 repo には該当なし）

---

## 3. 契約の固定状況

### 3.1 固定済み

| 項目 | 状態 |
|------|------|
| verify 終了コード 0/1/2/3 | 2_REQUIREMENTS.md 3.4 準拠、実装一致 |
| verify JSON スキーマ | schemas/verify-result.schema.json、テストで検証 |
| init --format json | 出力形式固定 |
| doctor --format json | 出力形式固定 |
| emit * --format json | 出力形式固定 |

### 3.2 要固定（v0.3 完了に向けて）

| 項目 | 推奨アクション |
|------|----------------|
| init JSON Schema | schemas/init-result.schema.json の追加 |
| doctor JSON Schema | schemas/doctor-result.schema.json の追加 |
| emit JSON Schema | schemas/emit-result.schema.json の追加 |
| handoff JSON Schema | schemas/handoff-result.schema.json の追加 |
| trace diff/explain JSON Schema | 必要に応じて追加 |

### 3.3 E2E テストの拡充

| シナリオ | 現状 | 推奨 |
|----------|------|------|
| init → verify | ✅ あり | 維持 |
| init → doctor | ✅ あり | 維持 |
| init → emit copilot | ✅ あり | emit claude, emit agents を追加 |
| verify --staged | ❌ なし | 追加（git 操作をモック） |
| verify --changed-files | ❌ なし | 追加 |
| handoff --format json | ❌ なし | 追加 |
| trace build → trace diff | ❌ なし | 追加（モック requirements/tasks で） |
| impl --isolated-prompt | ❌ なし | 追加 |

---

## 4. マイルストーンとの対応

レビューで提案されたマイルストーンとの対応。

### v0.3 完了条件: init / verify / doctor / emit copilot の完全安定化

| コマンド | 状態 | 残タスク |
|----------|------|----------|
| init | ✅ 安定 | JSON Schema 追加、E2E 維持 |
| verify | ✅ 安定 | --staged / --changed-files の E2E 追加 |
| doctor | ✅ 安定 | JSON Schema 追加 |
| emit copilot | ✅ 安定 | emit claude / agents の E2E 追加 |

**判定**: v0.3 はほぼ達成。JSON Schema と E2E の拡充で「完全安定化」とする。

### v0.4: intent / plan / trace build / handoff の spec pipeline 閉じる

| コマンド | 状態 | 残タスク |
|----------|------|----------|
| intent | ✅ 実装済 | LLM モックでの E2E、またはスキップ条件の明示 |
| plan | ✅ 実装済 | 同上 |
| trace build | ✅ 実装済 | E2E 追加 |
| handoff | ✅ 実装済 | E2E 追加 |

### v0.5: emit claude / emit agents / review / explain / fix --dry-run

| 項目 | 状態 |
|------|------|
| emit claude | ✅ 実装済 |
| emit agents | ✅ 実装済 |
| review | README に未記載 |
| explain | trace explain で対応済み |
| fix --dry-run | 未実装（verify --auto-fix は将来拡張） |

---

## 5. 結論と推奨アクション

### 結論

- **「構想の整理はかなり進んだ」** 状態であり、**実装も README の約束とおおむね一致**している。
- 全 19 テストパス、主要コマンド（init, verify, doctor, emit *, handoff, trace *, impl --isolated-prompt）は実機で動作確認済み。
- intent / plan は LLM 必須のため E2E 未カバーだが、実装は存在する。

### 推奨アクション（優先順）

1. **v0.3 完了**: init / doctor / emit の JSON Schema を追加し、E2E で verify --staged / --changed-files をカバーする。
2. **契約の固定**: 各コマンドの「入力・生成物・終了コード・失敗条件」を 2_REQUIREMENTS.md に明記し、テストと同期させる。
3. **intent / plan の E2E**: LLM をモックするか、OPENAI_API_KEY 未設定時はスキップする E2E を追加する。
4. **サンプル repo**: README のフローをそのまま実行できるサンプルリポジトリを用意し、「実際に回る」ことを示す。

---

*本レポートは、レビュー指摘の「README に書いた約束を一つずつ"動く契約"に変える」方針に沿って作成した。*
