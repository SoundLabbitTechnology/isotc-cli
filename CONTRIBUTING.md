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

## ライセンス

貢献いただいたコードは、本プロジェクトの [MIT License](LICENSE) の下で公開されます。貢献により、そのコードを MIT ライセンスで提供することに同意したものとみなします。
