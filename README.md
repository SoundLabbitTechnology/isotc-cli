# isotc-cli

**Intent-to-Spec Optimal Transport Compiler CLI** — AI駆動開発における意図保護と生成的負債防止

AIエージェントによる「Vibe-coding」が引き起こすアーキテクチャ破壊を防ぎ、憲法（Constitution）に基づいた検証と自己修復を実現するCLIツールです。

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
| `impl` | AIエージェントへの実装委譲（未実装） |
| `verify` | アーキテクチャ検証と反例（進化圧）の出力 |

## 憲法（Constitution）

`.spec/constitution.toml` でレイヤーと依存ルールを定義します。

```toml
[[layers]]
name = "domain"
basePath = "src/domain/**"

[rules]
domain = []
application = ["domain"]
infrastructure = ["domain", "application"]
```

## ドキュメント

- [PRD](docs/1_PRD.md) - プロダクト要求仕様書
- [要求仕様書](docs/2_REQUIREMENTS.md) - コマンド契約・I/O仕様
- [アーキテクチャ設計](docs/3_ARCHITECTURE.md) - 内部構成

## 開発

```bash
npm install
npm run build
npm test
```

## License

MIT
