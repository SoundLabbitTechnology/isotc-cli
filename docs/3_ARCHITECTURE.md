# isotc-cli 内部アーキテクチャ設計書

**参照**: [0_INDEX.md](./0_INDEX.md) | [1_PRD.md](./1_PRD.md) | [2_REQUIREMENTS.md](./2_REQUIREMENTS.md)

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
│   │   ├── commands/             # init, intent, plan, impl, handoff, verify, trace, emit, doctor
│   │   └── formatters/           # IOutputFormatter (JSON/Textの出し分け)
│   │
│   ├── application/             # ② ユースケース層
│   │   ├── usecases/             # verifyArchitecture, extractIntent, generatePlan, buildTrace, traceDiff, traceExplain
│   │   ├── prompts/              # LLM プロンプトテンプレート
│   │   └── services/             # intentOutputRenderer 等
│   │
│   ├── domain/                  # ③ ドメイン層（コアビジネスロジック）
│   │   ├── entities/
│   │   │   ├── constitution.ts   # 憲法（アーキテクチャルール）
│   │   │   ├── dependencyNode.ts # 依存関係の抽象モデル
│   │   │   ├── counterexample.ts # 反例（進化圧）
│   │   │   ├── requirements.ts  # 構造化要件 IR
│   │   │   ├── traceGraph.ts     # トレーサビリティグラフ
│   │   │   └── ...
│   │   └── services/
│   │       └── ruleValidator.ts  # 違反判定（import/re-export/パッケージ/循環依存）
│   │
│   └── infrastructure/          # ④ インフラストラクチャ層（アダプター）
│       ├── ports/
│       │   ├── iFileSystem.ts
│       │   ├── iAstParser.ts
│       │   ├── iLlmAdapter.ts
│       │   └── iSymbolExtractor.ts
│       └── adapters/
│           ├── localFileSystemAdapter.ts
│           ├── typeScriptAstAdapter.ts
│           ├── openAILlmAdapter.ts
│           └── typeScriptSymbolExtractor.ts
│
├── schemas/                     # JSON Schema（verify-result, requirements, tasks, trace）
├── resources/prompts/           # プロンプトテンプレート（Markdown）
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

---

## コマンドとレイヤー対応

| コマンド | Presentation | Application | Domain | Infrastructure |
|----------|---------------|-------------|--------|-----------------|
| init | initCommand | - | Constitution | LocalFileSystemAdapter |
| intent | intentCommand | ExtractIntentUseCase | Requirements | OpenAILlmAdapter, LocalFileSystemAdapter |
| plan | planCommand | GeneratePlanUseCase | Constitution, Requirements | OpenAILlmAdapter, LocalFileSystemAdapter |
| impl | implCommand | - | - | LocalFileSystemAdapter |
| handoff | handoffCommand | - | Constitution | LocalFileSystemAdapter |
| verify | verifyCommand | VerifyArchitectureUseCase | RuleValidator, Counterexample | TypeScriptAstAdapter |
| trace | traceCommand | BuildTraceUseCase, TraceDiffUseCase, TraceExplainUseCase | TraceGraph | LocalFileSystemAdapter, TypeScriptSymbolExtractor |
| emit | emitCommand | - | Constitution | LocalFileSystemAdapter |
| doctor | doctorCommand | - | - | LocalFileSystemAdapter |
