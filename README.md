# isotc-cli

**Intent-to-Spec Optimal Transport Compiler CLI** — 仕様・テスト・アーキテクチャ境界を先に固定し、品質保証とトレーサビリティで閉じる開発様式を支援

AI駆動開発の本質的な転換点は、コード生成能力そのものではなく、仕様・テスト・アーキテクチャ境界を先に固定し、それを品質保証とトレーサビリティで閉じる開発様式への移行である。isotc-cli は、AIエージェントによる ad-hoc prompt-based development（Vibe-coding とも呼ばれる、仕様に基づかないコード生成）が引き起こすアーキテクチャ破壊を防ぎ、憲法（Constitution）に基づいた検証と自己修復を実現するCLIツールです。

## インストール

```bash
# クローン
git clone https://github.com/SoundLabbitTechnology/isotc-cli.git
cd isotc-cli

# ビルド
npm install && npm run build

# グローバルにインストール（任意）
npm link
```

## 使い方

### 1. プロジェクトの初期化

```bash
isotc init
# → .spec/constitution.toml が生成される
```

### 2. アーキテクチャ検証

```bash
# 人間向けテキスト出力
isotc verify

# CI / AI連携用 JSON 出力
isotc verify --format json
```

**終了コード**: `0` = 成功 / `2` = 違反あり（AIの自己修復ループに利用）

### 3. CI での利用（GitHub Actions）

```yaml
- run: npm ci && npm run build
- run: isotc init --force
- run: isotc verify
```

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `init` | 憲法ファイル（.spec/constitution.toml）の生成 |
| `intent` | 自然言語要件から構造化要件の生成（未実装） |
| `plan` | 技術設計とタスク分解（未実装） |
| `impl` | AIエージェントへの実装委譲（`--isolated-prompt` で隔離プロンプト生成） |
| `verify` | アーキテクチャ検証と反例（進化圧）の出力 |

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

[steering]
codingStandards = "ESLint + Prettier を推奨"
technologyStack = "TypeScript, Node.js 18+"
designPrinciples = "ヘキサゴナルアーキテクチャを厳守"
```

## ドキュメント

- [PRD](docs/1_PRD.md) - プロダクト要求仕様書
- [要求仕様書](docs/2_REQUIREMENTS.md) - コマンド契約・I/O仕様
- [アーキテクチャ設計](docs/3_ARCHITECTURE.md) - 内部構成
- [研究背景](docs/4_RESEARCH_BACKGROUND.md) - 学術的裏付けと参考文献

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

- [CONTRIBUTING.md](CONTRIBUTING.md) - 貢献ガイドライン
- [SECURITY.md](SECURITY.md) - 脆弱性報告について
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) - 行動規範
