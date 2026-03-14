# isotc-cli — Agent 向け指示（constitution から生成）

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

## 検証

実装後は `npx isotc-cli@latest verify --format json` で検証すること。
