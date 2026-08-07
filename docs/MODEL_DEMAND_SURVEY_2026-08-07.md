<!-- 2026-08-07 · Cowork 조사 · 🔴 초안(비번호) — STEP 번호는 장은태가 부여 -->

# 수요 상위 20 모델 재조사 — 원본 대조본

> **목적**: 2026-07-30에 있었던 "사람들이 가장 많이 원하는 모델" 조사의 산출물이 저장소에 남지 않았다.
> 그 리스트를 **기억으로 복원하지 않고 다시 조사**한다.
> **왜 이 조사였나(장은태 2026-08-07)**: *"TR-AI 렌즈라는 걸 만들었지만 이게 정확한 정보를 주는 게 아니라는 게 확인됐고, 그로 인해 제대로 된 모델 1개를 먼저 만들어서 내놓자. 그럼 어떤 걸 만들어야 할까? 그래서 리스트업을 해서 찾았던 거야."*
> **즉 기존 7렌즈가 사실은 수요 상위 7이 아니었다는 것이 이 조사의 출발점이다.**

---

## §0. 기준 — 🔴 조사 **전에** 선언하고 고정했다

결과를 보고 기준을 고르면 조작이다. 아래는 검색 결과를 보기 전에 정한 것이며, 조사 중 한 번 바뀌었다. 바뀐 사유를 명시한다.

### 0-1. 변경 이력 (투명 기록)

| 시각 | 기준 | 사유 |
|---|---|---|
| 최초 | 1차 순위 = **제공 플랫폼 수** | Cowork 판단 |
| 정정 | 1차 순위 = **수요** | 🔴 **장은태 정정** — 목적이 "공급 조사"가 아니라 "수요 1등 찾기"였음. **결과를 보고 바꾼 것이 아니라 목적이 정정되어 바꿨다.** |

### 0-2. 수요를 무엇으로 재는가

🔴 **직접적인 수요 순위(검색량·설문)는 이 조사에서 측정하지 못했다.** §5 참조.

측정 가능했던 것은 **간접 지표 두 개**뿐이며, 🔴 **둘을 하나의 점수로 합치지 않는다.**

| 축 | 무엇을 재나 | 왜 수요의 증거인가 | 한계 |
|---|---|---|---|
| **A. 유료 플랫폼 채택** | 돈 받고 파는 사업자가 실제로 그 모델을 싣고 있는가 | 사업자는 팔리는 것을 만든다 — **지불된 수요의 흔적** | 공급 측 관찰이다. 수요 자체가 아니다 |
| **B. 무료 계산기 밀도** | 그 모델 전용 무료 계산기가 얼마나 널려 있는가 | 수요가 없으면 계산기가 안 생긴다 | SEO 목적 페이지가 섞인다 |

**우리 정의 통과 여부는 별도 열이다.** 인기와 적합을 한 점수로 섞지 않는다.

### 0-3. 조사 방향 — 역방향 금지

🔴 `"가장 인기 있는 밸류에이션 모델 순위"`로 검색하면 SEO 블로그가 나오고 근거가 되지 않는다(실제로 시도했고 그렇게 나왔다).
→ **플랫폼을 먼저 열거하고, 각 플랫폼이 실제로 무엇을 싣는지 원문 페이지로 확인**하는 방향으로만 조사했다.

---

## §1. 수요 상위 20 (축 A + 축 B)

**등급 표기**: ●●● = 조사한 주요 플랫폼 대부분 · ●●○ = 다수 · ●○○ = 소수·틈새

