<!-- 취득일 2026-08-02 · Cowork 조사(STEP 866 착수 전) -->
# 외부 3주체의 **유니버스 규칙** 원문 발췌

> 🔴 **성격**: 이 파일은 **발췌**다. 원본을 대신하지 못한다(규칙 ⓪).
> 🔴 **원본 PDF·HTML 저장은 미완** — `data/sources/README.md` "미저장" 항목 참조. Claude Code가 내려받아야 한다.
> 🔴 **왜 만들었나**: 역DCF 유니버스는 **원전에 없는 우리 추가물**이다(원전 튜토리얼 02·08에 `liquidity`·`volume`·`universe`·`screening` **0건** — 개봉 확인). 그래서 근거를 밖에서 가져와야 하고, **밖이 서로 다르다**는 사실 자체가 설계 재료다.

---

## 1. New Constructs — **지수 사다리 + 거래량**

출처: `data/sources/text/newconstructs_coverage_methodology.html` (로컬 보관본 · 2022-07-19 · Kyle Guske II)

> We add companies to coverage based on their membership in the following indexes prioritized in the order presented. S&P 500 · S&P 400 · S&P 600 · Russell 3000
> This means we prioritize adding a company we currently do not cover from the S&P 500 to coverage before adding a company from the Russell 3000.
> Companies are further prioritized by average daily volume. Companies with the largest 3-month average daily volume in each index are added to coverage first.

🔴 **"왜 사다리인가"에 대한 서술 = 0건.** 문서 전체를 재수색해 확인했다(`why`·`analyst`·`priorit` 검색).
🔴 **따라서 이유를 추정해 인용하지 말 것.** (2026-08-02(2) 위반: Cowork이 "애널리스트 손이 한정돼서"라고 지어냄 → 철회)
- 커버리지 규모 = **2,748사**(2022-03-14 기준 · 🔴 우리 저장본 본문에는 이 수치가 없다 — 라이브 페이지에서만 확인).
- 🔴 **원본에서 확인되는 제외 사유는 하나뿐**: *"Companies with no revenue in the current period are not added to coverage."*
- 🔴 **정정(866B)**: 앞서 적혀 있던 *"OTC"* · *"주식구조 복잡(주식수 신뢰 불가)"* 두 항목은 **우리 저장 원본에도 라이브 페이지에도 없다.** 출처 불명이므로 **철회한다.** (2026-08-02(2) *"애널리스트 손이 한정돼서"* 날조와 같은 파일 · 그때 이유만 지우고 목록은 안 고쳤다.)
- 🔴 따라서 **`MULTI_CLASS_SHARES` 5사가 "NC와 같은 사유"라는 주장도 철회한다.** 근거가 없었다.
- 🔴 **저장본 불완전 의심**: 본문 8,163자에 커버리지 수치조차 없다. **전체 페이지를 다시 저장해야 한다**(아래 2단계).

---

## 2. Morningstar Quantitative Equity Ratings — **유동성 하한만**

출처: `Morningstar Quantitative Equity Ratings Methodology`, Dec. 2, 2024
URL: `https://s205.q4cdn.com/437373358/files/doc_downloads/methodology_documents/Quantative-Equity-Research-Effective-2-Dec-2024.pdf`
원본 PDF: `data/sources/external/morningstar_quant_methodology_2024-12-02.pdf`(813KB · 2026-08-02 확보)

> We exclude illiquid stocks and listed companies with a **median daily traded value below 5,000 in their local currency over the last 60 days**. This step ensures the inclusion of companies with adequate liquidity and trading activity, **helping to mitigate potential inaccuracies and biases in the model**.

