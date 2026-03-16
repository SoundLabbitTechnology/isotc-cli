# isotc-cli LLM 設定ガイド

**参照**: [0_INDEX.md](./0_INDEX.md) | [2_REQUIREMENTS.md](./2_REQUIREMENTS.md)

---

## 1. 概要

`intent` と `plan` コマンドは LLM（大規模言語モデル）を利用して、自然言語要件の構造化と技術設計の生成を行う。isotc-cli は **OpenAI**、**Gemini**（Google）、**Claude**（Anthropic）の 3 プロバイダーに対応している。

---

## 2. プロバイダー選択

| プロバイダー | 環境変数 | デフォルトモデル | 取得先 |
|-------------|----------|------------------|--------|
| **openai** | `OPENAI_API_KEY` | gpt-4o-mini | [platform.openai.com](https://platform.openai.com/api-keys) |
| **gemini** | `GEMINI_API_KEY` または `GOOGLE_API_KEY` | gemini-2.0-flash | [aistudio.google.com](https://aistudio.google.com/apikey) |
| **claude** | `ANTHROPIC_API_KEY` | claude-3-5-sonnet-20241022 | [console.anthropic.com](https://console.anthropic.com/) |

---

## 3. 設定方法

### 3.1 優先順位

設定の優先順位は次のとおり。

1. **環境変数** — `ISOTC_LLM_PROVIDER`、`ISOTC_LLM_MODEL`、`ISOTC_MODE`
2. **.spec/config.toml** — プロジェクト固有の設定（`isotc config set` で管理）
3. **デフォルト** — openai、プロバイダーごとのデフォルトモデル、mode=llm

### 3.2 環境変数での設定

```bash
# OpenAI を使う場合（デフォルト）
export OPENAI_API_KEY=sk-...
# オプション: モデル指定
export ISOTC_LLM_MODEL=gpt-4o

# Gemini を使う場合
export ISOTC_LLM_PROVIDER=gemini
export GEMINI_API_KEY=...
export ISOTC_LLM_MODEL=gemini-2.5-flash  # オプション

# Claude を使う場合
export ISOTC_LLM_PROVIDER=claude
export ANTHROPIC_API_KEY=sk-ant-...
export ISOTC_LLM_MODEL=claude-3-5-sonnet-20241022  # オプション
```

### 3.3 プロジェクト設定（.spec/config.toml）

`isotc init` 実行後、`isotc config` でプロジェクトごとの設定を保存できる。API キーは含めず、プロバイダー・モデル・モードのみ。

```bash
# プロバイダーを Gemini に設定
isotc config set provider gemini

# モデルを指定
isotc config set model gemini-2.5-flash

# モードを Agent に設定（LLM API キー不要）
isotc config set mode agent

# 現在の有効な設定を確認
isotc config show

# 利用可能なプロバイダー一覧
isotc config list-providers
```

**設定ファイル形式**（`.spec/config.toml`）:

```toml
[llm]
provider = "gemini"          # openai | gemini | claude
model = "gemini-2.5-flash"   # 任意。未指定時はプロバイダーごとのデフォルト
mode = "agent"               # llm | agent
```

---

## 4. クイックスタート（モード別 / プロバイダー別）

### LLM モード + OpenAI

```bash
export OPENAI_API_KEY=sk-...
isotc intent "ユーザーはメールでログインできる"
isotc plan --force
```

### LLM モード + Gemini

```bash
export ISOTC_LLM_PROVIDER=gemini
export GEMINI_API_KEY=...
isotc config set provider gemini  # プロジェクトに保存する場合
isotc intent "ユーザーはメールでログインできる"
```

### LLM モード + Claude

```bash
export ISOTC_LLM_PROVIDER=claude
export ANTHROPIC_API_KEY=sk-ant-...
isotc config set provider claude
isotc intent "ユーザーはメールでログインできる"
```

### Agent モード（LLM キーなし）

```bash
# モードのみ agent に設定（プロバイダー/モデルは任意）
isotc init
isotc config set mode agent

# LLM API キー不要で intent / plan を実行
isotc intent "ユーザーはメールでログインできる"
isotc plan --force

# 生成される主なファイル
# - .spec/requirements.json
# - .spec/tasks.json
# - .spec/agent/intent-prompt.md
# - .spec/agent/plan-prompt.md
#
# IDE 側のエージェント（Cursor など）から .spec/agent/*.md を開き、
# 指示に従って .spec/ 配下のファイルを編集させてください。
```

---

## 5. 環境チェック

`isotc doctor --format json` で LLM 関連の状態を確認できる。

```bash
isotc doctor --format json
```

**出力例**（抜粋）:

```json
{
  "status": "ok",
  "checks": {
    "constitution": true,
    "openApiKeySet": true,
    "geminiApiKeySet": false,
    "claudeApiKeySet": false,
    "llmProvider": "openai"
  }
}
```

---

## 6. トラブルシューティング

| 現象 | 原因 | 対処 |
|------|------|------|
| `OPENAI_API_KEY が設定されていません` | 環境変数未設定 | 該当プロバイダーの API キーを設定 |
| `不明な LLM プロバイダー` | 無効な `ISOTC_LLM_PROVIDER` | `openai` \| `gemini` \| `claude` のいずれかを指定 |
| `GEMINI_API_KEY または GOOGLE_API_KEY が...` | Gemini 利用時にキー未設定 | [Google AI Studio](https://aistudio.google.com/apikey) でキー取得 |
| `ANTHROPIC_API_KEY が...` | Claude 利用時にキー未設定 | [Anthropic Console](https://console.anthropic.com/) でキー取得 |
| config が反映されない | 環境変数が優先 | 環境変数を未設定にするか、意図した値に上書き |

---

## 7. セキュリティ

- **API キーは .spec/config.toml に保存しない**。環境変数のみで注入する。
- `.env` ファイルを使う場合は、`.gitignore` に含め、リポジトリにコミットしない。
- CI では Secrets として環境変数を設定する。