| # | 모델 | A. 유료 플랫폼 채택 | B. 무료 계산기 | 확인된 채택처(원문 확인분) |
|---|---|---|---|---|
| 1 | **적정주가 / 내재가치 (Fair Value)** | ●●● | ●●● | Morningstar FVE · Simply Wall St · Alpha Spread · Stock Rover · GuruFocus(GF Value) · ValueInvesting.io · TIKR · Finbox |
| 2 | **DCF (정방향 현금흐름 할인)** | ●●● | ●●● | Alpha Spread · GuruFocus · Stock Rover · Simply Wall St(2-stage) · ValueInvesting.io · Finbox · MiniValuator · Wisesheets |
| 3 | **밸류에이션 배수 (PER·PBR·PSR·EV/EBITDA·PEG)** | ●●● | ●●● | Finviz · Alpha Spread(Relative Valuation) · TIKR · 사실상 전 스크리너 |
| 4 | **애널리스트 목표주가 / 컨센서스** | ●●● | ●●○ | GuruFocus Ratings · Seeking Alpha Price Target · TIKR · Simply Wall St |
| 5 | **배당 분석 / 배당할인모형(DDM)** | ●●● | ●●● | Simply Wall St(DDM 명시) · Finbox(dividend discount) · Fidelity 교육 |
| 6 | **퀀트 종합 랭킹 (등급 하나로)** | ●●● | ●○○ | Zacks Rank · Seeking Alpha Quant · Stockopedia StockRank · Value Line Timeliness · Ziggma |
| 7 | **재무건전성 스코어 (수익성·안정성)** | ●●● | ●●○ | Alpha Spread(profitability·solvency·efficiency scores) · Simply Wall St(Health) |
| 8 | **🔴 역DCF / 시장 함의 기대치** | ●●○ | ●●● | **GuruFocus(Reverse DCF 명시)** · **New Constructs(전용 상품)** · SEC Diver · 독립 계산기 다수 |
| 9 | **그레이엄 넘버 / 안전마진** | ●●○ | ●●● | GuruFocus(Graham Number Calculator) · 다수 무료 계산기 |
| 10 | **Piotroski F-Score** | ●●○ | ●●● | Finbox 스크리너 · Quant-Investing · Old School Value · ValueSense · MarketInOut |
| 11 | **시나리오 밸류에이션 (Bear/Base/Bull)** | ●●○ | ●○○ | Alpha Spread(명시) · ValueInvesting.io(growth-exit 5Y) |
| 12 | **Altman Z-Score (부도 위험)** | ●●○ | ●●● | 다수 스크리너·계산기 |
| 13 | **PEG / 피터린치 밸류** | ●●○ | ●●○ | GuruFocus(Peter Lynch Chart) |
| 14 | **Owner Earnings (버핏식)** | ●○○ | ●●○ | GuruFocus(term) · MarketXLS 템플릿 · StableBread |
| 15 | **Magic Formula (Greenblatt)** | ●○○ | ●●○ | 전용 사이트·다수 스크리너 |
| 16 | **Beneish M-Score (분식 탐지)** | ●○○ | ●●○ | 일부 스크리너 |
| 17 | **Residual Income / EVA** | ●○○ | ●●○ | CFA 커리큘럼 · WallStreetPrep · 계산기 다수 · **리테일 플랫폼 채택 낮음** |
| 18 | **EPV (Greenwald 수익력가치)** | ●○○ | ●○○ | 제한적 |
| 19 | **Net-Net / 청산가치 (그레이엄 NCAV)** | ●○○ | ●●○ | 딥밸류 틈새 스크리너 |
| 20 | **CFROI (HOLT식)** | ●○○ | ○○○ | **UBS HOLT — 기관 전용·유료. 리테일 채택 0** |

**후보였으나 20에 못 든 것**: Rule of 40(SaaS 한정 · LevelFields) · SOTP(수동 · 자동화 사례 거의 없음) · 몬테카를로 밸류에이션(소수) · 기술적 지표 RSI·이동평균(모델이 아니라 지표라 축 자체가 다름)

---

## §2. 🔴 우리 정의 대조 — 인기와 **합치지 않는다**

관문 5개. 전부 `BRAND_IDENTITY.md` 3기둥과 `CLAUDE.md` 🚫창작 금지에서 나온 것이지 이번에 만든 게 아니다.

| 관문 | 출처 |
|---|---|
| ① **우리가 매기지 않는가** (자립) | *"추천하지 않는다. 분석은 우리가, 판단·경쟁은 당신이"* |
| ② **원전이 공개돼 대조 가능한가** (직시) | *"원전에 없는 산출물을 추가하지 않는다"* |
| ③ **블랙박스가 아닌가** | *"어설픈 다수 금지 — 원전 대조 불가 항목은 쓰지 않는다"* |
| ④ **2,000종목 매일 자동화 가능한가** (무기) | *"해자는 계산식이 아니라 자동화 + 분포"* |
| ⑤ **무료·공개 데이터로 되는가** | *"정확한 구현 + 자동화 + 무료·저가 제공"* |

