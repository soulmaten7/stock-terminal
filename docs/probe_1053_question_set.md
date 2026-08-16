# probe_1053 — 질문 층 확정

> STEP1053 실행 기록. 🔵 도출 전용 — 코드·DB 쓰기 0 · 화면 변경 0. **`Q0`~`Q5` 번호 표기는 옛 문서를 인용할 때만 쓴다. 새 서술은 문장으로 부른다.**

---

## 맨 앞 — 질문 목록 한 장

| 질문(도출) | 답하는 정보 칸 | 재료 상태 |
|---|---|---|
| **지금 사면, 이 회사 몫에 비해 비싸게 사는 걸까?** | 배수 + 시장내재기대(같은 질문에 답하는 두 방법 — 하나는 지금, 하나는 주가가 가정하는 미래) | ✅ 배수 있음(`us_valuation`) · 시장내재기대 있음(`revdcf_results`, 플래그 뒤) |
| **이 회사, 재정 상태가 좋아지고 있을까 나빠지고 있을까?** | 재무건전성(Piotroski F-Score) | ✅ 있음(7렌즈) |
| **사업 자체가 커지고 있을까?** | 성장(매출 5년 CAGR 주축) | ✅ 있음(`revdcf_results.sales_growth`) |
| **현금을 얼마나, 얼마나 오래 나눠주고 있을까?** | 배당(수익률+연속증가연수) | 🔴 **US 재료 0건**(STEP1048로 확정) |
| **이 회사가 망할 위험이 있을까?** | 부도위험(Altman Z-Score) | 🔴 지금 못 만듦(`Assets`·`Liabilities` 컬럼 부재) |
| **최근에 뭐가 바뀌었을까?** | 최근변화(모멘텀+기술) | ✅ 있음(7렌즈) |
| *(전제, 질문 아님)* 이 회사가 어느 업종에 속하는가 | 업종(0층) — 위 질문들의 답을 "무엇과 비교해 읽을지" 정하는 잣대 | ✅ 있음 |
| *(전제, 질문 아님)* 이 회사가 지금 흑자인가 적자인가 | 이익상태(0층) — 배수 계산이 성립하는지 정하는 조건 | ✅ 있음(`unavailable_reason`) |

**질문 6개(0층 전제 2개는 질문에서 뺌) — 🔑 개수가 달라졌다.** 옛 6항목(`Q0`~`Q5`)과 비교해 **재무건전성 질문이 새로 들어왔다**(§1-5). `Q0`은 여전히 전제로 남고(재확인, 안 바뀜), 나머지 다섯은 문구만 다듬어졌다.

### ⓪-4 매트릭스 결과

| 관측 | 실제 결과 |
|---|---|
| 도출한 질문이 기존과 대체로 같다 | 🟡 **부분** — 5/6은 개념이 같고 문구만 다듬어짐(§1-5) |
| 개수가 달라진다 | 🔴 **해당 — 재무건전성 질문이 늘었다**(6개→7개 개념, 단 0층 둘은 질문이 아니라 전제로 계속 분리) |
| 문구가 크게 달라진다 | 🟡 부분 — "비싸게 사는 걸까"류로 구어체화, 단 "얼마나·얼마나 오래" 같은 원래도 쉬운 표현은 유지 |
| 답할 수 없는 질문이 나온다 | 🔴 해당 — 배당(US 재료 0)·부도위험(재료 미구축) 둘 다 목록에 남기고 "지금 답 못 함" 표시 |
| 모델 판정이 뒤집히는 질문이 나온다 | 🔴 **해당 — §1-6에서 지목**(재판정은 안 함) |
| 0층이 질문으로 도출된다 | ✅ **아니오 — 전제로 재확인**(§1-2) |
| 질문 문구가 우리 언어에서 못 벗어난다 | 🟡 부분(배수·시장내재기대 병합 질문은 여전히 다소 개념적) — 억지로 더 깎지 않고 그대로 적음 |

---

## ⓪-1a. 로드맵 원문 대조

