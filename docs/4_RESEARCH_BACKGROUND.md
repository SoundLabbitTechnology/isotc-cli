# isotc-cli 研究背景

**バージョン:** 1.0  
**最終更新:** 2026-03-14

---

## 1. 文書の目的

本ドキュメントは、isotc-cli の設計思想を支える学術的・実証的裏付けを整理する。関連研究の知見に基づき、**強く支持される部分**と**方向性は正しいが研究はまだ薄い部分**を区別し、報告書の信頼性を高めることを目的とする。

---

## 2. 強く支持される点

### 2.1 AI支援開発の生産性効果は文脈依存

AI支援開発の生産性効果は一様ではなく、タスクと文脈に強く依存する。

- 初期の対照実験では Copilot 利用者が課題を 55.8% 速く完了
- 企業内 RCT では短縮効果は約 21% に縮小
- 成熟した OSS リポジトリを扱う 2025 年の RCT では、AI 利用でむしろ完了時間が 19% 増加

したがって、「AIで速くなる」は正しいとしても、そこから直ちに「AI中心に開発してよい」とは言えず、**速度と保守性のトレードオフ**は研究的にも妥当である。

**参考文献:** [The Impact of AI on Developer Productivity: Evidence from GitHub Copilot](https://arxiv.org/abs/2302.06590)

### 2.2 仕様主導・要件主導の方向性

仕様主導・要件主導の開発は、近年の研究で強く支持されている。

- **Progressive Prompting**: 高品質な要件を起点に、要件抽出→OO モデリング→テスト生成→コード生成へと段階的に進める手法。要件品質が後続成果物の品質を左右する。
- **TDD 風ワークフロー**: TOML で構造化した仕様からテストを生成し、人間がテストを洗練してからコード生成に進む。「コードを直接直すより、仕様とテストを洗練する」という SDD の実践形を表している。

**参考文献:** [Requirements are All You Need: From Requirements to Code with LLMs](https://arxiv.org/abs/2406.10101)

### 2.3 技術的負債・保守性

AI生成コードと技術的負債・保守性の議論は、isotc-cli の課題設定と整合する。

- **SATD 研究**: LLM リポジトリの Self-Admitted Technical Debt 発生率は ML リポジトリと近い。LLM 系には Model-Stack Workaround Debt、Model Dependency Debt、Performance Optimization Debt という新しい負債形態が見つかっている。
- **ISO/IEC 25010 に基づく QA 研究**: 学術研究はセキュリティや性能に寄りがちなのに対し、実務家は保守性と可読性を強く重視。両者にミスマッチがあると結論づけている。

「AI生成コードは非機能品質、とくに保守性で負債を生みやすい」という主張は、これらの研究で十分に支えられる。

**参考文献:**
- [Self-Admitted Technical Debt in LLM Software: An Empirical Comparison with ML and Non-ML Software](https://arxiv.org/abs/2601.06266)
- [Quality Assurance of LLM-generated Code: Addressing Non-Functional Quality Characteristics](https://arxiv.org/abs/2511.10271)

### 2.4 トレーサビリティ、コンプライアンス、形式的検証

- **Graph-RAG**: ベースライン RAG や単純プロンプトより、より正確で文脈依存な要件トレーサビリティ結果が得られた。
- **形式的検証**: LLM が Dafny・Nagini・Verus のような検証系言語で verified code を生成できる可能性が示されている。Dafny では自然言語仕様とテストオラクルから注釈を生成し、generate–check–repair–minimize のループで機械検証する流れが提案されている。

**参考文献:** [Leveraging Graph-RAG and Prompt Engineering to Enhance LLM-Based Automated Requirement Traceability and Compliance Checks](https://arxiv.org/abs/2412.08593)

---

## 3. 方向性は正しいが研究は薄い点

### 3.1 ソフトウェアアーキテクチャ

2025 年の体系的レビューでは、LLM は設計決定分類、デザインパターン検出、要件からのアーキテクチャ設計生成などに使われている一方、**アーキテクチャからソースコード生成**や**アーキテクチャ適合性チェック**はまだ十分に研究されていない。

個別研究でも、LLM は ADR 生成やサーバレスの小さなアーキテクチャ部品生成には使えるが、自律的に人間同等の設計判断を下す段階にはない、という結論である。

したがって、「AI時代はモジュラーモノリスが主流になる」とまで断定するより、**「AI が扱えるコンテキスト境界を保つ設計が有利だという仮説が強まっている」**くらいに抑えるのが学術的には堅い。

**参考文献:** [Software Architecture Meets LLMs: A Systematic Literature Review](https://arxiv.org/abs/2505.16697)

### 3.2 人間とAIの協働

モブプログラミングそのものの厳密な実証より、いまは**AI 介在でレビューや協働の認知的・運用的性質が変わる**ことの方が強く支持されている。

- AI支援コードレビューのインタビュー研究: LLM 相手だと感情的摩擦は減る一方、詳細すぎる指摘で認知負荷が上がり、採用は信頼と文脈不足に制約される。
- AI pair programming の大規模実務データ: 実務上の主問題は operation issue と compatibility issue。

**「AIはチーム協働を代替する」のではなく、「レビュー・仕様策定・文脈共有のやり方を変える」**として整理するのが妥当である。

**参考文献:** [Human and Machine: How Software Engineers Perceive and Engage with AI-Assisted Code Reviews Compared to Their Peers](https://arxiv.org/abs/2501.02092)

---

## 4. 用語に関する注記

### 4.1 Vibe-coding

「Vibe-coding」は実務・コミュニティ由来の表現として広がっているが、安定した学術概念として定着しているわけではない。本ドキュメントでは初出時に括弧付きで紹介したうえで、以後は **ad-hoc prompt-based development** や **non-specification-driven code generation** のような中立表現を用いる。

### 4.2 生成的負債（Generative Debt）

「構造的負債・幻覚的複雑性・省略的負債」といった三分類は、非常にわかりやすい整理であるが、広く確立した分類としてはまだ弱い。本報告書では **「本報告書で用いる分析上の分類」** として提示する。

---

## 5. 推奨結論

関連研究を統合すると、isotc-cli の方向性は次の形に整理できる。

> **AI駆動開発の本質的な転換点は、コード生成能力そのものではなく、仕様・テスト・アーキテクチャ境界を先に固定し、それを品質保証とトレーサビリティで閉じる開発様式への移行である。AIはその移行を加速するが、仕様と設計の規律を置き換えるわけではない。**

isotc-cli は、この移行を支援するツールとして位置づけられる。

---

## 6. 参考文献一覧

| # | タイトル | URL |
|---|----------|-----|
| 1 | Quality Assurance of LLM-generated Code: Addressing Non-Functional Quality Characteristics | https://arxiv.org/abs/2511.10271 |
| 2 | The Impact of AI on Developer Productivity: Evidence from GitHub Copilot | https://arxiv.org/abs/2302.06590 |
| 3 | Requirements are All You Need: From Requirements to Code with LLMs | https://arxiv.org/abs/2406.10101 |
| 4 | Self-Admitted Technical Debt in LLM Software: An Empirical Comparison with ML and Non-ML Software | https://arxiv.org/abs/2601.06266 |
| 5 | Leveraging Graph-RAG and Prompt Engineering to Enhance LLM-Based Automated Requirement Traceability and Compliance Checks | https://arxiv.org/abs/2412.08593 |
| 6 | Software Architecture Meets LLMs: A Systematic Literature Review | https://arxiv.org/abs/2505.16697 |
| 7 | Human and Machine: How Software Engineers Perceive and Engage with AI-Assisted Code Reviews Compared to Their Peers | https://arxiv.org/abs/2501.02092 |
| 8 | Quality Evaluation of COBOL to Java Code Transformation | https://arxiv.org/html/2507.23356v1 |
