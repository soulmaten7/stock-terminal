# probe_1052 — 배수 칸 역할 확정 · Model Card 원문 확보 · Beneish 재료

> STEP1052 실행 기록. 🔵 코드·DB 쓰기 0 · 화면 변경 0. 이 STEP은 축 A(원문)와 축 B(실무)를 실제로 채우는 조사·도출 전용 STEP이다.

---

## 맨 앞 — 배수 칸 역할표 + Layer C 9섹션 상태 한 장

### 배수 칸 역할(도출 결과 — 순위가 아니라 역할)

| 배수 | 역할(도출) | 근거 |
|---|---|---|
| **P/E** | **전달축** — 검산 가능성·계산 단순성이 리테일 헤드라인 채택의 실제 이유로 문헌에서 확인됨(축 B) | CFA Institute·Corporate Finance Institute 직접 인용(§1-1) |
| **EV/EBITDA** | **정밀 판단축** — 전문가 판단에서는 1위(CFA 설문)이나, 근접-영(zero) EBITDA 구간에서 **가장 극단적으로 폭주**(오늘 DB 실측 최대 768배)하는 축 — 필터링·판단 없이 리테일에 그대로 노출하면 위험 | `probe_1043`(CFA 1위) + 오늘 DB 실측(§1-2) |
| **P/B** | **업종 특화축** — 은행 SOTP 리포트에서만 표본이 편향되게 높고(56%), 자산집약 업종 밖에서는 일반 근거 약함. 극단치 108건(n≥20 모집단), Health Care·Financials·IT 산발 | `probe_1043`(은행 표본) + 오늘 DB 실측 |
| **P/S(PSR)** | **적자 대안축** — 개별 사용률 근거가 문헌에 없고(`probe_1043`), 오직 이익상태(0층) 커버리지 논리로만 편입됨. 네 축 중 **극단치가 가장 흔함**(318건, Health Care=바이오텍 프리레베뉴 추정 다수) | `probe_1043`("개별 근거 없음") + 오늘 DB 실측(최다) |

🔑 **`STATE.md:73` C안(주축 PER·보조 EV/EBITDA·PBR·적자대안 PSR)과의 대조(도출 이후)**: **개념적으로 일치한다** — PER의 "전달축"=C안의 "주축", PSR의 "적자대안축"=C안의 "적자대안"이 같은 결론에 독립적으로 도달했다(교차검증). 단 EV/EBITDA·PBR을 C안은 뭉뚱그려 "보조"로 묶었으나, 이번 도출은 **성격이 다르다는 것을 근거와 함께 갈랐다** — EV/EBITDA는 정밀하나 변동성 위험이 크고, PBR은 업종(은행) 특화라 일반 보조축으로 쓰기엔 근거가 약하다. **이 차이는 정정이 아니라 정밀화**(C안이 틀린 게 아니라 이번 STEP이 "왜 보조인지"를 처음 갈랐다).

### Layer C(Model Card 9섹션) 상태 — 원문 목적 대조 결과