| 층 | 확인 | 비고 |
|---|---|---|
| WHY | 조건2(단순해야) | 이 STEP의 1-1 기준 자체가 조건2를 명문 기준으로 승격(전달성) |
| WHY | 문제 진술 | "정보를 보는 법을 모르거나 어렵게 생각한다" — 질문 문구가 그 사람들의 말이어야 한다는 전제 확인 |
| HOW | H-7 | 질문 문구는 창작 금지 대상이 아님을 재확인, 답 못 하는 질문은 안 묻는다는 원칙 적용(배당·부도위험은 재료 없어도 목록엔 남김 — "안 묻는다"는 "지어내지 않는다"는 뜻이지 "숨긴다"는 뜻이 아님, 반증조건 §⓪-4에서 명시) |
| WHAT | W-1①·W-2-1·W-2-3·W-2-4 | 이 STEP이 갱신(§본문 하단) |
| 관문·순위 | F-1·F-1-1 | 질문도 관문 통과 확인(§1-4) |
| 완성의 정의 | C-1 항목7 | 화면 일관성 — 이번 STEP은 문구 정의까지, 화면 반영은 표시 설계(범위 밖) |
| 수익 모델 | 없음 | 무관 |

## ⓪-1b. 기존 답 확인 — `ls`로 전수

```
docs/PARKED_FIELD_SURFACES.md
docs/PARKED_HNX_VCI_ACTIVATION.md
docs/PARKED_KR_DIVIDEND_ACTIVATION.md
docs/PARKED_OAUTH_LOCALE_ACTIVATION.md
docs/PARKED_TERMS_PRIVACY_ACTIVATION.md
```
(STEP1050~1052와 동일, 새로 생긴 것 없음.) 그 외 `probe_1037`(수요 실측, 재조사 금지 — 인용만)·`probe_1038`·`probe_1040`(0층/1층/시간축 구조)·`probe_1041`·`probe_1043`(칸별 질문·모델)·`probe_1045`(성장 복원)·`probe_1052`(배수 역할)·`USER_QUESTIONS_2026-08-08.md`(옛 6문항 정본)·`MODEL_DEMAND_SURVEY_2026-08-07.md`(20항목 수요 순위 — 🔑 **재무건전성 발견의 근거**, 아래)·`MARKET_MODEL_USAGE_TOP20`·`Q1_CARD_DESIGN`·`Q1_AXIS_DECISION`·`lib/lensCopy.ts`(현행 문구) 전부 확인. `KNOWN_ANSWERS.md`에 이 주제 관련 기존 답 없음.

## ⓪-3중 규칙 요약

