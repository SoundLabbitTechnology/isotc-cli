# isotc-cli の理論的系譜 — 「意図」研究40年史における位置づけ

**バージョン:** 1.0
**最終更新:** 2026-07-07

---

## 1. 文書の目的

[4_RESEARCH_BACKGROUND.md](4_RESEARCH_BACKGROUND.md) が「isotc-cli は現在の LLM 実証研究とどう整合するか」を扱うのに対し、本ドキュメントは異なる軸を扱う。すなわち、**「意図（Intent）」を計算対象にするという発想自体が、ICT・システム開発の学術史の中でどこに位置するか**である。

isotc-cli が前提とする Core / Phase / Moment の三層構造、`verify` による意図逸脱検知、`trace` によるトレーサビリティは、いずれもゼロから発明されたものではない。要求工学（Requirements Engineering）とエージェント指向開発には、40年にわたって「意図をどう明示化し、どう保存するか」を扱ってきた系譜がある。isotc-cli は、この系譜の LLM 時代における実装として位置づけられる。

本ドキュメントは、この系譜を整理し、isotc-cli の各コマンド・概念がどの先行研究の延長線上にあるかを示す。

---

## 2. 系譜の全体像

ICT・システム開発における「意図」研究は、おおよそ次の5段階を経て発展してきた。

| 段階 | 時期 | 意図の扱われ方 |
|------|------|---------------|
| 1. 暗黙的・曖昧な意図 | 1980年代 | ユーザーの頭の中にあり、対話やヒアリングで部分的に翻訳される |
| 2. 明示化・構造化された意図 | 1990年代 | ゴール・依存関係・計画として要求モデルに表現される |
| 3. 実行・利用に結びつく意図 | 1990〜2000年代 | エージェントでは計画へのコミットメント、要求工学では追跡可能なゴール階層 |
| 4. データから推定される意図 | 2010年代 | 行動ログ・プロセスマイニングから継続的・動的に推定される |
| 5. 人間とAIの意図整合 | 2020年代〜 | 人間・AI・組織が互いの意図を理解し、境界を保ちながら協働する |

isotc-cli は、この歴史の中で**第2〜3段階の到達点（ゴール指向要求工学・BDIエージェント）を、第5段階の課題（人間とAIの意図整合）に対して LLM 時代の道具立てで再実装したもの**である。

---

## 3. 系譜① ゴール指向要求工学（GORE）— `intent` / `plan` / `trace` の起源

### 3.1 核心となる主張

要求工学は1990年代、「システムが何をするか（What）」だけでなく「なぜそれが必要か（Why）」から要求を導出すべきだという転換を経験した。これがゴール指向要求工学（Goal-Oriented Requirements Engineering, GORE）である。

- Dardenne, Van Lamsweerde & Fickas (1993) は、要求をゴール・エージェント・実体・イベントから獲得する枠組みを提示し、意図を要求モデルの一級概念に格上げした。
- Yu (1997) の i\* フレームワークは、要求の初期段階でステークホルダーの関心・依存関係・目的をアクター間の構造として表現する手法を確立した。
- Van Lamsweerde (2001) は GORE を体系化し、ゴールが要求の獲得・精緻化・仕様化・変更管理のすべての段階を貫く中心概念であることを示した。
- Van Lamsweerde & Letier の障害分析（obstacle analysis）は、ゴールが「どう失敗しうるか」を体系的に列挙することで仕様を鍛える手法であり、**要求工学内部における失敗駆動設計の先行例**である。

### 3.2 isotc-cli との対応

| GORE の概念 | isotc-cli での実装 |
|---|---|
| ゴール階層（Why→What の導出） | `intent` コマンド：自然言語要件からゴール構造を抽出 |
| ゴール精緻化（KAOS） | `plan` コマンド：ゴールをタスク・設計へ分解 |
| 障害分析（obstacle analysis） | `verify` コマンド：ゴール逸脱・制約違反の検出 |
| 要求トレーサビリティ | `trace` コマンド：意図→仕様→実装の追跡グラフ |
| ステークホルダー意図の構造化 | `constitution.toml`：Core Intent の機械可読化 |

isotc-cli は、この意味で **「LLM 時代の GORE ツールチェーン」** として位置づけられる。人間が手作業で行っていたゴール分解・障害分析・トレーサビリティ維持を、LLM を用いて半自動化したものである。

### 3.3 Tropos — 開発ライフサイクル全体への意図の一貫適用

Bresciani, Perini, Giorgini, Giunchiglia & Mylopoulos (2004) の Tropos は、要求分析の初期段階から実装段階まで、アクター・ゴール・計画・依存関係という意図的概念を一貫して用いるエージェント指向ソフトウェア開発方法論である。