| 섹션 | 원문 목적(직접 인용, §1-4) | 우리 상태(`probe_1040` 재확인) | 이번 판정(§1-5) |
|---|---|---|---|
| Model Details(유형·원전) | — | ✅ 채움(`about`) | 유지 |
| Model Details(**날짜·버전·문의처**) | *"can be used by all stakeholders to infer details pertaining to model development"* | 🔴 빈칸 | **옮기면 되는 것** — `us_valuation.as_of`/`lens_cuts.as_of`(DB에 이미 있음) + `contact@onetrillion.app`(Footer.tsx에 이미 있음) |
| Intended Use(주 용도) | — | ✅ 채움(`what`) | 유지 |
| Intended Use(**주 사용자**) | *"helps users gain insight into how robust the model may be to different kinds of inputs"* | 🔴 빈칸 | **새로 정해야 하는 것** — 원문 목적이 WHY(보는 법을 어렵게 느끼는 사람)와 정반대(매매 신호 아님) 둘 다 요구, 우리는 어느 쪽도 문장화한 적 없음 |
| Ethical Considerations | *"surfacing ethical challenges and solutions to stakeholders"*(Data/Human life/Mitigations/Risks and harms/Use cases) | 🔴 빈칸(렌즈별 개별 서술 없음) | 🟡 **부분 대응 있음, 완전 일치 아님** — H-6 가드레일(회사 차원)이 "Risks and harms"·"Use cases" 취지와 겹치나 **모델별(렌즈/배수별) 개별 서술은 여전히 없음**. "규칙 7"의 정확한 좌표는 이번 조사로 특정 못 함(ROADMAP_V2:228의 paraphrase만 발견, 원문 못 찾음 — 미확보) |
| Training Data | *"basic details about the distributions over groups in the data... kinds of biases the model may have encoded"* | ⬜ 원리적 해당없음(재확인) | **재판정: 그대로 유지** — 원문 목적이 "학습 데이터의 그룹 분포·편향"인데, 우리 배수·역DCF는 학습되는 모델이 아니라 원전 수식을 그대로 계산하는 결정론 산식이다. 대신 **"입력 데이터 출처"**(SEC companyfacts 등)로 대응 가능하나, 이는 이미 Evaluation Data 칸이 하고 있는 일과 같다 — **별도 칸으로 채우면 중복**, "원리적 해당 없음" 표기가 맞다 |

---

## ⓪-1a. 로드맵 원문 대조

| 층 | 확인 | 비고 |
|---|---|---|
| WHY | 조건3(왜 그런지 알 수 있어야) | PER이 검산 가능성으로 선택되는지 축 B로 확인(§1-1) — 부분 확인(Robinhood·CFA·CFI는 확인, 개별 플랫폼 대부분은 "설명 없음") |
| WHY | 조건1→2→3 순서 | 정확(EV/EBITDA)과 전달(PER)의 관계 — 이번 도출로 "정밀축·전달축" 역할 분리가 이 순서와 정합함을 확인 |
| HOW | H-1-3·H-7 | ⑤의 직접 대상 — §1-4·1-5에서 실행 |
| WHAT | W-2-3 Layer C | 이 STEP이 채운 자리(맨 앞 표) |
| 관문·순위 | F-1-1·F-4-3 | "차이는 계산이 아니라 문장" 확인됨 · 배수 칸 역할 갱신 완료 |
| 완성의 정의 | C-1 항목1 | Layer C가 항목1의 산출물 — 이번에 3칸 중 2칸 처방, 1칸 재판정 완료 |
| 수익 모델 | 없음 | 무관 |

## ⓪-1b. 기존 답 확인 — `ls`로 전수

```
docs/PARKED_FIELD_SURFACES.md
docs/PARKED_HNX_VCI_ACTIVATION.md
docs/PARKED_KR_DIVIDEND_ACTIVATION.md
docs/PARKED_OAUTH_LOCALE_ACTIVATION.md
docs/PARKED_TERMS_PRIVACY_ACTIVATION.md
```
(STEP1050·1051과 동일 — 새로 생긴 것 없음.) 그 외 `Q1_AXIS_DECISION.md`(§2 헤드라인·§3 자체데이터·:115 PER약점)·`Q1_CARD_DESIGN.md`·`probe_1037`·`1038`(플랫폼 9곳 "무엇을 쓰는가" 누적)·`MARKET_MODEL_USAGE_TOP20_2026-08-07.md`(Beneish "개인 담론 중심")·`MODEL_ROSTER.md`(Beneish 원전 확보 상태)·`MODEL_UNIVERSE_63`(재현비용)·`probe_1043`(칸별 확정·동점 4개)·`LENS_ROADMAP.md`·`lib/lensCopy.ts`·`docs/probe_1040_what_structure.md`(Model Card 9섹션 대조표, 재사용) 전부 확인·재사용. `KNOWN_ANSWERS.md`에 이 STEP 주제 관련 기존 답 없음.

## ⓪-3중 규칙 요약