- **A-0 우리 자산**: 위 전부 — 수요는 재조사하지 않고 인용만
- **A 원문**: 해당 없음(질문 도출은 원전 대조 대상 아님)
- **B 실무**: 5개 플랫폼 화면 문구 직접 수집(§1-3)
- **C 반대 증거**: `MODEL_DEMAND_SURVEY`가 `USER_QUESTIONS`보다 하루 먼저 더 세밀한 20항목 수요조사를 이미 했고, 그 안에 "재무건전성 스코어"(#7)가 Piotroski와 별개 항목으로 독립 존재했는데 다음날 6문항으로 좁히면서 빠졌다는 것을 발견 — 이 STEP의 핵심 발견(§1-5)
- **검증**: 우리실측(정보 칸 8개 재확인) / 우리실측(수요 문서 재대조) / 제3자(5개 플랫폼 화면 직접 방문)
- **검수**: 반박 시도(재무건전성이 정말 새 질문인지 — SWS "Health"가 부도위험과 재무건전성 둘 다에 걸쳐 있을 가능성을 §1-5에서 직접 검토) · 수치 출처(전부 기존 문서 직접 재확인) · 이전 발언 대조(성장/Q3 복원 사례와 같은 패턴임을 명시) · 분기 비중(6개 질문 중 1개가 새로 늘었다는 것을 정확히 셈)
- 🔴 **미측정**: 재무건전성 질문의 정확한 "전달성" 문구가 사용자 테스트를 거친 적 없음(이 STEP은 문서·화면 읽기까지, 사용자 조사는 범위 밖)

---

## 1-1. 좋은 질문 집합의 조건 — 질문을 보기 전에

🔴 **아래를 먼저 쓰고, 이후 어떤 질문이 나오든 이 기준으로만 판정한다.**

1. **관문①(원하는 정보인가)** — `probe_1037`의 수요 실측(AAII·SWS·역방향 채널)에 이미 있는 것인가.
2. **관문②(우리가 값을 매기지 않는가)** — 적정주가·목표주가처럼 우리 판단을 답으로 내미는 질문이 아닌가.
3. **관문③(정직하게 답할 수 있는가)** — 검증 가능한 계산으로 답할 수 있는 질문인가(추정·예측이 아니라).
4. **배타성** — 두 질문이 같은 정보를 두 번 안 묻는가.
5. **완전성** — "오를지 내릴지 판단"에 드는 것 중 빠진 축이 없는가.
6. 🔴 **전달성(WHY 조건2, 이번에 명시 기준으로 승격)** — 사람이 실제로 쓰는 말인가. 전문용어(예: "감가상각전 영업이익")가 질문 문장 자체에 들어가 있지 않은가. **질문과 답의 전달성은 다르다** — 질문은 쉬워야 하고, 답의 정밀함은 유지한다(정확성과 안 바꿈, ⓪-3b).
7. **답 가능성** — 지금 우리 재료로 답할 수 있는가. 🔴 **못 해도 질문에서 빼지 않는다** — "지금 답 못 함"으로 표시만 한다.
8. 🔴 **명확성(추가 기준)** — 질문 자체가 두 가지로 읽히지 않는가. `probe_1043`이 재무건전성에서 겪은 "방향 vs 수준" 혼동이 정확히 이 기준 위반 사례다 — **한 질문이 답변자마다 다른 것을 답하게 만들면 안 된다.**
9. 🔴 **독립 출처(추가 기준)** — 이 질문에 답하는 정보 칸이 다른 질문에 답하는 칸과 실제로 다른 데이터에서 나오는가(완전히 같은 계산이면 배타성 위반, 부분적으로 겹치면 그 자체를 명시).

---

## 1-2. ⓐ 상향 — 정보에서 질문으로

`probe_1040`·`1043`·`1045`가 확정한 정보 칸을 그대로 가져온다(재조사 없음): **0층 2**(업종·이익상태) · **1층 5**(배수·재무건전성·시장내재기대·배당·부도위험) · **시간축 2**(최근변화·성장).

### 0층 — 질문인가 전제인가 (이 STEP에서 재판정)

- **업종**: `USER_QUESTIONS`§0("`Q0`이 전제인 이유")의 논리를 이번엔 독립적으로 재확인 — 업종을 모르면 나머지 질문의 답(예: "PER 15배가 싼가 비싼가")을 해석할 잣대가 없다. **정보 자체가 아니라 "다른 답을 어떻게 읽을지" 정하는 잣대**다 → **전제로 재확인, 질문 아님.**
- **이익상태**: 새로 검토 — "이 회사가 지금 흑자인가"는 표면적으로는 사용자가 궁금해할 만한 정보처럼 보인다. 그러나 기능은 다르다 — 배수(특히 PER)가 **계산 자체가 성립하는지**를 가르는 조건이지, 그 자체로 독립된 답이 아니다("적자다"라는 사실은 재무건전성 질문(방향)이나 성장 질문(매출 추세)이 이미 더 풍부하게 답한다). → **전제로 판정, 질문 아님**(업종과 같은 역할 — 계산 성립 여부를 정하는 게이트).

### 1층 5 + 시간축 2 — 질문 문장으로

| 정보 칸 | 도출한 질문 문장 | 비고 |
|---|---|---|
| 배수 | "지금 사면, 이 회사 몫에 비해 비싸게 사는 걸까?" | |
| 시장내재기대 | "지금 이 주가는, 앞으로 얼마나 성장해야 말이 되는 걸까?" | 🔴 **배수와 병합 여부 검토 필요** — 아래 |
| 재무건전성 | "이 회사, 재정 상태가 좋아지고 있을까 나빠지고 있을까?" | |
| 배당 | "현금을 얼마나, 얼마나 오래 나눠주고 있을까?" | |
| 부도위험 | "이 회사가 망할 위험이 있을까?" | |
| 최근변화 | "최근에 뭐가 바뀌었을까?" | |
| 성장 | "사업 자체가 커지고 있을까?" | |

🔴 **배타성 점검 — 배수 vs 시장내재기대 vs 성장, 셋이 서로 겹치는가?**
- 배수와 시장내재기대는 **정말 같은 질문**이다 — "지금 비싼가"를 배수는 **지금 시점 스냅샷**으로, 시장내재기대는 **주가에 이미 박힌 기대를 거꾸로 풀어서** 답한다. `USER_QUESTIONS`§5가 이미 이 결론(*"같은 질문, 세 방법"*)에 도달해 있었고, 이 STEP도 독립적으로 같은 결론에 도달했다 — **병합**(맨 앞 표에 반영).
- 시장내재기대(미래에 필요한 성장)와 성장(과거 5년 실제 성장)은 **다른 질문이다** — 하나는 "주가가 가정하는 미래", 하나는 "회사가 실제로 해온 과거"다. `probe_1045`가 이미 이 둘의 상관계수를 재서 독립임을 확인했다(성장 vs 최근변화 r=-0.10, 단 이건 최근변화와의 비교였다 — 시장내재기대와 성장의 직접 상관은 미측정으로 남긴다, 아래 "미측정"). **개념적으로는 배타적**(미래 가정 vs 과거 실적)이라 안 합친다.

---

## 1-3. ⓑ 하향 — 실무가 사용자에게 던지는 말

🔴 **모델 이름이 아니라 화면에 쓰인 문장을 수집한다.** 하한 5곳: Stock Analysis·WallStreetZen·MarketBeat·Simply Wall St(`probe_1038`·`1052`가 이미 연 곳, 이번엔 문장 수집으로 재방문) + 신규 1곳. `link_hub` 병행 확인 완료(`research`/`analysis` 카테고리, Stock Analysis·WallStreetZen·MarketBeat·Simply Wall St·Zacks·Morningstar 전부 등재돼 있음 — ⓪-5-B 절차 준수).

**방법**: raw HTML을 직접 받아(curl/WebFetch, 브라우저 User-Agent) `<h1>~<h4>` 태그와 주변 문장을 그대로 옮김(AI 요약 경유 안 함 — 의역 위험 회피). 대상 = Stock Analysis·WallStreetZen·MarketBeat(하한 3곳 원안) + Simply Wall St(막힘, 아래) + Morningstar(대체 5번째, 지시에 따름). 전부 AAPL 종목상세 페이지. `api.nasdaq.com` 미사용·유료 가입 없음(지시 준수 확인). 🔴 robots.txt를 파일별로 별도 조회하지는 않음(각 사이트 공개 종목상세 페이지 1회 조회, 크롤링·반복호출 아님) — 이 STEP의 미측정 항목으로 아래에 남긴다.

### Stock Analysis (stockanalysis.com/stocks/AAPL/)
- **valuation**: 없음(섹션 제목 없음 — "PE Ratio"·"Forward PE" 같은 raw 라벨만 통계표에 존재, 설명문장 없음)
- **financial-health**: 없음(전용 섹션 없음)
- **dividends**: 없음(raw 필드만)
- **growth**: 헤더 **"Financial Performance"** — *"In fiscal year 2025, Apple's revenue was $416.16 billion, an increase of 6.43%... Earnings were $112.01 billion, an increase of 19.50%."*
- **recent-changes**: 헤더 **"News"**, 설명문장 없음(헤드라인 나열만)
- **sector-or-company-type**: 헤더 **"About AAPL"** — *"Apple Inc. designs, manufactures, and markets smartphones..."*
- 기타: 헤더 **"Analyst Summary"** — *"According to 46 analysts, the average rating for AAPL stock is 'Buy.'..."*
- 🔑 **질문형 헤더 없음.** 스타일이 숫자 우선·평문 — "이게 싼가/건전한가" 같은 질문 프레이밍이 전혀 없다.

### WallStreetZen (wallstreetzen.com/stocks/us/nasdaq/aapl)
- **valuation**: h2 **"Valuation"** → h3 **"AAPL fair value"**·**"AAPL price to earnings (PE)"**·**"AAPL price to book (PB)"**·**"AAPL price to earnings growth (PEG)"**, h4 **"Fair Value of AAPL stock based on Discounted Cash Flow (DCF)"**. 배수마다 툴팁 한 줄: PE=*"For valuing profitable companies with steady earnings"*, PB=*"For valuing companies that are loss-making or have lots of physical asset"*, PEG=*"For valuing profitable companies with growth potential"*
- **financial-health**: h2 **"AAPL's financial health"** → h3 **"Profit margin"**·**"Assets to liabilities"**·**"Cash flow"**
- **dividends**: 없음(전용 섹션 없음, 필드만)
- **growth**: "Zen Rating Component Grades" 안의 컴포넌트 **"Growth"**(등급 C) — 별도 산문 섹션 없음
- **risk**: 같은 컴포넌트군 **"Momentum"**·**"Sentiment"**·**"Safety"**
- **recent-changes**: h2 **"AAPL News"**
- **sector-or-company-type**: h3 **"Industry: Consumer Electronic"**·**"AAPL vs Consumer Electronic Stocks"**
- 🔑 **질문형 헤더(FAQ)**: **"What is Apple's quote symbol?"**·**"What is the 52 week high and low for Apple?"**·**"How much is Apple stock worth today?"**·**"How much is Apple's stock price per share?"**·**"What is Apple's Market Cap?"** — 전부 **수치 조회형** 질문이지 "싼가/건전한가" 판단형 질문이 아니다.
- 종합등급 h2 **"Zen Rating"** → h3 **"Zen Rating Component Grades"**: **Value, Growth, Momentum, Sentiment, Safety** 5개 라벨. 모델 설명문: *"Our proven quant model uses 115 proprietary factors, including AI, to determine AAPL's potential to beat the market"*.

### MarketBeat (marketbeat.com/stocks/NASDAQ/AAPL/)
- **valuation**: 헤더 **"Price to Earnings Ratio vs. the Market"**·**"...vs. Sector"**·**"Price to Earnings Growth Ratio"**·**"Price to Book Value per Share Ratio"**; MarketRank™ 구성요소 헤더 **"Earnings and Valuation"**. 문장: *"The P/E ratio of Apple is 35.08, which means that it is trading at a less expensive P/E ratio than the market average..."*; *"Apple has a PEG Ratio of 2.62. PEG Ratios above 1 indicate that a company could be overvalued."*
- **financial-health**: 헤더 **"Debt"**·**"Profitability"** — 건전성 전용 섹션명 대신 부채·수익성으로 쪼개져 있음
- **dividends**: MarketRank™ 구성요소 헤더 **"Dividend Strength"** → **"Dividend Coverage"**·**"Dividend Growth"**·**"Dividend Sustainability"**·**"Dividend Yield"**. 문장: *"Apple has a dividend yield of 0.35%... bottom 25%..."*; *"Apple has been increasing its dividend for 14 years."*
- **growth**: 헤더 **"Earnings Growth"** — *"Earnings for Apple are expected to grow by 8.68% in the coming year..."*
- **risk**: 헤더 **"Short Interest"**·**"Insider Buying vs. Insider Selling"**
- **recent-changes**: MarketRank™ 구성요소 헤더 **"News and Social Media"** → **"News Sentiment"**·**"Company Calendar"**
- **sector-or-company-type**: 헤더 **"Industry, Sector and Symbol"**·**"Company Overview"**
- 종합등급 **"AAPL MarketRank™"**: 구성요소 = **"Earnings and Valuation"**·**"Dividend Strength"**·**"News and Social Media"**·**"Short Interest"** — 🔑 **재무건전성이 독립 구성요소가 아니라 배수/밸류에이션에 녹아 있음**(우리와 다른 배선).
- 질문형 헤더: **"AAPL Stock Analysis - Frequently Asked Questions"**(상위 헤더만 확보, 개별 질문 문장은 이번 패스에서 못 뺌).

### Simply Wall St — 🔴 접근 차단
- 본문·헬프센터 둘 다 Cloudflare 챌린지(HTTP 403)로 막힘. **화면 원문을 직접 못 봤다.**
- 검색엔진 요약을 통해서만(★ 검증 불가로 표시, 화면 인용 아님): 5개 축 라벨로 **Value·Future·Past·Health·Dividend**가 반복 언급됨. 뉴스 신디케이션 제목에 *"Does Apple (AAPL) Sit Above Fair Value After Its AI Push?"* 같은 질문형 프레이밍이 보이나 이는 **기사 헤드라인이지 확인된 화면 섹션 제목이 아니다.**

### Morningstar (대체 5번째, morningstar.com/stocks/xnas/aapl/quote)
- **valuation**: h2 **"Price vs Fair Value"**; 인근 탭 라벨 **"Sustainability"**·**"Trailing Returns"**·**"Key Metrics"**·**"Financials"**; 잠금 필드 **"Economic Moat"**·**"Fair Value Uncertainty"**(Low~Extreme 등급, 로그인 잠금)
- **financial-health**: h2 **"Financial Strength"**, h2 **"Profitability"**
- **dividends**: 전용 섹션 없음("Key Statistics" 표 안 필드만)
- **growth**: 전용 섹션 없음(이번 패스에서 못 찾음)
- **risk**: 잠금 필드 **"Fair Value Uncertainty"**
- **recent-changes**: h2 **"News"**
- **sector-or-company-type**: h2 **"Company Profile"**·**"Competitors"**·**"Consumer Electronics Industry Comparables"**
- 질문형은 아니지만 h2 **"Bulls Say, Bears Say"**가 가치판단 서술형 섹션으로 기능: *"Apple offers an expansive ecosystem... locks in customers and drives strong profitability."*(Bulls) / *"Apple is prone to consumer spending... creates cyclicality..."*(Bears)

### 🔑 종합 — 이 STEP의 도출에 무엇을 확인해주나

| 확인 대상 | 결과 |
|---|---|
| 배수+시장내재기대 병합 | **간접 지지** — WallStreetZen이 "Valuation" 한 섹션 안에 PE·PB·PEG(배수)와 DCF fair value(시장내재기대 계열)를 **같은 부모 섹션**에 묶어놓음. 우리 병합 판단과 같은 방향. |
| 재무건전성 = 독립 칸 | **강하게 지지** — WallStreetZen·Morningstar 둘 다 **"financial health"/"Financial Strength"를 valuation과 분리된 전용 섹션**으로 명시. MarketBeat만 예외(배수에 녹임) — 5곳 중 2곳 확인·1곳 반례, 다수는 독립 지지. |
| 배당 = 독립 칸 | **지지** — MarketBeat가 "Dividend Strength"를 MarketRank™ 5대 구성요소 중 하나로 명시. |
| 질문형 문장 사용 관행 | 🔴 **부분 반증** — 5곳 다 섹션 제목은 명사구(예: "Financial Strength")지 의문문이 아니다. WallStreetZen FAQ만 의문문이나 전부 "수치가 얼마인가" 조회형이지 "싼가/건전한가" 판단형이 아니다. **우리가 쓰려는 "~걸까?" 구어체 질문형은 업계 관행이 아니라 우리 선택**이라는 사실이 명확해짐 — 나쁜 것은 아니나(전달성 기준 자체가 우리 판단), "업계도 이렇게 쓴다"고 주장하면 안 된다. |
| 부도위험 = 독립 칸 | 미확인 — 5곳 중 "Bankruptcy Risk"/"Altman Z" 전용 섹션은 못 찾음(MarketBeat "Short Interest"·Morningstar "Fair Value Uncertainty"가 근접하나 다른 개념). |

**미측정**: Simply Wall St 화면 원문(차단) · MarketBeat FAQ 개별 질문 문장(상위 헤더만 확보).

---

## 1-4. 🔑 질문 집합 도출 — 하나의 답

1-1의 기준을 1-2·1-3에 적용한 결과가 맨 앞 표다. 기준별 통과 여부:

| 질문 | ①원함 | ②값안매김 | ③정직 | 배타성 | 완전성 | 🔴전달성 | 답가능성 | 명확성 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 비싸게 사는 걸까(배수+시장내재기대) | ✅`probe_1037` | ✅ | ✅ | ✅(병합으로 해소) | ✅ | 🟡(시장내재기대 절반은 개념적) | ✅ 배수/🔴 시장내재기대는 플래그 뒤 | ✅ |
| 재정 상태 좋아지나/나빠지나 | ✅`MODEL_DEMAND_SURVEY`#7 | ✅(F-Score는 원전 있음) | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 **"수준"과 혼동 위험 — 반드시 "방향" 명시 병기** |
| 사업이 커지고 있을까 | ✅AAII Growth 69% | ✅ | ✅ | ✅(시장내재기대와 구분) | ✅ | ✅ | ✅ | ✅ |
| 현금 얼마나·얼마나 오래 | ✅AAII Dividends 73% | ✅ | ✅ | ✅ | ✅ | ✅ | 🔴 US 재료 0건 | ✅ |
| 망할 위험 있을까 | ✅`MODEL_DEMAND_SURVEY`#12 | 🟡(예측물 성격 논쟁 있었음, 아래) | ✅(계수 공개) | ✅(재무건전성과 구분, 아래) | ✅ | ✅ | 🔴 재료 미구축 | ✅ |
| 최근 뭐가 바뀌었을까 | ✅AAII 매도사유 60% | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**개수 변화 명시**: 6개(옛)→6개(새, 병합 하나·신규 하나로 순증감 0) — 단 **내용이 바뀌었다.** 옛 6개는 {업종, 배수(+시장내재기대 내장), 배당, 성장, 부도위험, 최근변화}였고, 새 6개는 {배수(+시장내재기대), **재무건전성(신규)**, 성장, 배당, 부도위험, 최근변화} — **업종이 질문 자리에서 완전히 빠지고(전제로 재확인) 그 자리에 재무건전성이 새로 들어왔다.** 순수 카운트는 우연히 같지만 구성은 달라졌다.

🔴 **근거 없는 곳**: "망할 위험"의 ②(값을 안 매기는가)는 `MODEL_DEMAND_SURVEY`가 한때 "예측물 — 비예측 원칙 위반"이라 표시했던 이력이 있다(§120 표). 이후 `probe_1043`이 Altman Z를 "계수 공개·검증 가능"이라는 이유로 확정 모델로 채택해 사실상 이 우려를 넘어선 것으로 보이나, **이 STEP에서 그 판정을 다시 검증하지는 않았다** — 질문 문구 자체는 유효하다고 보되, 이 특정 항목의 ②통과 여부는 "근거 없음 — 판정 필요"로 남긴다.

---

## 1-5. 대조 — 도출 이후에만

| 옛 문구(`probe_1043`§1-1·`USER_QUESTIONS`§2) | 새 문구(이 STEP) | 관계 | 무엇이 어려웠는지/왜 바뀌었는지 |
|---|---|---|---|
| `Q1` "내가 비싸게 사는 건가"(배수) + 시장내재기대(별도 서술, `probe_1043`) | "지금 사면, 이 회사 몫에 비해 비싸게 사는 걸까?" | **유지(병합 재확인)** | 문구는 거의 그대로 — 원래도 쉬운 문구였다. "몫에 비해"를 추가해 무엇과 비교하는지 살짝 명시 |
| — (재무건전성은 `probe_1043`에만 있었고 원래 6문항엔 없었음) | "이 회사, 재정 상태가 좋아지고 있을까 나빠지고 있을까?" | 🔑 **새로 생김** | `MODEL_DEMAND_SURVEY`(2026-08-07) #7 "재무건전성 스코어"가 **당시에도 최상위 수요 티어(●●●)**였고 SWS Health·Alpha Spread(profitability·solvency·efficiency)로 뒷받침돼 있었다. 그런데 다음날(`USER_QUESTIONS`, 2026-08-08) 6문항으로 좁히면서 이 항목이 빠졌다 — **SWS의 "Health" 신호를 `Q4`(부도위험)에 전부 배정**했기 때문으로 보인다(`USER_QUESTIONS`§2 "Q4 — SWS Health"). 즉 하나의 신호(SWS Health)를 부도위험 쪽으로만 쓰고, 같은 신호가 가리키는 또 다른 질문(재정상태 방향)을 놓쳤다 — **성장/`Q3`이 겪은 것과 같은 유형의 누락**(정보는 이미 있었는데 질문 목록에 안 옮겨짐) |
| `Q3` "커지고 있나"(`USER_QUESTIONS`) / "매출이 커지고 있는가"(`probe_1045`) | "사업 자체가 커지고 있을까?" | **유지(문구만 다듬음)** | "매출이"를 "사업 자체가"로 바꿔 계정과목 용어(매출)를 뺐다 — 답(카드 안)에서는 "매출 5년 성장률"로 정밀하게 유지, 질문에서만 뺀다(전달성 기준 6과 정확성 기준의 분리) |
| `Q2` "현금을 돌려주나" | "현금을 얼마나, 얼마나 오래 나눠주고 있을까?" | **유지(구체화)** | 옛 문구는 이미 쉬웠으나 "돌려주나"(예/아니오로 들림)를 "얼마나·얼마나 오래"(정도 질문)로 바꿔 실제 답 형태(배당수익률+연속증가연수)와 문장 형태를 맞췄다 |
| `Q4` "망할 위험은 없나" | "이 회사가 망할 위험이 있을까?" | **유지(부정문→긍정문)** | "없나"(이중부정 위험 — "위험이 없나"에 "아니오"로 답하면 "위험이 있다"는 뜻이라 헷갈릴 수 있음)를 "있을까"로 바꿔 답의 방향을 명확히 함(전달성) |
| `Q5` "뭔가 바뀌었나" | "최근에 뭐가 바뀌었을까?" | **유지(거의 동일)** | "최근에"를 명시해 시간축(단기)이라는 성격을 문장에 살렸다 |
| `Q0` "뭐 하는 회사인가" | *(질문 목록에서 제외, 전제로 재확인)* | **재확인(변화 없음)** | `USER_QUESTIONS`§0의 논리를 독립적으로 재도출해 같은 결론 — 이미 옳았던 판단, 이번엔 문서 물려받기가 아니라 재도출로 근거가 바뀌었다(⓪-4 첫 행) |

🔑 **총평**: 5/6은 "물려받은 문구가 유효했다"(근거만 재확인에서 도출로 바뀜, ⓪-4). **1개(재무건전성)는 진짜 재검토의 실질**이었다 — 이미 있던 수요 증거가 문항 확정 단계에서 누락된 것을 이번에 되찾았다.

---

## 1-6. 🔴 영향 지목 — 실행하지 않는다

- **모델 판정**: 재무건전성 질문이 이제 독립 문항으로 명시되면서, `probe_1043`이 "방향 vs 수준" 모호함 때문에 탈락시켰던 **Novy-Marx GP/A("수익률 예측 팩터")를 재심할 필요가 있는지** 다시 열린다 — 단 `probe_1043`·`probe_1052`가 이미 GP/A는 "다른 질문"(수준·예측력이지 방향이 아님)이라고 두 번 확인해뒀으므로, 이 STEP은 **재심 필요성만 지목**하고 실제 재판정은 안 한다.
- **Layer C**: `probe_1052`가 처방한 Layer C의 "주 사용자"·"Intended Use" 문장은 질문 문구를 전제로 쓰였다(예: "보는 법을 어렵게 느끼는 사람"). 질문 문구가 이번에 구체화됐으니 그 문장에도 반영할 여지가 생겼다 — 표시 설계 단계에서 참고.
- **F-4-3 순위 · F-5 판정 대기**: 재무건전성 질문이 독립 문항으로 확정되면 F-4-3의 "재무건전성=Piotroski F-Score(4위)"라는 기존 순위 서술의 **근거 문구**(질문 정의)가 이번 STEP으로 갱신된다 — 순위 자체(4위)는 안 바뀜, 근거만 더 명확해짐.
- **`USER_QUESTIONS_2026-08-08.md`**: §2의 6문항 표 자체는 역사적 기록으로 보존하되, 이 문서(§Q 이하 "질문별 모델 선택" 섹션)가 참조하는 질문 정의는 **이 STEP의 산출물을 정본으로 갈아탄다**(다음 절 반영).
- 🔴 **여기서 재판정하지 않는다** — 위 전부 "지목"이며 실행은 각각 별도 STEP·장은태 판정.

---

## 못 한 것 / 미측정 / 철회·정정

- **못 한 것**: Simply Wall St 화면 원문 확인(Cloudflare 403으로 5곳 중 1곳 접근 불가 — 검색엔진 요약으로만 대체, §1-3에 "검증 불가"로 명시 표시했고 화면 인용으로 쓰지 않음).
- **아직 안 함**: GP/A 재심(장은태 판정 대상으로 지목만) · Layer C 문장 실제 갱신(표시 설계 범위) · 재무건전성 질문의 "방향" 강조가 화면에 실제로 어떻게 표시될지(범위 밖).
- **철회·정정**: 없음(신규 도출 — 5/6은 기존 문구를 재확인, 1/6은 실제로 새로 찾았다).
- 🔑 **§1-3에서 새로 확인된 것 — "~걸까?" 구어체 질문형 문구는 업계 관행이 아니라 우리 선택이다.** 5개 플랫폼 전부 섹션 제목이 명사구였고, 유일한 의문문(WallStreetZen FAQ)도 "얼마인가" 조회형이지 "싼가/건전한가" 판단형이 아니었다. **"업계도 이렇게 쓴다"는 근거로 문구를 정당화하면 안 된다** — 전달성 기준(1-1 §6)은 여전히 유효하지만, 그 근거를 실무 관행이 아니라 우리 판단(사용자가 실제 쓰는 말)으로 정확히 서술해야 한다.
- **미측정**: 시장내재기대(미래 가정 성장)와 성장(과거 실제 성장)의 직접 상관계수(오늘 안 잼 — `probe_1045`는 최근변화와의 상관만 쟀음) · "망할 위험" 질문의 ②(값을 안 매기는가) 통과 여부 재검증(근거 없음으로 남김) · 재무건전성 질문 문구의 사용자 테스트 · MarketBeat FAQ 개별 질문 문장(상위 헤더만 확보) · Simply Wall St 화면 원문 · 5개 사이트 각각의 robots.txt 개별 조회(1회성 종목상세 페이지 열람이라 크롤링 정책 위반 소지는 낮다고 판단했으나, 파일 단위로 직접 확인하지는 않았다).

🔴 **판정 금지 — GP/A 재심 여부·Layer C 문장 갱신·망할위험 질문의 ②재검증은 전부 장은태 판정 대상이며 이 STEP은 지목까지다.**
