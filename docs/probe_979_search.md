<!-- STEP 979 착수 전 검색 — 3중 규칙: ①-A 3회 + ①-B 3회를 먼저 하고 기록한다. 🔴 이 STEP의 성패는 ①-A 2번(음수 처리)에 달렸다. -->

# STEP 979 — 업종 대비 계산방식 교체 사전 실측 · 검색 기록

## ①-A 원전 — 최소 3회

### 1. 비교 결과의 형태(배율 vs 차이 vs 회귀잔차)

`relval.pdf`(47p) 전문 검색: "times the"·"percent higher/lower"·"regression residual" 전부 **0건**. 실제 표현은 정성적("is under or over valued, **relative to** your comparable group" · "looks very cheap on a Value/EBITDA multiple basis, **relative to** the rest of the sector") — 슬라이드 원문에 숫자 비교표(예: Ryder System 트럭업종 비교)가 있으나 **차트/이미지 형태**라 pdftotext로 텍스트가 안 뽑힌다.
🔴 **못 찾음** — 원전이 배율·차이·잔차 중 무엇을 최종 산출물로 내는지 relval.pdf만으로는 확정 못 한다. 억지로 결론내지 않는다.

### 2. 🔴 음수·극단값 처리 — 이 STEP의 핵심 질문

**relval.pdf·pbv.pdf·ps.pdf(972·975가 이미 확보) 전문에 "negative" 0건** — 슬라이드 요약자료엔 음수 처리 서술이 없다.

**`data/sources/damodaran_multiples/{pedata,pbvdata,psdata,vebitda}.xls`의 "Variables & FAQ" 시트(원본 엑셀 직접 열람, xlrd)**:
- **PE(`pedata.xls`)**: *"% of Money-losing firms | Percent of firms in group with negative trailing earnings **(and PE ratios that are not meaningful)**"* / *"Current PE | … averaged across **all money-making firms** in the group."* → **적자기업은 업종 평균 계산에서 명시적으로 제외되고, 제외 비율 자체를 별도 통계로 공개한다.**
- **PBV·PS·EV/EBITDA(`pbvdata`·`psdata`·`vebitda.xls`)**: FAQ 시트(8행 전량 확인)에 "negative"·"money-losing" 상당 행이 **없다** — PE만큼 명시적이지 않음(1차 확인, 아래 3차 확인으로 보강됨).

**🔑 textbook 원문(`ch19.pdf`, Investment Valuation 2nd ed. Chapter 19 "Book Value Multiples" — xls FAQ보다 훨씬 상세, 직접 pdftotext 전문 확보)**:
> *"even firms with negative earnings, which cannot be valued using price-earnings ratios, can be evaluated using price-book value ratios; there are far fewer firms with negative book value than there are firms with negative earnings."*
> *"there are firms with negative book values of equity … where price to book ratios **cannot be computed**. In this sample of 5903 firms, there were **728 firms** where this occurred. In contrast, **2045 firms** had negative earnings and PE ratios could not be computed for them."*
> (Value/Invested-Capital 대안 관련) *"the value to book ratio can be computed even for firms that have negative book values of equity and is thus **less likely to be biased**."*

**웹검색으로 4축 전체에 일반화되는 원칙 확인**(Damodaran "Multiples: First Principles" 논문 + Investment Valuation 교재 인용, 검색 요약):
> *"With every multiple, there are firms for which the multiple cannot be computed. When the earnings per share are negative, the price-earnings ratio for a firm is not meaningful and is usually not reported… When looking at the average price earnings ratio across a group of firms, the firms with negative earnings will all drop out of the sample because the price earnings ratio cannot be computed. The fact that the firms that are taken out of the sample are the firms losing money creates a bias in the selection process… this same issue applies to firm value to EBITDA multiples… revenue multiples are available even for the most troubled firms… the potential for bias created by eliminating firms in the sample is far lower [for PSR]."*

🔑 **결론(①-A-2) — ⓐ. 원전에 명확한 처리 규칙이 있다: 분모가 음수/무의미하면 그 기업을 표본에서 뺀다("cannot be computed"), 계산하지 않는다. 동시에 이게 표본선택 편향(부실기업이 체계적으로 빠짐)을 만든다는 것도 원전 스스로 인정한다 — "고치지 않고 인정하고 넘어간다."**

🔴 **우리 코드(`lib/valuation.ts`, 확인 완료)가 이미 정확히 이 규칙이다** — PER `NEGATIVE_EARNINGS`, PBR `NEGATIVE_EQUITY`, PSR `NEGATIVE_REVENUE`, EV/EBITDA `NEGATIVE_EBITDA` 전부 "계산 안 함(null)"으로 이미 구현돼 있다(963·975 이전부터). **이 부분은 백분위→중앙값 전환과 무관하게 이미 원전과 일치 — 새로 지어낼 규칙이 없다.**

### 3. 표본 하한(minSample)에 대한 원전 서술

`ch19.pdf` 실측 수치(5,903개사 표본, 하한 언급 없이 전수 사용) — **"몇 개 이상이어야 업종 평균/중앙값을 낸다"는 하한 기준 자체가 원전에 없다.** `relval.pdf` slide 142도 "Number of firms in the industry grouping — Law of large numbers?"라고만 적어 정성적 언급뿐, 숫자 하한 없음.
🔴 **못 찾음** — minSample=20은 952에서 우리가 만든 값 그대로 유지해도 되고(원전이 반박하지 않음), 원전 근거로 다른 값을 댈 수도 없다.

---

## ①-B 타 플랫폼 — 최소 3곳 (978에서 성공한 stockanalysis.com·WallStreetZen·MarketBeat 우선 재사용)

| 확인 항목 | stockanalysis.com | WallStreetZen | MarketBeat |
|---|---|---|---|
| 비교 숫자 형태 | (978: 업종비교 자체 없음, 페이지에 없음) | **원시값 병기**("P/E vs Industry: 35.81x vs 31.6x") — 배율·%차이를 따로 계산해 보여주지 않음, 독자가 암산 | **문장형**("less expensive… than the Finance sector average of about 29.19") — 마찬가지로 원시값 병기, 배율·%차이 미제시 |
| 이상치 절삭(winsorize) 여부 | 방법론 문서 못 찾음 | 방법론 문서 못 찾음 | 방법론 문서 못 찾음 |
| 적자기업 표시 | 972: "n/a" | 972: "N/A" | (미확인, 978에서 조회 안 함) |

🔑 **3곳 다 "배율" 또는 "%차이"를 명시적으로 계산해 보여주지 않는다 — 원시값 두 개를 나란히 두고 독자가 판단하게 한다.** 이건 972·978에서 이미 확인된 사실의 재확인이며, 이번에 새로 조회하지 않았다(A-0 재사용 원칙, 966·968·969·972·978에서 이미 5회 이상 반복 차단·확인된 패턴을 또 시도하지 않음).

---

## 종합 — ④ 결론으로 넘어가는 다리

①-A-2(음수 처리)는 **찾았다.** 원전 = "제외"(우리도 이미 그렇게 함, 전환 무관). ①-A-1(비교 형태)·①-B(실무 형태)는 **원시값 병기가 실무 표준**이라는 정황은 있으나 "배율"이 명시적으로 원전·실무 어디에도 계산되어 보여지지 않는다 — 즉 **배율이냐 %차이냐는 원전에서 못 정하고, 우리가 정해야 하는 부분**(규칙 5-1 트랙, 952의 백분위와 같은 처지 — "원전 없음"을 그대로 공개하고 우리가 하나를 고정한다).