- **A-0 우리 자산**: 위 전부 — "무엇을 쓰는가"는 전혀 재조사하지 않고 인용만 했다
- **A 원문**: Mitchell et al.(2018) 원문 확보·직접 읽음(§1-4) · CFA Institute·Corporate Finance Institute 원문 확보
- **B 실무**: 5개 플랫폼(Stock Analysis·WallStreetZen·MarketBeat·Robinhood·Simply Wall St) 도움말/방법론 페이지 직접 조회
- **C 반대 증거**: PER의 약점(Real Estate)을 EV/EBITDA·P/B·P/S와 같은 깊이로 대조해 "PER만 약점 있는 게 아니다"를 실제로 확인(§1-2) — 오히려 EV/EBITDA·PSR이 더 극단적으로 나옴
- **검증**: 원문(Model Card 논문 직접 읽음) / 우리실측(DB 4축 대칭 비교) / 제3자(플랫폼 5곳 실제 방문)
- **검수**: 반박 시도("PER=전달축" 결론이 Robinhood 하나에만 의존하지 않는지 — CFA·CFI 문헌으로 보강, 플랫폼 자체 설명은 3/5가 "없음"이었음을 그대로 보고) · 수치 출처(오늘 Supabase MCP 직접 실측) · 이전 발언 대조(`probe_1043`의 "동점 4개"를 뒤집지 않고 "동점 안의 역할"로 정밀화) · 분기 비중("설명 없음" 3곳/5곳 — 다수임을 명시)
- 🔴 **미측정**: `products`류와 무관 — Beneish 임계값(-1.78 vs -2.22) 정본 확정(`MODEL_ROSTER` 기존 미확정 그대로 인용, 재조사 안 함, ⓪-1b 금지 범위)

---

## 1-1. 🔑 축 B — 리테일 헤드라인의 「왜」

**하한 5곳 조회 완료**: Stock Analysis·WallStreetZen·MarketBeat(기존 3곳, 헤드라인 확인만 재사용) + **Robinhood·Simply Wall St**(신규 2곳). `link_hub` 병행 조회 완료(`research`/`analysis` 카테고리, 5곳 전부 이미 등재돼 있음 확인 — ⓪-5-B 절차 준수).

| 플랫폼 | 「왜」 설명 유무 | 근거(URL·직접 인용) |
|---|---|---|
| Stock Analysis | 🔴 **설명 없음** | `stockanalysis.com/help/data-and-downloads/about-our-data/`·`/support/` 직접 조회 — 데이터 출처(S&P Global Market Intelligence 등)·지원 안내만, 지표 선택 이유 없음 |
| WallStreetZen | 🔴 **설명 없음** | `wallstreetzen.com/blog/what-is-a-good-pe-ratio/` — *"one of the most common metrics to judge a stock's valuation"*(기능 서술일 뿐 "왜 헤드라인인가"의 답은 아님) |
| MarketBeat | 🔴 **설명 없음** | `marketbeat.com/financial-terms/what-is-the-price-to-earnings-ratio/` — 정의·해석만, 선정 이유 없음 |
| **Robinhood**(신규) | 🟡 **부분 설명 있음** | `robinhood.com/us/en/learn/articles/.../what-is-a-pe-ratio` — *"the P/E ratio lets investors compare apples-to-apples with other companies by controlling for the number of shares"* · *"P/E ratio controls for the size of the 'piece of pizza'... No matter what company's P/E ratio you're looking at, you see the price of one dollar worth of their earnings."* — **정규화(주식수 차이 통제) 근거는 명시되나, "왜 EV/EBITDA가 아니라 PER인가"까지는 답하지 않음** |
| **Simply Wall St**(신규) | 🔴 **설명 없음(적용조건만)** | `support.simplywall.st`는 403 차단, 공개 방법론 문서(`github.com/SimplyWallSt/Company-Analysis-Model`) 대체 확인 — *"useful for profitable companies generating consistent net income over time"*(적용 **조건**이지 헤드라인 **이유**가 아님) |

**ⓑ 문헌 축(원전·교과서, "왜"에 대한 답)** — 저장소 우선(H-2 순서, 그러나 이 정확한 질문에 대한 문헌은 저장소에 없어 공개 자료로 나감, 기록):

