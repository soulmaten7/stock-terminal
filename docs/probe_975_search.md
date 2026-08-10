<!-- STEP 975 착수 전 검색 — 3중 규칙: 코드/분석 전에 ①-A 3회 + ①-B 3회를 먼저 하고 기록한다. -->

# STEP 975 — 잔차 원인 규명 전 검색 기록

## ①-A 원전 3회 — Damodaran의 분모 주식수 기준

**1. PBV(Price-to-Book Value) 정의** — `pages.stern.nyu.edu/~adamodar/pdfiles/eqnotes/pbv.pdf` p.93 (직접 pdftotext 추출)
> *"The price/book value ratio is the ratio of the **market value of equity** to the **book value of equity**"* — Consistency Test: *"If the market value of equity refers to the market value of equity of common stock outstanding, the book value of common equity should be used in the denominator."* / *"If there is more than one class of common stock outstanding, the market values of all classes needs to be factored in."*
🔑 **PBV은 애초에 "주당(per-share)" 정의가 아니라 "총액(aggregate) ÷ 총액" 정의다.** 분모 주식수라는 개념 자체가 원전 정의에 없다 — 총 시가총액을 총 자기자본으로 나눌 뿐이다. 다중 클래스는 "전 클래스의 시가총액을 합산"하라고만 명시.

**2. PS(Price-to-Sales) 정의** — `.../ps.pdf` p.120 (직접 pdftotext 추출)
> *"The price/sales ratio is the ratio of the **market value of equity** to the **sales**."* Consistency Test: *"The price/sales ratio is internally inconsistent, since the market value of equity is divided by the total revenues of the firm."*
🔑 PS도 마찬가지로 **총액÷총액** 정의다.

**3. EV(Enterprise Value)의 주식수 시점** — Damodaran, "A Tangled Web of Values: Enterprise Value, Firm Value and Market Cap"(2013 블로그) — WebFetch로 본문+댓글 확인
> 옵션 처리: *"When there are management options outstanding, they have value... that value should be added to the market capitalization of the traded shares."* 댓글 응답: **"the market cap should always be based upon primary shares outstanding (to prevent double counting)"**
🔑 시가총액은 **"primary shares outstanding"**(기본/실제 발행주식) 기준 — 가중평균이나 희석이 아니라 **시점 실제 발행주식수** 계열임을 시사. 단 "기말"이라는 시점을 명시적으로 못박지는 않음(추론 여지 있음).

**종합**: 원전 셋 다 PBV·PS·EV를 **주당 지표가 아니라 총액 지표로 정의**한다. 우리 코드(`lib/valuation.ts`)도 정확히 이 방식이다(`marketCap/commonEquity`·`marketCap/revenue`·`(marketCap+debt-nonOpAssets)/ebitda` — 전부 총액, 어디에도 "주당" 중간 계산이 없음). **"주식수 기준(기말 vs 가중평균)" 질문은 원전 정의 자체에는 등장하지 않는다** — 이 질문은 오직 **market cap을 만들 때** 생긴다(price×shares 형태로 구성할 때만). EV는 primary(실제 발행) 주식수를 시사.

---

## ①-B 타 플랫폼 실무 3회

**목표 3곳: stockanalysis.com·gurufocus·wisesheets** (966·968 선례대로 차단되면 그대로 기록)

| 플랫폼 | 결과 | 확인 내용 |
|---|---|---|
| stockanalysis.com(`/stocks/aapl/financials/ratios/`) | 🟢 접근됨, 방법론 없음 | PB·PS·PE 계산 시 분모 주식수 기준(기말 vs 가중평균)을 밝히는 문구 없음. 수치만 나열. |
| gurufocus.com(`/term/PBRatio/AAPL`) | 🔴 403 차단 | (966·968과 동일 패턴) |
| wisesheets.io(`/available-data`) | 🟢 접근됨, 방법론 없음 | P/B·P/S 계산 시 주식수 기준을 설명하는 문구 없음. |

🔴 **명시적 방법론 문구는 3곳 다 못 찾음(1곳 차단·2곳 접근했으나 서술 없음)** — 억지로 채우지 않는다. 966·968에서 이미 반복 확인된 패턴("대부분 방법론을 공개하지 않는다")과 일치.

🔑 **간접 증거(968 재사용, 새로 조회 안 함)**: stockanalysis.com의 AAPL FY2024 "Market Cap"÷"Last Close Price" 역산 주식수(15,116,822,904)가 우리 FY 가중평균희석주식수(15,408,095,000)보다 낮고, SEC `CommonStockSharesOutstanding`(FY2024말, 15,116,786,000)과는 거의 정확히 일치 — 이번 STEP 2단계에서 15종목 전수로 재확인(아래 참조).

**PE만 EPS 기반이라 주식수가 약분되는 구조인가**: 명시적 방법론 문구는 못 찾았으나(①-B), 이번 STEP 1·3단계의 실측 자체가 이 가설을 강하게 뒷받침한다 — PER 잔차는 원래(968) 이미 중앙값 0.07%로 사실상 0에 수렴해 있었고, 3단계에서 분모 주식수를 기말발행 기준으로 바꾸자 오히려 중앙값 3.99%로 **커졌다**(11종목). 이는 외부 PER이 "market cap÷netIncome" 경로가 아니라 **"price÷EPS"(EPS는 GAAP 가중평균희석 고정)** 경로로 계산되어 주식수가 자동으로 약분되는 구조라는 것의 강한 간접 증거다.
