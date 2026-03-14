# isotc-cli — GitHub Copilot 向け指示

## ビルド・テスト・検証の正解コマンド

- **ビルド**: `npm ci && npm run build`
- **テスト**: `npm test`
- **アーキテクチャ検証**: `npx isotc-cli@latest verify --format json`
- **環境チェック**: `node bin/isotc.js doctor --format json`

## 開発フロー

1. 依存関係インストール: `npm ci`
2. ビルド: `npm run build`
3. テスト実行: `npm test`
4. 検証実行: `npx isotc-cli@latest verify --format json`

検証は必ず `--format json` を指定すること。stdout に機械可読な JSON が出力される。

## ドキュメント

- コマンド仕様: [docs/2_REQUIREMENTS.md](docs/2_REQUIREMENTS.md)
- ドキュメント一覧: [docs/0_INDEX.md](docs/0_INDEX.md)