| # | 모델 | ① 안 매김 | ② 원전 공개 | ③ 비블랙박스 | ④ 자동화 | ⑤ 무료 | 판정 |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| 1 | 적정주가 | 🔴 **X** | △ | △ | ✅ | ✅ | 🔴 **①에서 탈락 — 우리가 값을 매기는 행위** |
| 2 | DCF 정방향 | 🔴 **X** | ✅ | ✅ | ✅ | ✅ | 🔴 ①에서 탈락. **단 역DCF의 앞부분으로 필요** |
| 3 | 배수 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 통과 — 🔴 **다만 원전이라 부를 저작이 없다**(관행) |
| 4 | 애널리스트 목표주가 | ✅ | 🔴 **X** | 🔴 **X** | △ | 🔴 **X** | 🔴 남의 예측 재판매. *"남의 말이 아니라 직접 보고"* 정면 위반 |
| 5 | 배당/DDM | 🔴 **X** | ✅ (Gordon) | ✅ | ✅ | ✅ | 🔴 ①에서 탈락(값을 매김) |
| 6 | 퀀트 종합 랭킹 | 🔴 **X** | 🔴 **X** | 🔴 **X** | ✅ | 🔴 **X** | 🔴 **Zacks·Value Line 자기 문서에 "proprietary" 명시** |
| 7 | 재무건전성 스코어 | ✅ | 🔴 **X** | 🔴 **X** | ✅ | ✅ | 🔴 플랫폼 자체 조합식 — 원전 없음 |
| 8 | **역DCF** | ✅ | ✅ **Rappaport·Mauboussin 스프레드시트 무료 공개** | ✅ | ✅ | ✅ | 🟢 **5관문 전부 통과** |
| 9 | 그레이엄 넘버 | ✅ | ✅ (『증권분석』) | ✅ | ✅ | ✅ | ✅ 통과 |
| 10 | Piotroski F | ✅ | ✅ (2000 논문) | ✅ | ✅ | ✅ | ✅ 통과 — 🔴 **이미 우리 7렌즈에 있음** |
| 11 | 시나리오 | ✅ | △ | ✅ | ✅ | ✅ | △ 역DCF의 부속 기능 |
| 12 | Altman Z | 🔴 **X**(부도 예측) | ✅ (1968) | ✅ | ✅ | ✅ | 🔴 **예측물 — 비예측 원칙 위반** |
| 13 | PEG/린치 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 통과(얕음) |
| 14 | Owner Earnings | ✅ | △ (버핏 주주서한) | ✅ | ✅ | ✅ | △ 정의가 서술적이라 구현마다 갈림 |
| 15 | Magic Formula | 🔴 **X**(순위=추천) | ✅ | ✅ | ✅ | ✅ | 🔴 사실상 종목 추천 |
| 16 | Beneish M | 🔴 **X**(분식 예측) | ✅ (1999) | ✅ | ✅ | ✅ | 🔴 예측물 + 명예훼손 위험 |
| 17 | Residual Income/EVA | 🔴 **X** | ✅ | ✅ | ✅ | ✅ | 🔴 ①에서 탈락 |
| 18 | EPV | 🔴 **X** | ✅ | ✅ | ✅ | ✅ | 🔴 ①에서 탈락 |
| 19 | Net-Net | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 통과 — 🔴 **적용 종목이 극소수** |
| 20 | CFROI | 🔴 **X** | 🔴 **X** | 🔴 **X** | 🔴 **X** | 🔴 **X** | 🔴 전 관문 탈락(기관 유료·30년 회계조정) |

---

## §3. 이 표가 실제로 말하는 것

### 3-1. 🔴 수요 상위 7과 우리 7렌즈는 거의 겹치지 않는다

| 수요 상위 7 | 우리 7렌즈에 있나 |
|---|---|
| 1 적정주가 | ❌ |
| 2 DCF | ❌ |
| 3 배수(PER/PBR) | 🔺 **밸류 렌즈가 부분적으로** |
| 4 애널리스트 목표주가 | ❌ |
| 5 배당 | ❌ |
| 6 퀀트 종합 랭킹 | ❌ |
| 7 재무건전성 스코어 | 🔺 **F-스코어가 부분적으로** |

**우리 7렌즈**: 모멘텀 · 밸류 · 퀄리티 · F-스코어 · 저변동성 · 자산성장 · 기술(RSI)
→ 🔴 **7 중 5가 학술 팩터(이상현상)다.** 수요 20에서 팩터 계열은 F-스코어(10위) 하나뿐이고, 모멘텀·저변동성·자산성장·퀄리티는 **20위 안에 들지 못했다.**

🔑 **7렌즈는 "사람들이 찾는 것"이 아니라 "논문에 있는 것"에서 뽑혔다. 장은태의 진단이 이 표로 확인된다.**

### 3-2. 🔴 수요 1~7위는 대부분 우리 정의에 걸린다

1·2·5위는 **우리가 값을 매기는 행위**라 자립 기둥 위반. 4위는 **남의 예측 재판매**라 직시 위반. 6·7위는 **블랙박스**.

🔑 **그래서 "수요 1등을 그대로 만든다"가 애초에 불가능하다.** 수요가 큰 자리는 대부분 *"우리가 답을 준다"*는 형태이고, 우리 정의는 그걸 금지한다.

### 3-3. 역DCF의 위치 — 🔴 방어하지 않고 그대로 적는다

- **수요 순위: 8위.** 1등이 아니다.
- **다만 수요 8위 안에서 5관문을 전부 통과하는 유일한 항목이다.**
- 통과한 다른 것들(9 그레이엄넘버 · 10 F스코어 · 13 PEG · 19 Net-Net)은 전부 **얕거나(한 줄 계산) 적용 종목이 극소수**다.