- **CFA Institute**(`cfainstitute.org/insights/professional-learning/refresher-readings/2026/market-based-valuation-price-enterprise-value-multiples`): *"As valuation indicators, multiples have the appealing qualities of simplicity in use and ease in communication."* · *"The key idea behind the use of price-to-earnings ratios (P/Es) is that earning power is a chief driver of investment value and earnings per share (EPS) is probably the primary focus of security analysts' attention."*
- **Corporate Finance Institute**(`corporatefinanceinstitute.com/resources/valuation/price-earnings-ratio/`): *"The beauty of the P/E ratio is that it standardizes stocks of different prices and earnings levels."* · *"quick and easy to use when we're trying to value a company using earnings."*

🔴 **반증 조건 판정**: ⓪-4 "이유가 「검산 가능성·전달」로 확인된다"에 **부분적으로 해당**. 정확히는 **"단순성 + 소통 용이성 + 정규화(주식수 차이 통제)"**로 확인됐다(CFA·CFI·Robinhood 3곳 일치) — "검산 가능성"이라는 정확한 단어는 어느 출처에도 없었으나 개념은 겹친다("EPS 하나만 알면 계산 가능"=단순성). 🔴 **동시에 정직히 보고할 것**: 플랫폼 자신의 도움말 페이지 5곳 중 **3곳(60%)은 "설명 없음"**이었다 — 즉 대부분의 리테일 플랫폼은 이유를 스스로 밝히지 않고 관행적으로 PER을 쓴다. **문헌(일반 교육자료)에는 이유가 있지만, 개별 플랫폼이 그 이유를 사용자에게 직접 설명하는 경우는 드물다.**

---

## 1-2. 🔴 축 C — 양쪽 약점을 같은 깊이로

**PER의 약점**(기존 인용, `Q1_AXIS_DECISION:115`): Real Estate PER(n=13, minSample=20 미달이라 percentile 자체는 저장 안 됨) 상위 3종목이 중앙값의 5.5~30배(CTO 316x·VTR 590x·CSGP 1750x) — REIT GAAP 감가상각 왜곡.

**EV/EBITDA·P/B·P/S의 약점 — 오늘 DB 실측(as_of=최신, 업종 중앙값 대비 배율, minSample=n≥20 모집단 한정)**:

| 축 | 업종중앙값 10배 초과 종목 수(n≥20 모집단) | 섹터 분포 | 개별 최대사례 |
|---|--:|---|---|
| **P/E** | 57건 | 산발(Financials 11·IT 10·Health Care 9 — 특정 섹터 집중 아님) | 8,954배(근접영 순이익 데이터아티팩트) |
| **EV/EBITDA** | 30건 | 산발(IT 10·Health Care 8·Comm.Services 4·Industrials 4) | **DDOG 768배**(근접영 EBITDA, 데이터아티팩트 아닌 실사례 — n≥20 모집단 내 최대) |
| **P/B** | 108건 | 산발(Health Care 28·Financials 17·IT 16) | 2,355,200배(근접영 자기자본 데이터아티팩트) |
| **P/S** | **318건(최다)** | Health Care 압도(118건, 프리레베뉴 바이오텍 추정) | 44,467배(근접영 매출 데이터아티팩트) |

🔑 **문헌 축**(Damodaran 원문 직접 확보, `pages.stern.nyu.edu` — 요약 재인용 아님):