isotc-cli の `emit`（copilot / claude / agents 向け出力）と `agents.md` の生成は、Tropos が目指した「意図的概念をライフサイクル全体で一貫させる」という思想を、人間の開発者ではなく **LLM エージェントへの指示書生成**という形で継承している。

---

## 4. 系譜② BDI エージェントモデル — Volatility と マイクロ/マクロループの起源

### 4.1 核心となる主張

エージェント指向開発では、Rao & Georgeff (1995) の BDI（Belief-Desire-Intention）モデルが、合理的エージェントの行動を Belief（信念）・Desire（欲求）・Intention（意図）の3つの心的態度でモデル化した。ここでの Intention は単なる願望ではなく、**実際に遂行することにコミットした計画**である。

BDI 研究には古くから **intention reconsideration（意図再考）問題** がある。エージェントは、コミットした意図をどの頻度で再検討すべきか。頻繁に再考しすぎれば一貫性を失い（優柔不断）、まったく再考しなければ状況変化に対応できない（頑迷）。Kinny & Georgeff の bold / cautious エージェントの研究は、この再考頻度をエージェントの性質としてモデル化した。

### 4.2 isotc-cli との対応

| BDI の概念 | isotc-cli / AI-DASH 理論での対応 |
|---|---|
| Intention（計画へのコミットメント） | Core Intent（`constitution.toml` に固定） |
| 条件付き再考ポリシー | Phase Intent（ゲート判定で見直し） |
| 手段レベルの再計画 | Moment Intent（自由に変更可能） |
| 熟慮（deliberation） | マクロループ：人間がCore/Phaseの見直しを判断 |
| 手段目的推論（means-ends reasoning） | マイクロループ：AIが実行レベルの最適化を担当 |

Volatility（変化率）による層別重み付けは、**intention reconsideration 問題に対する運用可能な数理的解**として位置づけられる。「どの層をどの頻度で再考してよいか」という30年来の問いに、変化率という測定可能な軸を与えたものである。

### 4.3 AgentSpeak — 理論と実装のギャップを埋める先行例

Rao (1996) の AgentSpeak(L) は、BDI の理論的論理と実際のエージェントプログラムの間にあったギャップを埋めるため、意図を実行可能な計画選択単位として扱えるプログラミング言語を提案した。isotc-cli が「意図の三層構造という理論」を `constitution.toml` という機械可読・実行可能な形式に落とし込んでいることは、AgentSpeak が果たした役割（理論の実装可能化）と同じ機能を担っている。

---

## 5. isotc-cli が答えるべき問い — GORE との違い

GORE を知る読者であれば当然の疑問として、「意図消失（Intent Loss）は、要求工学が既に扱ってきたゴールドリフト・トレーサビリティ喪失と何が違うのか」がある。

isotc-cli の立場は次の通りである。

- 従来の GORE が扱ってきたのは「**要求が変わる**」問題である。人間が要求文書を書き換えるため、変化はゆっくりで、差分は目視・レビューで検査可能だった。
- LLM 時代の Intent Loss は、「**要求文書は変わっていないのに、生成変換の内側で意図が失われる**」問題である。LLM による生成は高速・大量・不透明な損失性変換であり、失敗は要求文書のバージョン間ではなく、単一の変換プロセスの内部で起きる。

これが、isotc-cli が `verify` をワンショットのレビューではなく **ループの中に埋め込まれた継続検査**として設計し、終了コード2による自己修復ループと接続している理由である。GORE の障害分析は人間が精緻化のたびに行う前提だったが、isotc-cli はこれを LLM 生成の各ステップに対して自動実行する。

---

## 6. constitution.toml の位置づけ — Agentic AI 時代への応答

Haidemariam (2025) は、Agentic AI の登場を「外部から与えられた目的を最適化するシステム」から「自らゴールを表現・評価・更新するシステム」への転換として論じている。AI エージェントが自律的に計画を立て、実行し、必要に応じて目的そのものを見直す時代において、`constitution.toml` は次の役割を果たす。

> **人間の意図とエージェントの自律性の境界物（boundary artifact）**

`constitution.toml` は、「Moment は自由に変えてよいが、Core には触れさせない」という有界なゴール更新を機械可読な形で強制する。これは、自らゴールを更新しうる Agentic AI に対して、更新してよい範囲といけない範囲を事前に宣言する仕組みであり、Agentic AI 時代の中心課題（AIの自律性と人間の意図保持の両立）への直接的な応答として位置づけられる。

---

## 7. 意図しない混同を避けるための注記 — 「意図」の多義性

ICT 研究における「意図」には、少なくとも4つの異なる意味がある。isotc-cli が扱うのは①・②であり、③・④とは区別する必要がある。