🔑 **정확히 말하면 역DCF는 "수요 1등"이 아니라 "수요가 큰 것들 중 우리 정의를 통과하는 가장 깊은 것"이다.**

그리고 **1위 적정주가·2위 DCF와 역DCF의 관계가 핵심이다** — 역DCF는 수요 1·2위와 같은 계산을 쓰면서 **마지막 한 걸음만 반대로 돌린 것**이다. 값을 내놓는 대신 값을 되묻는다. 수요가 가장 큰 자리에 서면서 정의를 어기지 않는 유일한 형태다.

---

## §4. `CLAUDE.md:43` 처리 판단 재료

현재 문장: *"이미 세상에 존재하고 **사람들이 가장 많이 원하는 모델**을 원전과 똑같이 구현한다."*

| 선택지 | 이 조사가 뒷받침하나 |
|---|---|
| 그대로 둔다 | 🔴 **아니다.** 역DCF는 수요 8위지 1위가 아니다 |
| 수식어를 뺀다 | ✅ 사슬이 그대로 성립한다 |
| 정확히 고쳐 쓴다 | ✅ 예: *"수요가 큰 모델 중 우리 정의를 통과하는 것"* |

🔴 **판정은 장은태.** Cowork은 재료만 낸다.

---

## §5. 🔴 못 잰 것 (반드시 함께 읽을 것)

| 항목 | 왜 못 쟀나 |
|---|---|
| **검색량 순위** | Google Trends·Ahrefs·Semrush 전부 접근 불가. **위키미디어 조회수 API는 도메인 차단(cache-only)** — 시도했고 실패했다 |
| **실사용자 설문** | *"사람들이 가장 많이 쓰는 밸류에이션 모델"* 순위를 낸 공신력 있는 설문을 **찾지 못했다**. 검색 결과가 전부 SEO 블로그였다 |
| **플랫폼별 사용자 수** | 대부분 비공개. **규모 가중을 하지 않은 이유가 이것** |
| **원본 HTML 저장** | 🔴 **규칙 ⓪ 미이행.** WebFetch가 마크다운 변환본만 반환해 raw HTML을 `data/sources/`에 못 넣었다. **URL과 조회일자만 남긴다** |
| **07-30 원본 리스트와의 대조** | 원본이 없어 **불가능**. 이 리스트가 그때 것과 같은지 다른지 확인할 방법이 없다 |

**따라서 이 표의 순위는 "수요 순위"가 아니라 🔴 "지불된 수요의 흔적 + 무료 계산기 밀도로 본 근사 순위"다.** 그 이상으로 읽지 말 것.

---

## §6. 출처 (조회일 2026-08-07)

- Alpha Spread — https://www.alphaspread.com/
- ValueInvesting.io — https://valueinvesting.io/
- Stock Rover Fair Value(DCF) — https://www.stockrover.com/metrics/fair-value-dcf-model/
- Simply Wall St 밸류에이션 방법론 — https://support.simplywall.st/hc/en-us/articles/4751563581071-Understanding-the-Valuation-section-in-the-company-report
- GuruFocus DCF·Reverse DCF 계산기 — https://www.gurufocus.com/dcf-calculator
- New Constructs 역DCF — https://www.newconstructs.com/how-new-constructs-discounted-cash-flow-model-works/
- Morningstar Equity Research Methodology (PDF) — https://www.morningstar.com/content/dam/marketing/shared/research/methodology/705988Morningstar_Equity_Research_Methodology.pdf
- Value Line Ranking System — https://www.valuelinepro.com/ranking-system
- Finbox Models — https://help.finbox.com/hc/en-us/articles/4405871283729-Working-With-Financial-Models
- 무료 밸류에이션 도구 비교 — https://minivaluator.com/blog/best-free-stock-valuation-tools

### 🔴 원문에서 직접 확인한 결정적 문구

- **Morningstar**: *"proprietary discounted cash flow, or DCF, modeling templates"* — 프레임워크는 공개, **개별 종목 재현은 불가**
- **Value Line**: *"uses a proprietary formula"* — 공식 비공개
- **New Constructs**: *"The right way to use DCF models is not try to predict the future, but to quantify the future that the stock price is predicting."* — 🔑 **역DCF 상품이 이미 존재하고, 그 설명이 우리 한 줄과 사실상 같다**
- **Stock Rover**: DCF 사용은 공개하나 결합 공식은 비공개
- **Simply Wall St**: 공식과 워크스루는 공개, **가정·데이터 출처는 일부 비공개**

🔑 **8위 안에서 "완전히 열려 있는" 것은 역DCF(Rappaport·Mauboussin이 스프레드시트를 무료 공개)와 그레이엄 넘버뿐이다.** 이것이 이 조사에서 가장 단단한 사실이다.