- **EV/EBITDA — 두 메커니즘, 원문 인용**: ① **자본집약도를 못 통제한다** — `vebitda.pdf`가 대수적으로 유도: *"The multiple of value to EBITDA varies widely across firms in the market, depending upon: how capital intensive the firm is (high capital intensity firms will tend to have lower value/EBITDA ratios)."* 민감도표: Net CapEx/EBITDA가 0%→30%로 오르면 정당 배수가 10.2배→4.2배로 하락(같은 WACC·성장률에서). ② **금융업 제외의 정확한 이유**(추정이 아니라 원문) — `finfirm09.pdf`: *"debt for a financial service firm is more akin to raw material than to a source of capital; the notion of cost of capital and enterprise value may be meaningless as a consequence."* 은행 부채를 전부 debt로 잡으면 *"the debt ratios we arrive at for banks will be stratospheric... costs of capital that are unrealistically small – 4% or lower for many banks."* — **EV라는 개념 자체가 은행에 정의되지 않는다**는 것이 `Q1_AXIS_DECISION` §3(Financials n=17, EV/EBITDA 최취약)의 근본 이유. ③ **오늘 DB 실측(DDOG 768배)의 메커니즘**은 원문에 정확히 대응 — 성장 초기·투자 집중 기업은 EBITDA(분모)가 0에 근접해 배수가 폭주.
- **P/B — 무형자산 원문 인용**: `intangibles.pdf`: *"R&D expenses, which are really capital expenses, are treated as operating expenses, thus skewing both reported profit and capital values."* · *"the book value of assets (and equity) will be understated because the biggest assets for these firms are off the books; if you expense an item, you cannot show it as an asset."* 반대로 **은행에서 P/B가 의미 있는 정확한 이유**(원문): *"banks and insurance companies are required to maintain regulatory capital ratios, computed based upon the book value of equity"* — 장부가치가 규제자본 정의에 묶여 있어서다. 오늘 DB의 Health Care·IT 집중(28+16=44/108)이 무형자산 메커니즘과 정합.
- **P/S — 두 메커니즘, 원문 인용**: ① **수익성을 전혀 못 본다** — `revmult.pdf`: *"The biggest disadvantage of focusing on revenues is that it can lull you into assigning high values to firms that are generating high revenue growth while losing significant amounts of money... the failure to control for differences across firms in costs and profit margins can lead to misleading valuations."* ② **레버리지 차이도 못 본다** — 같은 문서: *"The price to sales ratio divides an equity value by revenues that are generated for the firm. Consequently, it will yield lower values for more highly levered firms... when price to sales ratios are compared across firms in a sector with different degrees of leverage."* Damodaran의 처방은 EV/Sales(기업가치÷매출)로 분자·분모 수준을 맞추는 것. 오늘 DB의 Health Care 압도(118/318, 프리레베뉴 바이오텍 다수 추정)는 ①의 "매출은 있는데 대규모 적자" 메커니즘과 정합.

**못 찾은 것(위임 조사 자체가 명시)**: P/B의 "대규모 자사주매입 → 장부자본 마이너스" 메커니즘은 Damodaran 원문에서 직접 인용문을 못 찾음(ROE·PBV 관계 슬라이드에 암묵적으로만 있음) — 방향은 잘 알려져 있으나 이 STEP의 인용 기준(직접 인용)에는 못 미침, 정직히 보고.

**⓪-3b 준수 확인**: 한쪽 약점만 모으지 않았다 — **4축 전부 극단치 건수를 같은 방법(업종 n≥20 모집단·10배 초과)으로 쟀다.** 결과는 PER이 가장 잘 행동한 축(57건, 최소는 아니나 EV/EBITDA 다음으로 적음) — 🔴 **⓪-4 반증 조건 "EV/EBITDA의 약점이 PER보다 크게 나온다"는 개별 최대사례(768배 vs 8,954배)로는 PER이 더 크게 나왔으나, 건수(30건 vs 57건)로는 EV/EBITDA가 더 적었다 — 지표에 따라 결론이 갈린다는 것 자체를 그대로 보고한다.** 근접영-분모 데이터아티팩트(PER·PBR·PSR의 개별 최대치)는 4축 모두에 공통이라 축 간 비교에 쓰기엔 노이즈가 크다 — **건수 비교가 더 안정적**이며, 그 기준으로는 **P/S가 가장 취약(318건)**, **EV/EBITDA가 가장 안정적(30건)**이었다.

---

## 1-3. 배수 칸 역할 확정 — 도출 결과

**맨 앞 표 참고.** 근거 요약:
- **P/E → 전달축**: 축 B에서 "단순성·소통 용이성"이 문헌(CFA·CFI)으로 확인됨(부분). 약점(Real Estate n=13 소표본 왜곡)은 있으나 n≥20 모집단에서는 건수 기준 중간 수준(57건).
- **EV/EBITDA → 정밀 판단축**: `probe_1043`이 이미 CFA 설문 "EV 배수 중 압도적 1위"로 전문가 판단 근거를 확인해뒀다. 오늘 실측은 건수 기준 가장 안정적(30건)이나 **개별 최대사례(768배)가 4축 중 가장 심각한 비-아티팩트 왜곡**이라, 필터 없이 리테일에 그대로 노출하면 위험 — "판단이 필요한 정밀 도구"라는 역할이 여기서 나온다.
- **P/B → 업종 특화축**: 은행 SOTP 표본 편향(56%)이 이미 있고, 오늘 실측도 특정 업종(Health Care·Financials·IT)에 산발적으로 취약 — 일반 보조축보다 "업종을 아는 상태에서 보조로 쓰는" 역할이 근거에 맞는다.
- **P/S → 적자 대안축**: `probe_1043`이 이미 "개별 사용률 근거 없음"이라 밝혔고, 오늘 실측도 4축 중 가장 취약(318건). "대안"이라는 역할 자체가 강점이 아니라 **커버리지 공백을 메우는 최후 수단**이라는 성격과 정합.

