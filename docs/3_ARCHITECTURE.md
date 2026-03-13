# isotc-cli 内部アーキテクチャ設計書

**参照**: [1_PRD.md](./1_PRD.md) | [2_REQUIREMENTS.md](./2_REQUIREMENTS.md)

---

## ディレクトリ構造

```
isotc-cli/
├── package.json
├── tsconfig.json
├── bin/
│   └── isotc.js                 # 実行可能バイナリのエントリポイント
├── src/
│   ├── index.ts                 # CLIのセットアップ（Commander.js）
│   │
│   ├── presentation/            # ① CLI層（引数処理・出力制御）
│   │   ├── commands/             # verify, plan, init, intent, impl のコマンド定義
│   │   └── formatters/           # IOutputFormatter (JSON/Textの出し分け)
│   │
│   ├── application/             # ② ユースケース層
│   │   └── usecases/
│   │       └── verifyArchitectureUseCase.ts
│   │
│   ├── domain/                  # ③ ドメイン層（コアビジネスロジック）
│   │   ├── entities/
│   │   │   ├── constitution.ts   # 憲法（アーキテクチャルール）
│   │   │   ├── dependencyNode.ts # 依存関係の抽象モデル
│   │   │   └── counterexample.ts # 反例（進化圧）
│   │   └── services/
│   │       └── ruleValidator.ts  # 違反判定ロジック
│   │
│   └── infrastructure/          # ④ インフラストラクチャ層（アダプター）
│       ├── ports/                # ドメイン層が要求するインターフェース
│       │   ├── iFileSystem.ts
│       │   └── iAstParser.ts
│       └── adapters/             # 実際の実装
│           ├── localFileSystemAdapter.ts
│           └── typeScriptAstAdapter.ts
│
└── tests/                       # テストコード
```

---

## レイヤー責務

ヘキサゴナルアーキテクチャを採用し、検証ロジック（ドメイン層）を静的解析ツール（インフラ層）から隔離する。

| レイヤー | 責務 |
|----------|------|
| **Presentation** | コマンド入力（Commander.js）、標準出力/エラー制御、JSON/Textフォーマット |
| **Application** | 憲法の読み込みと検証ユースケースの実行 |
| **Domain** | RuleValidator（依存関係とルールの照合、反例生成）、Constitution/Counterexample エンティティ |
| **Infrastructure** | ts-morph を用いたAST解析（TypeScriptAstAdapter）、ローカルファイルシステム（LocalFileSystemAdapter） |
