# isotc-cli — Claude Code 向け指示（constitution から生成）

## アーキテクチャ規約（憲法）

### レイヤー
- domain: `src/domain/**`
- application: `src/application/**`
- infrastructure: `src/infrastructure/**`
- presentation: `src/presentation/**`

### 依存ルール
- domain: なし に依存可
- application: domain に依存可
- infrastructure: domain, application に依存可
- presentation: domain, application, infrastructure に依存可

### Agent Steering
- codingStandards: ESLint + Prettier を推奨。型定義は厳格に。
- technologyStack: TypeScript, Node.js 18+
- designPrinciples: ヘキサゴナルアーキテクチャを厳守。依存性は内側に向ける。

## 厳守事項

- 内側のレイヤーは外側のレイヤーを直接 import できません。依存性注入を用い、interface を内側のレイヤーに定義してください。
- 実装後は必ず `npx isotc-cli@latest verify --format json` で検証すること。

## 検証コマンド

- アーキテクチャ検証: `npx isotc-cli@latest verify --format json`
- CI / 実装後は必ず `--format json` を指定すること。