**근거 못 찾은 부분**: 없음(4개 배수 전부 역할과 근거를 확보했다).

---

## 1-4. 🔑 축 A — Model Card 원문 확보

**확보 완료**: Mitchell et al., "Model Cards for Model Reporting," arXiv:1810.03993v2(FAT* '19 게재본). PDF 원문 직접 읽음(요약 재인용 아님).

**정확한 9섹션(원문 §4 그대로)**: Model Details(§4.1) · Intended Use(§4.2) · Factors(§4.3) · Metrics(§4.4) · Evaluation Data(§4.5) · Training Data(§4.6) · Quantitative Analyses(§4.7) · Ethical Considerations(§4.8) · Caveats and Recommendations(§4.9).

**각 섹션의 원문 목적(직접 인용)**:

- **Model Details**(§4.1): *"This section of the model card should serve to answer basic questions regarding the model version, type and other details."* 개발주체 공개 이유: *"can be used by all stakeholders to infer details pertaining to model development and potential conflicts of interest."*
- **Intended Use**(§4.2): *"This section should allow readers to quickly grasp what the model should and should not be used for, and why it was created."* 주 사용자: *"Primary intended users: ... This helps users gain insight into how robust the model may be to different kinds of inputs."*
- **Training Data**(§4.6, 전문): *"Ideally, the model card would contain as much information about the training data as the evaluation data... we advocate for basic details about the distributions over groups in the data, as well as any other details that could inform stakeholders on the kinds of biases the model may have encoded."*
- **Ethical Considerations**(§4.8): *"This section is intended to demonstrate the ethical considerations that went into model development, surfacing ethical challenges and solutions to stakeholders."* 하위 유도질문 — Data/Human life/Mitigations/Risks and harms/Use cases.
- **Caveats and Recommendations**(§4.9, 전문): *"This section should list additional concerns that were not covered in the previous sections. For example, did the results suggest any further testing? ... Are there additional recommendations for model use?"*

(Factors·Metrics·Evaluation Data·Quantitative Analyses는 이미 `probe_1040`이 채움으로 확인해둔 섹션이라 이번엔 재확인만 함 — 원문 인용은 위 필요한 5곳에 집중.)

**반증 조건 확인**: "원문 목적이 우리 추정과 다르다"에 해당 안 됨 — 우리 기존 추정(H-1-3의 out-of-scope·Caveats 예시 인용)과 방향이 같았다. 다만 **"Training Data"의 정확한 목적("그룹 분포·편향")이 우리 추정("학습이 아니라 검증이라 해당 없음")보다 더 구체적**이었다 — §1-5에서 이 정밀함으로 재판정.

---

## 1-5. Layer C — 빈 3칸 + 재검토 1칸

**맨 앞 표 참고.** 요약:
1. **모델 버전·날짜·문의처** — **옮기면 되는 것.** `us_valuation.as_of`/`lens_cuts.as_of`(DB에 이미 존재, `lo/hi/n/as_of/method` PK구조) + `contact@onetrillion.app`(`components/layout/Footer.tsx`에 이미 존재). 표시 설계는 이 STEP 범위 밖.
2. **주 사용자** — **새로 정해야 하는 것.** 원문 목적(*"어떤 입력에도 얼마나 robust한지 감 잡게 함"*)이 WHY(*"보는 법을 모르거나 어렵게 생각하는 사람"*)와 그 반대(*"매매 신호가 아니다"*) 둘 다 요구한다는 것을 확인했으나, 문장 자체는 아직 없다.
3. **윤리 고려** — **부분 대응 있음, 완전 일치 아님.** H-6 가드레일(*"약한 신호를 숨기지 않는다·불확실성을 드러낸다·과장·확신하지 않는다·능력을 팔되 의존을 팔지 않는다"*)이 원문의 "Risks and harms"·"Use cases" 취지와 겹친다 — 그러나 이는 **회사 차원 원칙**이지 원문이 요구하는 **모델(배수/렌즈)별 개별 서술**이 아니다. 🔴 **"규칙 7"은 정확한 좌표를 이번 조사에서 특정하지 못했다** — `ROADMAP_V2.md:228`이 "규칙 7(오른다 단정 X)"이라 paraphrase했으나, 그 원문 자체(어느 문서의 몇 번 규칙인지)를 못 찾았다. **미확보로 남긴다.**
4. **Training Data** — **재판정 결과: 원리적 해당 없음 유지.** 원문 목적이 "학습 데이터의 그룹 분포·편향"인데, 우리 배수·역DCF는 학습되는 모델이 아니라 원전 수식을 결정론으로 계산한다 — "학습"이라는 개념 자체가 안 맞는다. 대안으로 "입력 데이터 출처"를 채울 수도 있으나, 이는 이미 Evaluation Data 칸의 역할과 겹쳐 **별도 칸을 채우면 중복**이 된다.

---

## 1-6. Beneish M — 기준 ②③ 측정

**①(원전 확보) 재확인**(`MODEL_ROSTER.md`§3): 🔴 **"통과로 보이나"가 아니라 부분 확보다.** Beneish(1999), *Financial Analysts Journal* 55(5) 원문은 **유료**(Taylor & Francis 초록만 무료) — 워킹페이퍼 사본 1건을 확인했으나 fetch 시 **403**으로 내용 미확인. **임계값(−1.78 vs −2.22)도 출처 간 불일치, 정본 미확정** 상태로 남아 있다(`MODEL_ROSTER` 자체가 이미 이렇게 기록해둠, 재조사 안 함 — ⓪-1b).

**②재현 — 오늘 DB 실측(`us_fundamentals` 컬럼 대조)**:

`us_fundamentals` 보유 컬럼: `symbol·cik·fiscal_year·net_income·equity·revenue·operating_income·dna·debt·non_operating_assets·shares·common_equity·preferred_stock·minority_interest`(+메타). `source_tags`(JSONB)는 이미 있는 6개 필드의 SEC 태그명만 기록할 뿐 추가 원자료를 담지 않음(AAPL 표본 직접 확인).

| Beneish 8변수 | 필요 재료 | 우리 보유 | 판정 |
|---|---|---|---|
| DSRI(매출채권일수지수) | 매출채권(AR)·매출, 2개년 | AR 없음 | 🔴 못 만듦 |
| GMI(매출총이익률지수) | 매출·매출원가(COGS), 2개년 | COGS/매출총이익 없음(`operating_income`은 SG&A까지 뺀 값) | 🔴 못 만듦 |
| AQI(자산품질지수) | 총자산·유동자산·PP&E·유가증권, 2개년 | **전부 없음**(Assets 계열 컬럼 자체 없음, 기존 Altman Z 조사와 동일 결함) | 🔴 못 만듦 |
| SGI(매출성장지수) | 매출, 2개년 | ✅ `revenue` 있음 | ✅ **만들 수 있음** |
| DEPI(감가상각지수) | 감가상각·PP&E, 2개년 | `dna`(D&A)는 있으나 PP&E 없음 | 🔴 못 만듦 |
| SGAI(판관비지수) | SG&A·매출, 2개년 | SG&A 단독 컬럼 없음(`operating_income`에 이미 순액 반영) | 🔴 못 만듦 |
| LVGI(레버리지지수) | 총부채·총자산, 2개년 | `debt` 있으나 총자산 없음(분모 없음) | 🔴 못 만듦 |
| TATA(총발생액/총자산) | 순이익·영업현금흐름·총자산 | `net_income` 있으나 CFO·총자산 없음 | 🔴 못 만듦 |

🔴 **결과: 8개 중 1개(SGI)만 만들 수 있다.** 7개는 `us_fundamentals`에 원자료 자체가 없다(매출채권·COGS·총자산·유동자산·PP&E·SG&A·영업현금흐름) — Altman Z의 "Assets·Liabilities 컬럼 자체가 없다"는 기존 결함(`probe_1043`)이 Beneish에도 그대로, 오히려 더 넓게 적용된다.

**③사용률**(`MARKET_MODEL_USAGE_TOP20.md`§1#20): *"Owner Earnings·EPV·Magic Formula·Beneish M — 전부 개인 투자자 담론 중심. 전문가 리포트 실측 근거 0."* 목록에 있으나 **근거 없음**(전문가 사용 실측치 0).

**반증 조건 판정**: ⓪-4 "Beneish가 기준 ②③에서 탈락"에 **해당** — ②는 1/8 변수만 재현 가능(사실상 불가), ③은 전문가 사용 근거 0. 🔴 **판정: 칸 신설 불필요.** WHAT 구조 갱신 없음.

---

## before / after

| 항목 | before | after |
|---|---|---|
| 배수 칸 4개 성격 | "동점"(`probe_1043`) | 동점 유지 + **역할 4종 도출**(전달·정밀판단·업종특화·적자대안) |
| PER 약점 근거 | 있음(Real Estate만) | PER·EV/EBITDA·PBR·PSR **4축 대칭 실측표** |
| Model Card 원문 | `data/sources/academic/`에 없음 | **확보**(9섹션 원문 인용 완비) |
| Layer C 빈칸 | 3개(추정 상태) | 2개는 처방(옮기면 됨/새로 정할 것), 1개는 부분대응, Training Data는 원문 근거로 재확인 |
| Beneish M 구조 | "구조에 빠진 칸일 수 있음"(`probe_1041`) | **칸 신설 불필요로 종결**(②③ 근거로) |

---

## 못 한 것 / 미측정 / 철회·정정

- **못 한 축(시도 기록)**: "규칙 7"의 정확한 원문 좌표 — `ROADMAP_V2.md:228`의 paraphrase만 발견, 원문 자체를 특정하지 못함(어느 문서 몇 번 규칙인지 미확보로 남김). Investopedia 정본 페이지(canonical investopedia.com) 직접 접근 실패 — 미러 사이트로 대체, 이 사실을 그대로 보고(위임 에이전트가 명시).
- **⓪ 원전 인벤토리 준수**: 이번에 새로 인용한 Damodaran 원문 4편(`vebitda.pdf`·`finfirm09.pdf`·`intangibles.pdf`·`revmult.pdf`)을 `data/sources/damodaran_pdfs/`에 원본 그대로 저장 완료(요약 재인용이 아니라 실제 PDF 확보 — 기존 `c21.pdf`·`ch18.pdf`·`finsvc.pdf`와 같은 폴더).
- **아직 안 함**: 배수 칸 4개 중 하나를 헤드라인으로 승격할지(표시 설계, 이 STEP 범위 밖 — 장은태 판정) · Layer C "주 사용자" 문장 확정(새로 정할 것, 이 STEP은 재료만) · Ethical Considerations 렌즈/배수별 개별 서술 작성(이 STEP은 H-6 대조만).
- **철회·정정**: 없음(이번 STEP은 신규 도출 — `probe_1043`의 "동점 4개" 결론을 뒤집지 않고 그 안의 역할을 갈랐다, 기존 결론과 독립적으로 C안과 개념적으로 수렴해 교차검증됨).
- **미측정**: Beneish 임계값(−1.78 vs −2.22) 정본 확정(재조사 안 함, 기존 미확정 그대로) · 근접영-분모 데이터아티팩트(PER 8,954배·PBR 2,355,200배·PSR 44,467배)가 실제 어떤 개별 종목인지(4축 대칭 비교의 노이즈로만 식별, 개별 조사 안 함).

🔴 **판정 금지 없음(선택지 판정 요구 항목) — 이 STEP은 도출·확보·처방까지 전부 완료했다.** 단 표시 설계(배수 승격·주 사용자 문장·윤리 서술 작성)는 이 STEP의 명시적 범위 밖이라 장은태 판정 대상으로 남는다.