- 🔑 **지수 무관.** 유동성 하한 하나뿐이고, **이유를 명시**한다(모델 부정확·편향 완화).
- 문턱 수준: 현지통화 5,000/일 → 미국 상장사에겐 **사실상 걸리지 않는 문턱**.
- 커버리지 = 전세계 **약 40,000사** · 그중 **미국 소재 4,379사**(Appendix D). 우리 604와 비교 기준.
- 🔑 **값이 이상하면 빼지 않고 라벨을 붙인다** — 우리 "판정 불가" 버킷과 같은 발상:
  - `Not Rated` = 종가가 **30일 이상 정체**
  - `Under Review` = 기업 이벤트 발생 / 종가 7~30일 정체 / **quantitative fair value ÷ price 가 0.25~4 범위 밖**
- 🔴 **주의(정의 차이)**: 이 문서의 밸류에이션은 **DCF가 아니라 gradient boosting으로 애널리스트 P/FV를 모사**하는 것이다(입력 61개·트리 300개·out-of-sample R² 약 24~35%). **유니버스 규칙만 참고 대상이고, 밸류에이션 방법은 우리와 무관**하다.

---

## 3. Aswath Damodaran — **컷 없음 (전 상장사 유지)**

출처: `Data Update 1 for 2026` (`aswathdamodaran.blogspot.com`) · `Useful Data Sets` (`pages.stern.nyu.edu/~adamodar/New_Home_Page/data.html`)
로컬 관련 원본: `data/sources/damodaran/indname.xls` (48,156사)

> 표본 편향(sampling bias)을 줄이기 위해 **주가가 0을 초과하는 모든 상장기업**을 표본에 포함한다 — 총 **48,156사**.
> 공시 요구가 회사마다 달라 결측 변수가 생기지만, **그 기업들을 표본에서 제외하지 않고 유니버스에 남기되, 결측이 아닌 기업에 대해서만 값을 보고한다.**

- 🔑 **유동성 스크린 없음.** 큰 기업·유동성 높은 기업으로 표본을 좁히면 생기는 **편향을 피하려는 것**이 명시된 이유.
- 갱신 = 매년 1월 첫 2주(현 보관본 2026-01-05 기준 · 최신 업데이트 2026-01-09).
- 🔑 **우리가 이미 이 사람의 데이터를 쓴다.** 재료 제공자 본인이 "제외 대신 결측 표시"를 하고 있다.

---

## 4. 개인용 역DCF 계산기 — **유니버스 개념 자체가 없음**

GuruFocus · TIKR · StockInvestorIQ · Acquirer's Multiple 등은 전부 **종목 하나를 넣고 돌리는 계산기**다.
"어떤 종목을 담을까"라는 문제가 발생하지 않는다. 🔴 **대조 대상 아님.**

---

## 🔴 정리 — 이 표가 866의 출발점

| 주체 | 유니버스 규칙 | **밝힌 이유** | 규모 |
|---|---|---|---|
| New Constructs | 지수 사다리 + 3개월 평균거래량 순 | 🔴 **없음** | 2,748 |
| Morningstar Quant | 유동성 하한(현지통화 5,000/일·60일 중앙) | 모델 편향 완화 | ~40,000 (US 4,379) |
| **Damodaran** | **컷 없음** | **표본 편향 방지** | 48,156 |
| 개인 계산기 | 해당 없음 | — | 1 |
| **원전(EI)** | **해당 없음 — 단일 종목 분석서** | — | 1 |
| 🔴 **우리(현행)** | 물려받은 1,000 → 616 → 604 + **FALR ≥ 0.75(문서에만 존재·코드 없음)** | — | **604** |

🔴 **"지수 사다리 = 업계 표준"은 거짓이다.** 그렇게 하는 곳은 NC 하나이고 이유도 안 밝힌다.
🔴 **FALR ≥ 0.75는 우리가 만든 규칙이다.** S&P 지수 편입 기준에서 빌려왔으나, **역DCF 문헌에도 위 3주체 어디에도 근거가 없다.** 그리고 **코드에 구현된 적이 없다**(`lib/revdcf/`·`scripts/` grep 결과 0건).