| # | 意図の種類 | 代表的研究領域 | isotc-cli との関係 |
|---|-----------|---------------|-------------------|
| ① | 設計意図（ゴール） | GORE, i\*, KAOS | `intent` / `plan` / `trace` が直接対応 |
| ② | 実行意図（コミットメント） | BDI, AgentSpeak, Tropos | Core/Phase/Moment 構造と Volatility が対応 |
| ③ | 利用意図（behavioral intention） | TAM, UTAUT | 対象外。ユーザーが「使うつもりがあるか」を測る心理学的構成概念であり、設計意図とは別物 |
| ④ | 推定意図（ユーザーモデリング） | 適応型システム、意図マイニング | 部分的に関連（§8 参照）だが、isotc-cli の核心は推定ではなく外在化・保存 |

③（利用意図）を isotc-cli の Intent と混同しないこと。isotc-cli が保存するのは「何を作ろうとしたか」という設計側の意図であり、「ユーザーが使い続けたいと思うか」という受容側の意図ではない。

---

## 8. Future Work — 意図マイニングとの接続

Khodabandelou, Hug, Deneckère & Salinesi (2013) は、Hidden Markov Models を用いてユーザー活動ログの背後にある意図を推定する「意図マイニング（intentional process mining）」を提案した。これは意図が明示的に記述されるものから、行動データから推定されるものへ移行した研究である。

isotc-cli の `trace` コマンドが蓄積するログは、将来的にこの意図マイニングの手法と接続できる可能性がある。すなわち、Volatility を人間が宣言する値としてではなく、`trace` ログから実測される値として算出する拡張である。これが実現すれば、「この層は本当にこの変化率で運用されているか」を事後的に検証できるようになり、Volatility は理論上の宣言値から実証可能な測定値へ格上げされる。これは isotc-cli のロードマップにおける中長期的な検討候補である。

---

## 9. まとめ

isotc-cli は、次の2つの学術的系譜の交点に位置する。

1. **ゴール指向要求工学（GORE / i\* / KAOS / Tropos）** — 「なぜ」から要求を導出し、トレーサビリティを維持する伝統。`intent` / `plan` / `verify` / `trace` / `emit` の各コマンドは、この系譜の各段階に対応する。
2. **BDI エージェントモデル** — 意図をコミットメントとしてモデル化し、その再考ポリシーを扱う伝統。Core / Phase / Moment の三層構造と Volatility は、intention reconsideration 問題への運用可能な解として位置づけられる。

isotc-cli は、これらの理論を置き換えるものではなく、**LLM による高速・不透明な生成変換という新しい環境に対して、40年分の意図研究の知見を再実装したツール**である。

---

## 10. 参考文献

| # | 著者 (年) | タイトル |
|---|----------|---------|
| 1 | Dardenne, Van Lamsweerde & Fickas (1993) | Goal-Directed Requirements Acquisition |
| 2 | Yu (1997) | Towards Modelling and Reasoning Support for Early-Phase Requirements Engineering |
| 3 | Van Lamsweerde (2001) | Goal-Oriented Requirements Engineering: A Guided Tour |
| 4 | Van Lamsweerde (2003) | From System Goals to Software Architecture |
| 5 | Rao & Georgeff (1995) | BDI Agents: From Theory to Practice |
| 6 | Rao (1996) | AgentSpeak(L): BDI Agents Speak Out in a Logical Computable Language |
| 7 | Bresciani, Perini, Giorgini, Giunchiglia & Mylopoulos (2004) | Tropos: An Agent-Oriented Software Development Methodology |
| 8 | Chopra, Mylopoulos, Dalpiaz, Giorgini et al. (2010) | Requirements as Goals and Commitments Too |
| 9 | Dalpiaz, Giorgini & Mylopoulos (2013) | Adaptive Socio-Technical Systems: A Requirements-Based Approach |
| 10 | Khodabandelou, Hug, Deneckère & Salinesi (2013) | Supervised Intentional Process Models Discovery Using Hidden Markov Models |
| 11 | Haidemariam (2025) | From the Logic of Coordination to Goal-Directed Reasoning: The Agentic Turn in Artificial Intelligence |

---

## 11. 用いなかった系譜と、その理由

- **KAOS の形式手法的側面（時相論理による厳密なゴール仕様）**: isotc-cli / AI-DASH は「Markdown 仕様書」という軽量路線を核心的な設計判断としている。継承するのは原理（ゴール→仕様のトレーサビリティ）であって、形式手法の重い機構ではない。形式手法が高コストゆえに普及しなかった領域を、LLM による軽量な準形式仕様で置き換えるという賭けが isotc-cli の差別化点であり、ここは明確に一線を画す。
- **TAM / UTAUT（利用意図・技術受容モデル）**: §7 の通り、対象領域が異なるため理論的系譜には含めない。ただし e-Learning の受講継続設計など、事業側の KPI 設計には応用の余地があり、その場合は isotc-cli とは別の文脈で参照されるべきものである。
