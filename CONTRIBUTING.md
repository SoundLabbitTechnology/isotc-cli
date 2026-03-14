# Contributing to isotc-cli

Sound Labbit Technology Inc. のラボ活動として開発している isotc-cli へようこそ。貢献に感謝します。

## 行動規範

本プロジェクトは [Contributor Covenant](CODE_OF_CONDUCT.md) に従います。参加にあたり、その内容に同意することを求めます。

## 貢献の方法

### バグ報告・機能要望

- [GitHub Issues](https://github.com/SoundLabbitTechnology/isotc-cli/issues) で報告してください
- 既存の Issue に類似がないか確認してから作成してください
- バグ報告には再現手順、環境情報を含めてください

### プルリクエスト

1. リポジトリをフォークし、ブランチを作成してください
2. 変更を加え、テストを実行してください (`npm test`)
3. アーキテクチャ検証を実行してください (`npm run build && node bin/isotc.js verify`)
4. プルリクエストを作成し、変更内容を説明してください

### 開発環境

```bash
git clone https://github.com/SoundLabbitTechnology/isotc-cli.git
cd isotc-cli
npm install
npm run build
npm test
```

### コーディング規約

- TypeScript の厳格モードに従う
- ヘキサゴナルアーキテクチャのレイヤー分離を維持する
- 新規機能にはテストを追加する

## 互換性ポリシー

- **バージョニング**: [Semantic Versioning](https://semver.org/spec/v2.0.0.html) (SemVer) に従う。
- **メジャーバージョン (v1.0.x → v2.0.0)**: 破壊的変更を伴う。CLI コマンドの削除・引数の変更、JSON 出力スキーマの非互換変更、終了コードの変更など。
- **マイナーバージョン (v0.1.x → v0.2.0)**: 後方互換の機能追加。既存のコマンド・オプション・JSON スキーマは維持する。
- **パッチバージョン (v0.1.0 → v0.1.1)**: バグ修正のみ。挙動は変更しない。
- **JSON スキーマ**: `schemas/*.schema.json` の `$id` でバージョン管理。破壊的変更時は新スキーマを追加し、旧スキーマは非推奨とする。

## 破壊的変更ポリシー

破壊的変更を行う場合は、以下の手順を踏む。

1. **Issue で事前に告知**: 破壊的変更の内容と理由を Issue で説明する。
2. **CHANGELOG に明記**: 該当バージョンの `[BREAKING]` セクションに変更内容を記載する。
3. **マイグレーションガイド**: 可能であれば移行手順を README またはドキュメントに追記する。

## ライセンス

貢献いただいたコードは、本プロジェクトの [MIT License](LICENSE) の下で公開されます。貢献により、そのコードを MIT ライセンスで提供することに同意したものとみなします。
