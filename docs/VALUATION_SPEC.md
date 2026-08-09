<!-- 2026-08-08 · STEP 947 신설 -->
# Q1 밸류에이션 4축(PER·PBR·PSR·EV/EBITDA) — 정의 공개표

> 규칙 5-1의 「정의 공개표」다. 원전 대조표를 만들 원전이 없는 항목이라 **정의를 고정하고 공개하고 원자료에서 직접 계산하고 손계산으로 검산하고 성립하지 않는 경우를 명시**하는 것으로 대체한다.
> 코드의 유일한 정의 출처 = `lib/valuation.ts`의 `VALUATION_SPEC` 객체(규칙 5-2 ⑤ — 문서·코드가 같은 것을 가리킨다). 이 문서의 식·미성립조건은 그 객체와 **글자 그대로 일치**해야 한다(`lib/valuation.test.ts`가 고정).

## 🔴 원전 없음

Q1의 최심층 축(역DCF)은 원전(Rappaport & Mauboussin, *Expectations Investing*)이 있지만, **배수 4종(PER·PBR·PSR·EV/EBITDA)은 원전이 없다.** 실측(2026-08-08, `data/sources/text/EI_tutorial_0{2..8}.html` + `EI_tutorial_index.html` 전 8편 직접 grep):

| 검색어 | 등장 횟수 |
|---|:--:|
| `P/E` | **0** |
| `price-to-book` / `price/book` | **0** |
| `price-sales` / `price/sales` | **0** |
| `EBITDA` | **1**(`EI_tutorial_06_cashtaxrate.html`) |

원전은 배수를 **부정하지 않는다** — 오히려 *"배수는 DCF의 축약인데 동인(driver)을 가린다"*는 입장이며(Q1 C안 채택 근거, `USER_QUESTIONS §Q Q1`), 배수 자체의 계산식·기간·미성립 조건을 규정하지 않는다. 그래서 이 넷은 **회계 관행**이고, 관행을 하나로 고정하고 공개하는 것이 이 문서의 역할이다.

## 정의 — `lib/valuation.ts`의 `VALUATION_SPEC`과 동일

| 축 | 식 | 기간 | 미성립 조건 |
|---|---|---|---|
| **PER** | `marketCap / netIncomeAvailableToCommon` | **연간(FY) 고정**(장은태 판정 2026-08-08 — 분기 TTM은 이 STEP 범위 밖) | `netIncome <= 0` · `netIncome == null` |
| **PBR** | `marketCap / commonEquity` | 최신 회계연도(FY) | `equity <= 0` · `equity == null` |
| **PSR** | `marketCap / revenue` | 최신 회계연도(FY) | `revenue <= 0` · `revenue == null` |
| **EV/EBITDA** | `(marketCap + debt - nonOperatingAssets) / (operatingIncome + dna)` | 최신 회계연도(FY) | `ebitda <= 0` · `operatingIncome == null` · `dna == null` · 🔴 **`debt == null` 또는 `nonOperatingAssets == null`**(아래 "코드가 스펙보다 넓힌 것" 참조) |

🔴 **STEP 963(2026-08-09, 장은태 위임→Cowork 판정) — PER·PBR을 보통주 기준으로 확정.** 아래 태그표가 갱신된 버전. 근거·영향 실측 = 검증 절 STEP 963 항목.

**분자(공통) 출처** — `us_market_cap.market_cap`(최신 `as_of`, US 크론이 매일 갱신). 5-5 확정대로 **주가에서 시총을 역산하지 않는다** — `market_cap`을 그대로 쓴다.

**분모 출처 — SEC XBRL `us-gaap` 태그(`lib/revdcf/drivers.ts`의 `NET_INCOME`·`EQUITY`·`PREFERRED`·`NCI`, 기존 `REV`·`OperatingIncomeLoss`·D&A 체인 재사용)**

| 필드 | 태그(우선순위 — coalesce, 첫 매치 채택) | 비고 |
|---|---|---|
| `netIncome`(PER 분모) | 🔴 **`NetIncomeLossAvailableToCommonStockholdersBasic` → `NetIncomeLoss` → `ProfitLoss`**(963, 순서 변경) | flow(연간) · GAAP EPS 정의(FASB ASC 260) 자체가 보통주 귀속 순이익이라 1순위로 승격 — 태그 있는 해만 적용, 없는 해는 자동 폴백 |
| `equity`(총자기자본, 그대로 저장) | `StockholdersEquity` → `StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest` → `CommonStockholdersEquity` | stock(시점) · 무변경 |
| 🔴 `commonEquity`(PBR 분모, 963 신규) | `equity` − (2번째 태그일 때만 `MinorityInterest`) − `PreferredStockValue`(계열) | `us_fundamentals.common_equity`에 별도 저장 — `equity`는 안 건드림 |
| 🔴 `preferredStock`(963 신규) | `PreferredStockValue` → `PreferredStockValueOutstanding` | 없으면 0으로 간주하되 `flags.preferredStockUnknown`으로 "없음"과 "태그누락"을 구분 |
| 🔴 `minorityInterest`(963 신규) | `MinorityInterest` | `equity`가 NCI포함 태그일 때만 차감·태그 없으면 `flags.commonEquityNciNotSubtracted` |
| `revenue` | 기존 역DCF `REV` 4종 태그(항등식 선택, `drivers.ts:39`) | 재사용, 새 태그 없음(963 무변경) |
| `operatingIncome` | `OperatingIncomeLoss` → (매출−`CostsAndExpenses`) → (세전이익+이자비용) | 재사용(963 무변경) |
| `dna` | 기존 D&A 우선체인(합계 태그 → 감가+무형 분리합산, `drivers.ts:51~55`) | 재사용(963 무변경) |
| `debt`·`nonOperatingAssets` | 기존 역DCF 시장 부분(`drivers.ts` 부채·비영업자산 계산) | 🔴 **driver 파이프라인 전체가 성공(`ok:true`)해야만 채워진다** — PER·PBR·PSR·매출/영업이익/D&A와 달리 5년 게이트 뒤에서 계산되기 때문(아래 "코드가 스펙보다 넓힌 것" 참조)(963 무변경) |

**모든 값은 어느 회계연도(`fiscalYear`)에서 왔는지, 어느 태그에서 왔는지(`sourceTags`)와 함께 저장된다**(`us_fundamentals.fiscal_year`·`source_tags` — 규칙 5-2 ④, 결과에 출처를 실어 보낸다).

## 🔴 코드가 이 표보다 넓힌 것 — `debt`·`nonOperatingAssets` null 처리

`lib/valuation.ts`의 `unavailableWhen`은 STEP 947 커맨드가 준 원문 그대로 `ebitda<=0`·`operatingIncome==null`·`dna==null` 셋만 나열했다. 구현하면서 **네 번째 조건을 추가했다**: `debt`나 `nonOperatingAssets`가 `null`이면(아직 계산 안 됨 — driver 파이프라인이 5년 게이트 중 하나에서 이미 멈췄다는 뜻) EV/EBITDA도 미성립으로 둔다(`MISSING_MARKET_DATA`).

**왜**: `operatingIncome`·`dna`는 이제(§2) 5년 게이트 **앞**에서 수집되어, 회사가 나중 단계(PP&E·유동자산·현금흐름·주식수)에서 걸려도 값이 남아 있을 수 있다. 반면 `debt`·`nonOperatingAssets`는 여전히 게이트를 전부 통과해야만(`ok:true`) 계산된다. 이 둘이 없는데 `0`(무차입)으로 가정하면 **"모른다"를 "무차입이다"로 둔갑**시키는 것이라 규칙 5-1 ⑤ 위반이다. 그래서 원문 스펙보다 조건을 하나 더 넣었다 — 값이 아니라 **누락 사유를 정직하게 넓힌** 것이며, PER/PBR/PSR 세 식은 원문 그대로 손대지 않았다.

## 외부 근거

- **EV 정의·현금 정합성** — Damodaran, *vebitda.pdf*: *"Market Value of Equity + Market Value of Debt − Cash."* 현금을 분자에서 빼면 분모(EBITDA)에서도 현금성 이자수익이 빠져야 정합한데, 우리 EBITDA(`operatingIncome + dna`)는 애초에 이자수익이 안 들어가 있어 정합한다.
- **자기자본 정의** — Damodaran, *pbv.pdf*: 보통주 장부가(common equity book value) 기준이어야 한다는 근거. 🔴 **STEP 963부터 실제로 구현됨** — `commonEquity = equity − 우선주 − (NCI포함 태그일 때만)비지배지분`을 PBR 분모로 쓴다(그 전엔 이 인용이 아직 코드와 안 맞는 아스피레이셔널 주석이었다 — 963이 그 간극을 닫았다).
- **음수 PER 처리 관행** — Stock Analysis 용어 페이지: 음수 PER은 통상 `n/a`로 표기하는 것이 관행.
- 🔴 **미확보**: 위 두 Damodaran PDF는 `data/sources/`에 원문이 저장돼 있지 않다(SEC CIK 파일과 달리 이번 STEP이 로컬 원본 확보를 지시하지 않았음). 이 절의 인용은 STEP 947 명령서 원문을 따른 것이고, **PDF 원문 재대조는 이번 세션에서 하지 않았다** — ⓪ 원전 인벤토리 규칙상 남은 빚으로 기록한다.

## 🔴 아직 못 푼 것 8개

0. ✅ **YS 고정창 결함 — 해소(STEP 951, 2026-08-08 장은태 판정).** 원래 문제(STEP 950): `lib/revdcf/drivers.ts:12`의 `const YS = [2020, 2021, 2022, 2023, 2024]`가 하드코딩이라 최신 회계연도 1~2년이 누락돼 **4축 전부가 영향**(NVDA PER 64.7%·AAPL PER 19.5% 과대). **951 — `resolveYearWindow()`로 전환**: 창 정의 = 종목별 실재 최신 5개 연도(매출 기준·연속·오늘 날짜 유도 상한, 정의 전문 = `docs/REVDCF_SPEC.md` §10-A). 30종목 검증 — **30/30 창 해소**, NVDA `fiscalYear=2025`(=NVDA 표기 FY2026, 매출 215,938,000,000·순이익 120,067,000,000)·AAPL `fiscalYear=2025`(매출 416,161,000,000·순이익 112,010,000,000) 둘 다 SEC 원문과 정확 일치. `fiscal_year`가 이제 매년 자동으로 올라간다(2024 고정 → 종목별 최신). 🔴 **과거 `us_valuation`/`us_fundamentals` 행은 재계산하지 않는다** — 다음 정규 크론부터 새 창이 적용되며, 그 전까지 DB엔 여전히 옛 창 값이 있다(`fundamentals_fiscal_year`가 951 이전 행은 대부분 2024, 이후 행부터 종목별로 다르다). 상세 = `docs/probe_951_verify.json`.
   🔴 **적용 경계(Q1 관점, 못박기) — 2026-08-08 push `e39595d`, 첫 정규 크론 🔴 2026-08-10 07:45 KST(정정 — 2026-08-09 07:45 KST 크론은 배포보다 먼저 돌아 옛 코드로 실행됨, `us_fundamentals` 22시대 723행 중 669행이 `fiscal_year=2024`로 실측 확인. 새 창의 첫 실행은 `2026-08-09 22:45 UTC`이며 `revdcf_results as_of='2026-08-09'`로 쓰인다)**: `us_fundamentals.fiscal_year`/`us_valuation.fundamentals_fiscal_year`가 종목별로 갈리기 시작한 행 = 새 창(951 이후). 대부분 2024로 고정된 행 = 옛 창(951 이전). **두 구간을 시계열로 이어 읽지 말 것** — PER·PBR·PSR·EV/EBITDA가 회사 실적 급변이 아니라 관측 연도 이동으로 크게 튈 수 있다. 🔴 `us_fundamentals`는 symbol PK upsert라 크론이 돌 때마다 이전 값이 사라진다 — **`us_fundamentals_snapshot`(tag=`pre_step951`, 2026-08-08, 1,127행)에 옛 창 원시 재무를 떠 뒀다** — 951 이전/이후 원시값(net_income·equity·revenue·operating_income·dna) 비교는 이 스냅샷을 before로 쓴다. 임시 테이블이며 쓸모가 끝나면 지운다.
   🔴 **정정 — 「나머지」 유니버스 순환 속도, STEP 947 추정 철회(2026-08-08).** STEP 947 §4는 `us_market_cap` 유니버스(5,497건)까지 넓힌 나머지 종목을 "`us_fundamentals.fetched_at` 오래된 순 자동 순환"으로 채운다고만 적었을 뿐 구체적 소요일수를 문서에 남기지 않은 줄 알았으나 — 🔴 **재정정(같은 날, Cowork 3중 검수) — "문구 자체가 어디에도 없었다"는 앞선 결론이 틀렸다.** grep 대상을 `VALUATION_SPEC.md`·`STATE.md`·`CHANGELOG.md` 3개(당시 표현은 "4개"라 적었으나 실제 실행은 3개+`REVDCF_SPEC.md` 확인뿐 — `LENS_COMPLETION_STANDARD.md`가 범위에서 빠졌다)로 좁힌 게 결함이었다. `docs/LENS_COMPLETION_STANDARD.md:104`에 **"3일 순환 완료 후"라는 원문이 실재했다**(정정 완료, 아래 실측으로 대체). **`us_fundamentals` 순증은 하루 약 124건**(1,003→1,127, STEP 948 수동실행 12시대 이후 정규크론 22시대 1회분). 크론이 쓴 723행 중 대부분은 역DCF 유니버스 604를 매일 다시 도는 몫(대기열 최우선)이라 "나머지"의 실제 순증은 이보다 적다 — **이 속도면 5,497 전량까지 대략 35일**(정밀 계산 아님, 1일 관측치의 단순 외삽). 🔴 **근본 원인 — 정규 크론 실행의 응답이 어디에도 저장되지 않는다**(상세 = `docs/STATE.md` 00-d) — 그래서 이 순환 속도의 병목이 처리량(항목 수) 자체인지 예산(`BUDGET_MS=270,000ms`) 소진인지조차 미측정이다. 처방은 판정 대기(장은태) — 후보: ① 역DCF 604를 매일 전량이 아니라 격일/주간으로 돌려 "나머지" 처리량을 늘린다 ② 크론 예산 여유를 00-d 해소 후 실측으로 먼저 잰다.

1. **PSR 표준 정의 원문 미확보** — "매출총이익 대비"인지 "매출 대비"인지 등 세부 관행의 1차 출처를 아직 찾지 않았다. 지금 정의(`marketCap/revenue`)는 가장 널리 쓰이는 형태를 그대로 채택한 것이지, 원문 대조를 거치지 않았다. 🔴 **STEP 962(2026-08-09) 재확인 — 여전히 못 찾았다.** `psdata.xls` FAQ·`variable.htm`·`c21.pdf` 전부 확인했으나 **종목 단위 정의**(총매출/순매출 구분, 금융업 매출 처리)는 어디에도 없다 — 업종 집계 정의("Aggregated market cap ÷ aggregated revenues")와 "측정 불가"라는 정성적 서술뿐. 일반론으로 안 채우고 "못 찾음"으로 유지한다. 상세 = `docs/probe_962_definition_refine.json` §2.
2. **다중 클래스 주식(GOOG/GOOGL 등) 시총 합산 미해결** — 현재 `us_market_cap`은 **클래스별로 별도** 값을 갖는다(`resolveSector`의 형제 매칭과 달리, 시총 자체를 합산하는 로직이 없다). PER·PBR 등은 클래스별로 각각 계산되며, 통합 시총 기준 배수와 다를 수 있다.
3. **`StockholdersEquity`에 비지배지분이 섞이는 변형** — 2순위 태그(`StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest`)를 쓴 기업은 PBR 분모가 순수 보통주 지분보다 크게 잡힐 수 있다. **추적만 한다** — `source_tags.equity`에 실제 채택 태그를 기록해 사후에 걸러낼 수 있게 해 두었을 뿐, 자동 보정은 하지 않는다. 🔴 **실측(STEP 948, 2026-08-08)**: `equity`를 확보한 851건 중 **48건(5.64%)**이 이 2순위 태그를 채택 — "가능성 있음"이 아니라 실측치. 이 48건은 PBR이 실제보다 낮게(저평가로) 잡혀 있을 수 있다는 뜻이며, 자동 보정은 여전히 안 함.
   🔴 **STEP 962(2026-08-09) 확장 — 우선주도 같은 문제, 더 크다.** `StockholdersEquity`는 **우선주로도 구분되지 않는다**(태그 자체가 보통주+우선주를 합친 값). 100종목 표본(70종목 유효) 중 **2종목만 `PreferredStockValue`(류) 태그 보유**했으나 — Citigroup 개별 재검증에서 우선주 17.85B 조정만으로 **PBR이 −8.56% 이동**(SEC 원문 재확인, 장은태 제공 수치와 정확 일치) — STEP 958의 대조 잔차(−10.15%)의 대부분(약 8.4%p)을 설명하고 잔차를 −1.72%로 좁혔다. **비지배지분(NCI)까지 뺀 "보통주 장부가"(후보ⓑ) 영향**: 100종목 표본에서 유효비교 60건 중 20건 값 변화, p90 절대상대차 3.21%. **유형장부가(후보ⓒ, 영업권·무형자산까지 차감)는 훨씬 파괴적** — 49건 중 35건 변화(p90 388%!), **12건이 장부가 음수로 전환**(ABBV·ADEA·ADSK·AES·AEYE·AIRE·ALIT·ALLE·ALSN·AMCR·AME·AMGN — IT 4·Industrials 4·Health Care 2·Utilities 1·Materials 1, 기술주만의 문제가 아니라 M&A 영업권이 큰 기업 전반의 문제). 판정 없음, 후보 3개 영향만 기록 — 상세 = `docs/probe_962_definition_refine.json` §1.
   ✅ **STEP 963(2026-08-09, 장은태 위임→Cowork 판정) — 후보ⓑ(보통주 장부가) 채택·구현 완료.** 우선주·비지배지분(NCI포함 태그일 때만) 둘 다 뺀 `commonEquity`를 PBR 분모로 확정(`us_fundamentals.common_equity` 신규 컬럼, `equity`는 그대로 보존). 후보ⓒ(유형장부가)는 채택하지 않음(위 문단의 12/49 음수전환 등 파괴적 영향 때문 — 이 STEP에서 판정, 은행 실무의 유형장부가 관행은 별도 논의 대상으로 미룸). **전 유니버스(930종목, fiscal_year 확보분) 실측**: PBR 절대상대차 중앙값 0%·p90 0%(대부분 무영향), **Financials(61종목) p90 8.8%· 🔴 Utilities(38종목) p90 11.8%로 Financials보다 더 크게 이동**(규제 유틸리티의 전통적 우선주 자본조달 관행 — VST·NRG·AES·EIX·PCG·D 확인). 커버리지 손실 0건(예측 1건보다 적음). PER도 같은 원리로 보통주 귀속 순이익 기준 확정(`NET_INCOME` 배열 순서 변경만, 새 태그 0개) — 절대상대차 p90 1.0%, 새로 unavailable 3건(APG·FTAI·QXO, 우선주배당 차감 후 보통주 귀속 손실 전환·경제적으로 유효). Citigroup PER 17.86→19.76·PBR 1.0856→1.1872, as_of=2026-08-08에 백필 완료. 상세 = `docs/probe_963_definition_apply.json`.
4. **야후 대비 상대차 미측정** — 🔴 **원인은 STEP 948 명령서 §5의 전제 오류다** — "`lens_scores`에 야후 원시 PER이 저장돼 있다"고 썼으나 실제로는 파생 점수(`valuation_value`·`valuation_state`)만 있고, 원시 `trailingPE`·`priceToBook`은 어디에도 저장되지 않는다(`lib/lensCompute.ts`의 즉시계산 값). 따라서 **`lensCompute.ts` 교체 판정의 근거가 아직 없다** — 측정 수단(라이브 재조회 방식 등) 설계가 선행돼야 한다.
5. **`us_market_cap` 결측으로 4축이 전부 안 나오는 종목이 있다** — Cowork 교차검증(2026-08-08, `docs/probe_948_live.json`의 `cowork_crosscheck`)이 발견·Claude Code가 재확인: 68종목(`ACM`·`ADI`·`AIT`·`APA`·`AZO`·`BBY`·`BDX` 등 다수 S&P 500 대형주 포함)이 `us_market_cap`의 최신 `as_of`(2026-08-07)에 행이 없고 **2026-07-30 등 옛 `as_of`에만 값이 있어** 분자(시총)가 없다. 🔴 **「계산이 안 된 것」이 아니라 「분자가 없는 것」이다** — 구분해서 읽을 것. 🔴 **날짜 우연 일치, 인과 미확인**: 2026-07-30은 US `lens_cuts`가 정지된 바로 그 날짜다(`STATE.md` ▶다음 00번) — 같은 원인인지는 확인하지 않았다.
6. **NVDA 회계연도 라벨 — 표시 문구 판정 필요(2026-08-08, 판정 대기).** 우리는 NVDA를 `fiscal_year=2025`로 라벨하는데(`calYear`의 5월 경계 규칙 — 종료월≤5월이면 전년도 귀속) NVDA 자신은 이 회계연도를 **FY2026**이라 부른다. 값(매출 215,938,000,000·순이익 120,067,000,000)은 SEC 원문과 정확히 일치하나, 화면에 「2025년 실적」으로 표기하면 사용자가 틀렸다고 볼 수 있다. **표시 문구 판정 필요(장은태)** — Q1 카드 작업 시 함께 정한다.
8. ✅ **제출버전(vintage) 정책 — 확정(2026-08-09, STEP 964 재료 → STEP 965 장은태 위임·Cowork 판정).** **정본 = `docs/REVDCF_SPEC.md` §10-B**(같은 내용을 두 곳에 복제하지 않는다 — 이 항목은 교차참조만). **결론만 요약**: 같은 회계연도에 SEC XBRL이 값을 두 개 이상 갖는 경우(제출 시점이 다른 두 신고서가 같은 기간에 서로 다른 값을 보고) **최신 제출값(재작성 반영)을 그대로 쓴다** — 계산 로직(`annualMap`의 `filed` 최신값 우선 선택)은 무변경, `flags.restated`로 재작성이 감지된 필드만 추가 기록. 근거·대가·재검토 조건(백테스트 도입 시)·값 불변 검증(구코드 vs 신코드 완전 대조, 불일치 0건)은 REVDCF_SPEC §10-B 참조.
   🔴 **STEP 964가 남긴 영향 규모 실측**(930종목 전량, netIncome 41건 4.4%·equity 45건 4.8%·revenue 55건 5.9%, 최대폭 WDC·DD·TKO는 사업분할 회계반영으로 원인 규명)과 **외부 대조**(stockanalysis.com — WDC·DD 우리 최신 제출값과 정확히 일치)는 이 판정의 근거 ②③으로 그대로 채택됐다.
   🔴 **Citigroup third value($70,613M)는 이 판정으로도 설명되지 않는다** — 여전히 미해결로 남긴다.

## 「업종 대비」 — 정의 공개표 (STEP 952, 2026-08-09 장은태 판정)

🔴 **원전 없음 — 규칙 5-1 트랙.** 백분위로 업종 대비 위치를 매기는 것은 회계 관행이나 학술 정의가 아니라 우리가 고른 산술 방법이다. 정의를 하나로 고정하고 여기 공개한다. **유일한 출처 = `lib/sectorRelative.ts`의 `SECTOR_RELATIVE_SPEC`**(규칙 5-2 ⑤) — 아래는 그 객체를 그대로 옮겨 적은 것이다.

```
method: "percentile"
direction: "higher_is_more_expensive"   // 4축(PER·PBR·PSR·EV/EBITDA) 전부 값이 클수록 비싸다
axes: ["per", "pbr", "psr", "evEbitda"]
sectorSource: "us_sector_wide"
percentileFn: "empirical_rank"          // count(v < target) / n_valid — 아래 계산 정의 그대로
minSample: 20                            // ✅ 확정(STEP 956, 2026-08-09 장은태 판정) — 20건이면 백분위 해상도 5%(1/20)
unavailableWhen: ["sector == null", "축 값이 없음(us_valuation.unavailable에 사유 있음)", "업종 내 유효 표본 < minSample"]
```

**계산 정의**: 한 종목의 백분위 = 같은 업종·같은 축에서 **그 종목보다 값이 작은 유효 종목의 비율**(`count(v < target) / n_valid`). 값이 없는 종목(결측)은 분모·분자에서 뺀다(0으로 치지 않는다). 동점인 종목들은 서로를 "작다"고 세지 않으므로 같은 백분위를 받는다(중간순위 보정 없음). 🔴 이 함수는 `lib/sectorCuts.ts`의 `pctile()`(백분위→값, type-7 분위수)과 **수학적으로 반대 방향**이라 그 함수를 그대로 재사용하지 않았다 — `pctile`을 부르면 정의 문장과 실제 동작이 어긋난다(분모가 `n-1` vs `n`으로 다름). 상세 = `lib/sectorRelative.ts` 코드 주석.

**섹터 출처 — 5단계 그대로, `resolveSector()`를 수정 없이 재호출**(0순위 SPDR·1순위 Damodaran 직접·2순위 형제클래스·3순위 야후·4순위 미분류). `us_valuation` 최신 as_of(2026-08-08) 1,127종목 전체에 적용한 실측(Q0 1,021 기준과 나란히):

| 출처 | Q0(1,021, STEP 939~942) | 952(1,127, 페이지네이션 비결정성 이전값) | 955(1,127, 954 처방 후 재생성 — **확정값**) |
|---|---|---|---|
| spdr(0순위) | 498 | 402 | 402 |
| damodaran(1순위) | 311 | 601 | **605** |
| damodaran-sibling(2순위) | 5 | 5 | 5 |
| yahoo(3순위) | 207 | 29 | **26** |
| 미분류(4순위) | 0 | 90 | **89** |

🔴 **952의 90은 흔들리는 값이었다 — 확정값은 89(STEP 955, 2026-08-09).** `lib/sector.ts`의 `damodaran_industry` 읽기가 `.order()` 없이 페이지네이션돼(STEP 953 실측: 동일 인자 반복 호출 시 결과가 흔들림) 952 적재 시점에 우연히 걸린 값이 90이었다. STEP 954가 처방(`fetchAllRows`, 정렬 키 고유 전순서)을 적용한 뒤 STEP 955가 **재적재 전 3회 반복으로 안정성을 확인**(미분류 89/89/89, 3회 전부 동일)하고서야 `us_sector_wide`를 같은 `as_of`(2026-08-08)로 재적재했다 — DELETE 없이 upsert, 이전 값은 `us_sector_wide_snapshot`(tag=`pre_step954_paging`)에 보존. **변화**: 미분류→분류 1건(`RAYA` — 952b 조사의 그 종목, `damodaran`/`Industrials`로 정확히 분류됨) · 분류→미분류 0건(회귀 없음) · sector 값 변경 0건(어느 종목도 배정된 섹터 자체가 바뀌지 않음) · source만 변경(sector 동일) 3건(`WTRG`·`TEAM`·`WMS`, 전부 `yahoo`→`damodaran`— 952b가 지목했던 5건 중 `us_sector_wide` 유니버스에 실제로 존재하는 3건). `PTGX`·`TIGO`는 애초에 `us_valuation`(1,127) 유니버스 밖이라 이 표 자체에 없다(교집합 640종목 문제, 아래 참조 — `us_sector_resolved`에서만 다뤄지는 종목).

🔴 **단순 확장이 아니다 — 두 유니버스는 부분집합 관계가 아니다.** `us_sector_wide`(1,127종목)와 `us_sector_resolved`(Q0, 1,021종목)의 교집합은 **640종목뿐**(직접 교차대조, 불일치 0건 — 같은 함수·같은 입력이면 같은 결과가 나옴은 확인됐다). 나머지는 서로 다른 유니버스 소속이다 — `us_valuation`(SEC XBRL 기반, `us_cik_map ⋈ us_market_cap`)과 `lens_scores`(Q0 원 유니버스)가 애초에 다른 파이프라인이라 종목 구성이 갈린다. 이 때문에 spdr 절대건수가 늘지 않고 오히려 줄고(498→402), damodaran이 거의 두 배(311→605)로 늘고, 미분류 89건이 새로 생겼다 — **1,127 유니버스에 SPDR 미커버 소형주가 대거 포함**된 결과로 해석되나 원인은 조사하지 않았다(추정, 미확인).

🔴 **`us_sector_resolved`(Q0, 라이브 화면용)도 같은 문제를 가졌을 가능성 — 조사만, 무접촉(STEP 955 §4).** STEP 955에서 tier/source가 바뀐 3종목(`WTRG`·`TEAM`·`WMS`)이 `us_sector_resolved`(1,021)에도 전부 존재한다 — **3/1,021건이 「Q0 산출물도 같은 페이지네이션 비결정성 문제를 가졌다」의 크기**다. `us_sector_resolved` 자체는 건드리지 않았다(라이브 화면이 읽는 표, 재생성 여부는 별도 승인 대기 — `docs/STATE.md` 참조). Q0 마감 판정 자체는 변경하지 않는다.

🔴 **섹터표가 둘로 갈려 있다 — `us_sector_resolved`(화면용, 1,021)와 `us_sector_wide`(계산용, 1,127).** 이유 = **라이브 화면 변경 회피.** `app/api/sector/us/route.ts`가 `us_sector_resolved`의 최신 `as_of`를 그대로 노출하고 `ExploreClient.tsx:467`이 그 값으로 Explore 화면의 거래대금 목록 라벨·필터칩 카운트를 그린다 — 여기 새 `as_of` 행을 넣는 순간 라이브 화면이 바뀐다. Q1은 아직 화면이 없으므로(카드 자체가 없음) 별도 테이블(`us_sector_wide`)에 격리해 계산 재료로만 쓴다. **컬럼 구성은 동일하게 맞췄다** — 통합 판정이 나면(예: Q1 카드 출시 시 `us_sector_resolved`를 이 넓은 유니버스로 교체) `toResolvedRows()` 그대로 옮겨 쓸 수 있다. **통합 여부·시점은 판정 대기(장은태) — Q1 카드 작업 시 함께 정한다.**

**미분류 89종목 전수(확정값, STEP 955)** — 952 당시 목록(90건, `docs/probe_952_sector_wide_step1.json`)에서 `RAYA` 1건이 빠진 나머지: 대부분 소형주·클로즈드엔드펀드(`BME`·`CII`·`CIK`·`CRF`·`DHY`·`FLC` 등)·해외 ADR. `AKO-A`/`AKO-B`처럼 구두점이 있는데도 형제매칭에 안 걸린 케이스 포함(2순위는 Damodaran 내부 형제만 봄 — SPDR/야후에 없고 Damodaran에도 없으면 3개 tier 전부 실패).

🔴 **미분류 = 재료 부재가 아니다(2026-08-09 실측, `docs/probe_952b_unclassified.json`).** 90건 중 `us_cik_map` 90건(100%) 존재. **아래 두 수치는 Cowork이 먼저 제시한 값(damodaran 53건/58.9%·nasdaq 88건/97.8%)을 Claude Code가 Supabase 직접 재조회로 독립 재검증해 다르게 나온 결과다 — 원 수치를 정정한다**(90종목 모집단 자체·사전순 표본 20개는 재현 일치 확인됨):
- `damodaran_industry`: 정규화 매칭 시 **29건(32.2%)**에 실제로 행이 존재(원 보고 53건은 `ticker_norm`이 여러 나라 기업에 중복 매핑돼 부풀려진 JOIN 행수였다 — 서로 다른 심볼 기준으로 세면 29건). 그중 `is_us_listed=true` 행을 가진 것은 **1건뿐**(`RAYA` — 미국 상장 중국기업, `primary_sector="Industrials"`).
- `us_sector_nasdaq`: 원시 존재 **90건(100%)**이나, `resolveSector`는 나스닥을 분류 tier로 쓰지 않는다(`crossCheck` 전용) — 5순위로 새로 추가할 경우 실제로 쓸 수 있는 건 `NASDAQ_TO_GICS` 매핑 성공분(`Miscellaneous`·결측 제외)뿐이며 그 수는 **79건(87.8%)**이다(원 보고 88건과도 다름, 집계 방식 차이로 추정·미확인).

### ✅ damodaran tier 조사·처방 완료(STEP 952b~955, 2026-08-09) — 원인 규명(952b) → 공용 헬퍼 처방(954) → us_sector_wide 재생성(955)

`docs/probe_952b_damodaran_tier.json` 참조. **원래 가설(ticker_norm 중복=RAYA형)은 틀렸다** — 조사 중 그보다 크고 일반적인 버그를 발견했다. 🔴 **`RAYA` 자체는 STEP 955에서 정상 분류로 확정됐다**(damodaran/Industrials) — 이 절 아래 내용은 원인 규명 과정의 기록으로 남긴다.

🔴 **핵심 발견 — `resolveSector()`는 동일 입력으로 반복 호출해도 결과가 매번 다르다.** `lib/sector.ts`의 `fetchAll()`(damodaran_industry·us_sector_nasdaq·us_sector_yahoo·us_sector_gics 4개 fetch 전부, `:21`·`:64`)이 `.order()` 없이 `.range()`만으로 페이지네이션한다 — PostgreSQL/PostgREST는 `ORDER BY` 없는 쿼리의 행 순서를 실행마다 보장하지 않으므로, 별개의 `.range()` 호출(페이지)들이 실행마다 다른 스캔 순서를 쓰면 경계에 걸친 행이 어느 페이지에도 안 들어가는(누락) 일이 생긴다. **실측**: 동일 인자로 `resolveSector()`를 5회 연속 호출 — `damodaran_industry(is_us_listed=true)`의 `COUNT(*)`는 매번 6,937로 고정(데이터는 안 바뀜)인데 분류 성공 건수는 **1038/1038/1032/1038/1038**로 흔들렸다(미분류 89/89/95/89/89). `RAYA`는 이 5회 전부 성공했다 — 즉 RAYA가 "항상" 실패하는 게 아니라, 어떤 실행에서는 RAYA가, 다른 실행에서는 무작위로 다른 6개 심볼이 빠진다.

**29건 분류(A~E 대신 실측대로)**: **F(페이지네이션 비결정성) 1건**(`RAYA` — 이번 `us_sector_wide` 적재 실행에서 우연히 걸림) + **B(is_us_listed=false, 설계대로 제외) 28건**(`AERO`·`ALM`·`API`·`ASM`·`MSC` 등 — Damodaran이 애초에 미국 상장으로 분류 안 함, 버그 아님) + C(industry_group 결측)·D(티커 표기 불일치)·E(그 외) = **0건**(29건 전부 정규화 매칭 자체는 성공).

🔴 **Q0(1,021종목)에도 같은 흔적이 있다.** `us_sector_resolved`의 `source='yahoo'`(tier-3) 207건 중 **5건**(`PTGX`·`TEAM`·`TIGO`·`WMS`·`WTRG`)이 실제로는 `damodaran_industry`에 `is_us_listed=true`·`primary_sector` 존재 행을 갖고 있다 — tier-1(damodaran)이 잡았어야 정상인데 tier-3까지 내려갔다. 이 5건은 SPDR 494종목 정답지(`us_sector_gics`)에는 없어 **"Damodaran vs 진짜 GICS 99.6%(492/494)" 수치가 이 증거로 직접 영향받았는지는 확인도 반증도 안 된다.** Q0의 "미분류 0건·커버리지 100%"라는 최종 숫자 자체는 오늘 재확인해도 참이다(재확인 완료) — 그러나 **source 라벨(어느 tier가 잡았다는 귀속)의 정확성과 최종 sector 커버리지는 다른 질문**이며, 그 실행의 tier 배정이 항상 결정론적이었다는 보장은 없다.

🔴 **처방 후보(고르지 않음, 판정 대기)**: ① `fetchAll()`의 모든 `.range()` 호출에 안정적인 `.order()` 추가(비용: 소폭 성능저하 가능·다른 fetchAll류 함수도 같은 패턴인지 확인 필요, 이 STEP에서 미조사) ② damodaran tier의 `is_us_listed` 필터 완화(비용: 설계 변경, 28건 B형에 영향) ③ 현행 유지(비용: 비결정성 자체는 남음).

🔑 **질적 결론은 유지된다** — 미분류가 "정보 자체가 없어서"가 아니라 **있는데 안 붙는** 경우가 존재한다(29건 중 1건 확정, 판정 대기 상태로 나머지 재확인 필요). 다만 규모는 최초 보고(53건)보다 작고(29건), 원인은 예상(ticker_norm 중복)과 다르다(fetchAll 페이지네이션 비결정성).

**미성립 조건 전수** — `unavailableWhen` 그대로 3가지: ① `sector == null`(위 미분류 90종목) ② 축 값 자체가 없음(`us_valuation.unavailable`에 사유 있음 — `NEGATIVE_EARNINGS`·`MISSING_NET_INCOME` 등, `lib/valuation.ts` 기존 정의) ③ 업종 내 유효 표본 < `minSample`(아직 미정, 아래 재료 참조).

### ✅ minSample = 20 확정 (STEP 956, 2026-08-09 장은태 판정)

업종 11개 × 축 4개 유효 표본 수(2026-08-08 실측, `docs/probe_952_sector_sample_table.json`):

| 업종 | PER | PBR | PSR | EV/EBITDA |
|---|---|---|---|---|
| Real Estate | **10** | **17** | **18** | **4** |
| Communication Services | 26 | 40 | 44 | 25 |
| Energy | 35 | 39 | 42 | 28 |
| Utilities | 36 | 37 | 37 | 29 |
| Materials | 40 | 46 | 46 | 37 |
| Consumer Staples | 40 | 44 | 47 | 34 |
| Financials | 54 | 59 | 61 | 16 |
| Consumer Discretionary | 77 | 81 | 94 | 71 |
| Health Care | 78 | 130 | 148 | 79 |
| Information Technology | 93 | 139 | 148 | 100 |
| Industrials | 155 | 159 | 170 | 133 |

🔴 **가장 적은 표본 = Real Estate EV/EBITDA 4건.** Real Estate가 전 축에서 최소치를 차지한다(PER 10도 두 번째로 작음). Financials의 EV/EBITDA(16)도 낮다 — REIT·은행업은 EBITDA 개념 자체가 업종 관행과 안 맞아 결측이 몰리는 것으로 보이나 확인하지 않았다.

**Q0 선례**: `sector_cuts`(섹터×지표 컷)는 78개 조합 중 **7개를 IQR 대비 폭 1.0 초과로 제외, 71개(91%) 적용**(STEP 943~944, `docs/CHANGELOG.md` 검증 완료 — 표본 크기가 아니라 부트스트랩 분산 기준이었다는 점은 다르다). 여기서는 표본 **개수** 하한(`minSample`)을 판정해야 한다 — 위 표가 그 재료였다.

**minSample=20 적용 결과 — 44칸(11업종×4축) 중 5칸이 비었다(실측, `us_sector_relative` 백필 조회 확인)**:

| 업종 | PER | PBR | PSR | EV/EBITDA |
|---|---|---|---|---|
| Real Estate(n=19) | 🔴 없음(10<20) | 🔴 없음(17<20) | 🔴 없음(18<20) | 🔴 없음(4<20) |
| Financials(n=106) | 있음(54) | 있음(59) | 있음(61) | 🔴 없음(16<20) |
| 나머지 9개 업종 | 전부 있음(≥25) | 전부 있음(≥37) | 전부 있음(≥37) | 전부 있음(≥25, Utilities만 29) |

🔴 **Financials EV/EBITDA(16건)는 "표본이 적다"가 아니라 "축이 안 맞는다"일 가능성이 있다** — 은행은 부채가 영업 재료라 EV(기업가치=시총+순부채) 개념 자체가 비은행 기업과 다르게 작동한다. `minSample`은 두 원인을 구분하지 못하고 둘 다 `SAMPLE_TOO_SMALL`로 묶는다 — **표시 문구를 정할 때 이 둘을 구분해야 한다(🔴 미판정, Q1 카드 작업 시 재론).**

## ✅ 파이프라인 완성 (STEP 956, 2026-08-09)

- **저장처**: `us_sector_relative`(PK `as_of,symbol`) — `us_valuation`(절대값)과 분리(백분위는 같은 업종 다른 종목 값이 전부 있어야 나와 종목별 upsert 루프 안에서 계산 불가). RLS = `us_valuation`과 동일 패턴(anon/authenticated 권한 0).
- **계산**: `lib/sectorRelativeBatch.ts`의 `computeSectorRelativeBatch()` — 순수 함수(DB 접근 없음). `lib/sectorRelative.ts`의 `sectorPercentiles()`를 그대로 호출(재구현 없음). 유닛테스트 = `lib/sectorRelativeBatch.test.ts`(9케이스: 표본 19/20/21 경계·동점·전부결측·섹터null·종목별 NO_VALUE·음수 PER 혼재·축별 독립 판정).
- **배선**: `app/api/cron/revdcf/route.ts`의 `us_valuation` 계산 직후(`finally` 블록 안, SEC 호출 0건 — 예산 소진과 무관하게 항상 실행). 응답 JSON에 `sectorRelativeSaved` 추가. diff는 이 추가분만(기존 로직 무변경, 코드 diff로 확인 완료).
- **백필**: `scripts/backfill_sector_relative.ts`(§3-1 순수 함수를 그대로 import — 로직 복제 없음)로 `as_of=2026-08-08` 1회 실행 — `us_sector_relative` **1,127행** 적재(섹터 있는 1,038 + 섹터 없는 89). `unavailable` 사유별 셀 수(4축×1,127행 기준) = `NO_VALUE` 1,189 · `SAMPLE_TOO_SMALL` 182(= 5개 빈 칸의 소속 종목 수 합: Real Estate 19×4 + Financials 106×1×... 정확히는 위 표의 각 셀 소속 종목 수 합) · `NO_SECTOR` 356(=89종목×4축).
- **손계산 검산**: Industrials PER(n=155, 위 표) — 최저(`CNDT`, 순위 0) `pct=0/155=0` ✓ · 최고(`FTAI`, 순위 154) `pct=154/155=0.9935483870967742` ✓ · 중앙 근처(`IEX`, 순위 79) `pct=79/155=0.5096774193548387` ✓ — 저장값과 소수점 4자리 이상 정확히 일치(직접 Supabase 조회로 대조). `minSample` 경계도 실측대로 확인: Financials EV/EBITDA(16건) → 106건 전부 `pct=null`·`SAMPLE_TOO_SMALL` / Utilities EV/EBITDA(29건) → 40건 전부 계산됨.

🔴 **Q1 카드 화면은 여전히 미착수.** 이 STEP은 계산·저장까지다 — 사용자에게 보이는 화면(카드·문구·Real Estate/Financials EV 결측 표시 방식)은 별도 작업.

## 🔴 성립하지 않는 경우 — 커버리지 결측 12종목(2026-08-08 실측)

`us_market_cap` 최신 `as_of`(2026-08-07) 5,509종목 중 **12종목(0.22%)**은 `data/sources/sec/company_tickers_exchange_20260802.json`에 티커가 없어 **CIK를 못 얻었다.** 이 12종목은 `us_cik_map`에 아예 들어가지 않으므로(CIK를 모르는 채로 넣지 않는다 — 지어내지 않는다) **4개 축 전부 값이 없다.**

전수: `CNSY` · `FRBA` · `GRSD` · `HIFS` · `QNME` · `RCBC` · `SSBI` · `STLN` · `TCGX` · `TONT` · `TOWN` · `YARW`

🔴 **원인은 조사하지 않았다.** 목록에 `HIFS`·`TOWN`·`FRBA` 등 현재 상장·보고 중인 것으로 보이는 이름이 포함돼 있어, 상장폐지가 아니라 SEC 파일의 누락일 가능성이 있으나 **확인하지 않았다.** 「없다」가 아니라 「모른다」다. 근거 = `docs/probe_947_cik_coverage.json`.

## 🔴 `fiscal_year` 미확보 197종목 — Q1 카드가 통째로 빈다(2026-08-09 STEP 964 실측)

`us_fundamentals.fiscal_year`가 null인 197종목(전부 `unavailable_reason='INSUFFICIENT_HISTORY'`)은 `us_valuation`의 4축(per·pbr·psr·ev_ebitda) **전부 null**이고 `us_sector_relative`의 4개 백분위도 **전부 null**이다(197/197, 교차확인 완료) — 즉 이 종목들은 Q1 카드를 열면 **숫자도 백분위도 하나도 안 뜨는 완전 공백 상태**가 된다.

원인을 캐시(`docs/probe_951_cache/`, SEC 신규호출 0건)로 표본 분류(197건 전수, 캐시없음 0건):
- **A. us-gaap 매출태그 자체가 회사 XBRL facts에 없음 = 135건(68.5%)** — 외국 민간 발행사가 IFRS 택사노미(`ifrs-full`)를 쓰거나 US GAAP 매출 개념 자체를 안 쓰는 경우로 의심. **표본 확인**: `ASML`(20-F만 제출, us-gaap 매출태그 0개 — IFRS 필자로 알려진 회사와 정합) · `CNI`(6-K만 제출, 연차 애뉴얼 폼 자체가 없음).
- **B. 매출태그는 있으나 10-K 폼으로는 한 번도 안 잡힘(6-K/8-K 전용 등) = 47건(23.9%)**. **표본**: `AKTX`(매출 값이 8-K 하나에만 존재 — 최근 리버스머지·8-K 프로포르마로 추정, 정식 10-K 연차보고 이력이 아직 없음).
- **C. 매출태그·10-K 폼 둘 다 존재하나, 매출태그 자체가 10-K로는 안 잡힘(10-Q에만) = 8건(4.1%)**. **표본**: `CBSH`·`ABCB`(지역은행지주 — `Revenues` 태그가 10-Q 114건엔 있으나 10-K 0건. 은행은 통상 이자수익/비이자수익 구조로 손익을 태깅해 우리 `REV` 배열과 안 맞는 것으로 추정 — 838의 "금융인접 신호" 패턴과 겹친다).
- **D. 그 외 미분류 = 7건(3.6%)** — 개별 원인 조사 안 함.

🔴 **고치지 않았다** — 규모와 원인 분류까지만. 처방(대체 태그 추가·REV 배열 확장·화면에서 "데이터 부족" 명시 등)은 판정 대기. 상세 = `docs/probe_964_residuals.json`.

## 검증

- `lib/valuation.test.ts` — `VALUATION_SPEC`의 formula·basis 고정 문자열 회귀 + 4케이스(흑자·무차입/흑자·유차입/적자/자기자본 음수) 손계산 검산 + 미성립 경계 6건.
- `lib/revdcf/drivers.test.ts` — `fundamentals`(netIncome·equity·revenue·operatingIncome·dna·fiscalYear·sourceTags) 수집이 driver 5년 게이트보다 앞에서 끝나는지, skip 경로에도 실리는지 회귀 고정.
- ✅ **STEP 948(2026-08-08) — 실제 종목 기반 검증 완료(재시도 1회 후 성공).** 1차 시도 401 실패의 원인을 호출 없이 확정(`vercel env pull`로 받은 Production 시크릿과 로컬 `.env.local`을 sha256 앞 8자리로만 대조 — 완전 일치, 값은 어디에도 안 남김) → 원인은 1차 시도의 셸 추출이 `.env.local`의 큰따옴표를 안 벗긴 것으로 확정(Production 시크릿 자체는 문제 없었음). 파싱을 고쳐 2차(마지막) 호출 → **200 성공**. `us_fundamentals` 1,003행 적재(`net_income` 855·`equity` 851·`revenue` 855·`operating_income` 837·`dna` 816·`debt`/`non_operating_assets`/`shares` 685 — 뒤 셋은 driver 전체 성공 시에만 채워짐). **비지배지분 혼입 실측 = 48건**(`equity` 851건 중 `StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest` 채택 48건, 5.64%) — "가능성 있음"이 아니라 실측치. `us_valuation` 1,003행(`per` 606·`pbr` 738·`psr` 793·`ev_ebitda` 528). `MISSING_MARKET_DATA`(원문 스펙에 없던 코드 추가 조건, 위 "코드가 스펙보다 넓힌 것" 참조)가 실제로 **131건** 발생 — 이론이 아니라 실전에서 검증됨. 손계산 4종목(A·AAL·ABNB·AIRI, us_valuation에서 조건별 사전순 결정적 선정) **전부 bit-for-bit 일치**(python 독립 재계산 대조 — 10자리 정수 나눗셈의 4자리 소수 정확도는 손 암산으로 보장 불가해 스크립트로 대체, 정신은 동일). `A`(Agilent, CIK 1090872)의 SEC `companyfacts` 원문을 직접 열어 `NetIncomeLoss`·`StockholdersEquity`·`Revenue...`·`OperatingIncomeLoss`·`DepreciationDepletionAndAmortization` 5개 태그의 회계연도·값을 `us_fundamentals`와 대조 — **전부 일치.** `revdcf_results` 2026-08-08 = 604건(08-07과 동일, 감소 없음). 🔴 **§5(야후 상대차) 미실시 — 명령서 전제 오류(2번째 발견)**: `lens_scores`에 야후 원시 PER/PBR이 저장돼 있다는 전제가 틀렸다(테이블에 `valuation_value`/`valuation_state`라는 파생 점수만 있고, 원시 `trailingPE`/`priceToBook`은 `lib/lensCompute.ts`의 즉시계산 값이라 DB 어디에도 저장 안 됨 — grep 3파일 전수 확인). 종목별로 라이브 재조회(수백 건)해야 분포를 낼 수 있는데, 이는 이번 STEP이 승인한 "`/api/cron/revdcf` 1회"를 벗어나는 별도의 대량 라이브 호출이라 임의로 하지 않았다. 상세 = `docs/probe_948_live.json`.
- 🟡 **STEP 958(2026-08-09) — DoD3(외부 독립 출처 대조) 부분 충족.** 948 §5가 무산된 이유(대조 상대 TTM ≠ 우리 연간)를 해소 — **연도별 배수를 주는 무료 출처**(stockanalysis.com, 회계연도 컬럼마다 그 시점 종가 명시)를 찾아 **5종목**(AAPL·NVDA·AAL·C·AMT, DoD3 요구 "최소 3종목"을 넘김) 대조. macrotrends·gurufocus는 이번 세션 기준 HTTP 403으로 접속 실패, ycharts는 되지만 연도별 히스토리가 유료 — "안 되는 곳"까지 기록.
  - **가격 시점 불일치**(외부=회계연도 말 종가 · 우리=오늘 시총)를 재척도(오늘가격/FY말가격 배율)로 맞춘 뒤 대조. AAPL·NVDA·AMT·AAL은 상대차 대부분 **±1~7%**(EV/EBITDA만 AAL +7.10%·AMT −7.56%로 다른 축보다 큼 — EV 산식 차이로 추정, 미확정). AAPL·NVDA는 SEC `NetIncomeLoss`·`StockholdersEquity`·매출 직접대조로 **분모(재무) 완전 일치** 확인 — 잔차는 분자(가격·주식수 시점) 쪽으로 귀속.
  - 🔴 **NVDA 최초 대조에서 상대차 −60.46%(터무니없음)이 나왔다 — 원인은 외부 FY2024(2024-01-28 종료) 컬럼과 우리 FY2025(2025-01-26 종료, calYear2024로 라벨됨) 데이터를 잘못 비교했기 때문**(net_income=$72.88B는 NVDA 자체 FY2025 실적). 올바른 외부 FY2025 컬럼으로 재대조하니 전 축 3% 이내로 좁혀짐 — 기존 "NVDA 회계연도 라벨" 판정대기 항목(미해결 목록 참조)과 같은 뿌리(calYear 5월 경계 규칙)의 새 증거.
  - **Citigroup(금융)은 상대차 −10~22%로 유독 크다.** SEC 직접대조로 `net_income`·`equity`가 정확히 일치(revenue만 0.51% 차이, 큰 잔차를 설명 못 함) — **분모 오류가 아니다.** 잔차 원인은 재척도 근사의 한계(20개월간 자본정책 변화 미반영)로 추정하나 확정하지 않았다.
  - **EV/EBITDA 성립 여부(금융)**: 우리=`MISSING_MARKET_DATA`(driver5 시장데이터 결측) · 외부=애초에 표시 안 함. 사유는 다르나 결과는 같음(양쪽 다 결측).
  - 🔴 **부분 충족인 이유**: DoD3 원문 취지(계산 정확성 검증)는 5종목 대조로 실질 충족됐으나, 잔차 원인 일부(EV 산식 차이·재척도 근사 오차 크기)를 끝까지 분해하지 못했고 SEC 직접대조는 5종목 중 2종목(AAPL·C)에만 수행했다. 상세 = `docs/probe_958_external_check.json`.
- 🔴 **STEP 958 — 업종별 축 적용성 조사(모델 결함 발견, 판정 대기).** Damodaran 원전 2건(`finsvc.pdf` slide12 · `Investment Valuation` 3rd ed. c21 "Choices in Multiples") + 독립 실무 출처(IB 교육자료 2건) 확인: **Financials 업종은 EV/EBITDA뿐 아니라 PSR도 정의상 미적용**("매출이 측정 가능한 개념이 아니다" — 원문 직접 인용). 🔴 **PSR-Financials는 지금 minSample(20)로 안 가려진다**(실측 n=61, 임계값 이상 — 계산돼 화면에 노출될 예정). Real Estate는 실무출처(4건, Damodaran 직접 서술은 못 찾음)로 PER·PBR이 "계산은 되나 왜곡/비선호"(P/FFO·NAV가 업계표준), EV/EBITDA는 반대로 "REIT엔 정상 적용"(은행과 달리 부채가 정상 자본구조) — 그런데 REIT EV/EBITDA도 minSample(n=4)로 가려져 있어 **"개념상 맞는 축이 표본부족으로 가려지는" 사례**와 **"개념상 안 맞는 축이 우연히 안 가려지는"(PSR-Financials) 사례**가 공존한다. 나머지 9개 업종×4축은 업종별 개별 확인 없이 "적용(일반론)"으로만 채웠다 — 근거 없이 미적용이라 적지 않는다는 원칙을 지킴. 🔴 **`SECTOR_RELATIVE_SPEC`은 이 STEP에서 바꾸지 않는다 — 표만 만들고 장은태 판정을 기다린다.** 전체 44칸 표 = `docs/probe_958_external_check.json`.
  - 🟢 **정정(STEP 959, 2026-08-09)**: "나머지 9개 업종×4축 = 적용(일반론)"은 **근거 없는 표기였다** — 정정한다. 아래 STEP 959가 실제 근거를 찾아 다시 채웠다.
- 🟡 **STEP 959(2026-08-09) — 업종×축 적용성 전수 조사(44칸), Damodaran 라이브 데이터셋 신규 발견.** `data/sources/text/damodaran_data_update_1_2026.html`(기존 저장본)을 재검토하다 Damodaran이 **업종별 배수 데이터셋을 별도 발행**한다는 신호를 발견 → 웹서치로 `pedata.xls`(PE)·`pbvdata.xls`(PBV)·`vebitda.xls`(EV/EBITDA)·`psdata.xls`(Price/Sales) 4개 파일 확보(우리 4축과 정확히 1:1 대응, `data/sources/damodaran_multiples/`에 원본 저장). 이 라이브 데이터로 업종군별 NA 패턴을 직접 집계 — **44칸 중 40칸 적용·4칸 조건부·미적용 0·불명 0**로 갱신(958의 "미적용" 2칸이 더 정밀한 "조건부"로 바뀜, 나머지 9업종은 "일반론"에서 "근거 있는 적용"으로 바뀜). 상세 표·근거·인용 = **`docs/SECTOR_AXIS_APPLICABILITY.md`**(정본) · 원자료 = `docs/probe_959_axis_applicability.json`.
  - 🔴 **현재 뚫려 있는 칸(장은태 판정 대기 중 사실 기록)**: **PSR×Financials는 n=61로 minSample을 넘겨 지금 계산·저장된다.** Damodaran 교과서 원문은 "financial service firms의 매출은 측정 가능한 개념이 아니라 PSR을 못 쓴다"고 명시하나, **판정 전이라 그대로 둔다.** 🟢 **Q1_ENABLED가 OFF라 화면에는 나가지 않는다** — 사용자 피해 없음. 🔑 **단 이번 STEP에서 새로 확인된 사실**: Damodaran 본인의 **라이브 `psdata.xls`(2026-01 갱신)는 Financials 9개 업종군 전부에서 실제로 Price/Sales를 계산해 발행 중이다** — "미적용"이 아니라 "원전 내부에 텍스트(교과서)와 실제 관행(라이브 데이터) 사이 이견이 있다"가 더 정확한 서술이다.
  - **EV/EBITDA×Financials도 정밀화됨**: minSample로 가려져 있는 건 그대로(n=16)이나, 라이브 데이터로 보면 **은행·증권 3개 업종군(615개사)만 개념상 안 맞고, 보험·자산운용 6개 업종군(558개사)은 실제로 계산된다** — 우리 GICS 11섹터 단위가 이 구분을 못 담는다는 구조적 한계도 함께 드러남.
  - **Real Estate PSR은 958의 "불명"에서 "적용"으로 확정**(라이브 데이터 5개 업종군 전부 NA 없음).
  - 처방 후보 4개(제외/표시만가림/조건부표시/대체축) 기록만 하고 고르지 않음. `SECTOR_RELATIVE_SPEC` 무변경.
- 🟡 **STEP 960 §0(2026-08-09) — Damodaran 업종별 4축을 Q1 DoD3 정답지로 쓸 수 있는지 재료 확인, 0단계에서 멈춤.** 🔴 **정정**: 959의 "신규 확보"는 실제로 다운로드·커밋·push까지 끝난 정확한 표현이었다 — 다만 `data/sources/damodaran/`(기존 8종)이 아니라 신규 디렉토리 `data/sources/damodaran_multiples/`에 있어 이후 확인이 헷갈렸다. 실측: ① 어휘 완전 일치 — pedata.xls의 94개 업종명 vs `damodaran_industry.industry_group`(is_us_listed=true) 94개, **대칭차집합 = 공집합**(전수 대조, 표본 아님). 4개 파일 전부 서로 동일한 94개 그룹 사용. ② 4개 파일 FAQ 전문 확인 — **중앙값·백분위 컬럼은 어디에도 없다.** "단순평균(equal-weighted, pedata의 Current/Trailing/Forward PE)" 또는 "가중 합산비율(aggregate ratio of sums, 나머지 전부)" 둘 중 하나뿐. ③ 전부 "US companies" 명시(region 부합) · 갱신일 2026-01-05 단일 스냅샷(우리 as_of=2026-08-08과 약 7개월 차, 개별종목 재척도로는 못 메움 — 이미 여러 종목이 합산된 값이라). 🔴 **어긋나는 지점(결론 아님, 사실만)**: 업종 단위 불일치(GICS11 vs 94개 업종군, 959의 다수결 크로스워크 손실 그대로 남음) · 집계방식 불일치(우리=종목별 백분위 vs Damodaran=업종 대표값 1개, 분포가 아님) · 기준시점 불일치(7개월 차) · **가장 근본적으로 데이터 형태 자체가 다름** — Q0/SPDR 대조는 종목 단위 라벨을 종목 단위로 1:1 대조했는데, Damodaran 배수 파일은 종목별 값을 공개하지 않고 업종 대표값만 준다(grain이 다름). gitignore 선례 3가지 확인(nasdaq=무시·spdr=커밋·**damodaran 원본 8종도 무시**[신규 확인, git 히스토리에 한 번도 없었음]) — 어느 쪽을 따를지 판단 안 함. 상세 = `docs/probe_960_damodaran_multiples_structure.json`. 🔴 **대조 자체는 하지 않음(지시대로 0단계에서 멈춤).**
- 🟡 **STEP 960 §1(2026-08-09) — 업종 대표값 대조 설계(실행 안 함).** §0에서 확인된 3가지 어긋남(단위·집계·시점)을 각각 어떻게 다룰지 설계했다.
  - **① 단위** — `us_valuation`(as_of=2026-08-08) 1,127심볼을 정규화해 `damodaran_industry.ticker_norm`(is_us_listed=true)과 직접 조인(읽기전용 SQL, tier-1 매치와 동일 규칙). **1,005/1,127(89.2%) 매칭**, 94개 업종군 중 **88개가 ≥1종목**(6개는 0 — Broadcasting·Brokerage & Investment Banking·Green & Renewable Energy·Real Estate General/Diversified·Reinsurance·Rubber& Tires). 업종군별 종목 수: 최소1·최대65·중앙값7·평균11.4 — Damodaran 자신의 업종군 표본(예: Banks Regional 568개사)보다 훨씬 얇다. 🔴 **이 재분류는 대조 전용이다 — `SECTOR_RELATIVE_SPEC`의 GICS 11 기준은 그대로다.**
  - **② 집계 방식** — Damodaran FAQ 원문을 그대로 복제: PER(pedata.xls)="Price per share divided by EPS in most recent fiscal year, averaged across all money-making firms"(**단순평균**) · PBR/PSR/EV-EBITDA(pbvdata/psdata/vebitda.xls)="Aggregated [numerator] divided by aggregated [denominator], across all firms in the group"(**가중 합산비율** — 시총 합÷자기자본 합 등). 🔴 **음수 자기자본·음수 EBITDA 회원사를 분모에서 뺄지는 Damodaran FAQ에 명시가 없다 — 불명으로 남기고 우리 처리(제외)를 명시**.
  - **③ 시점(7개월 차)** — 재척도 불가(이미 여러 종목이 합산된 값). **층A(값 대조)**: 자릿수 수준만, 상대차를 정확도로 해석 안 함(7개월 주가변동이 섞여 있음). **층B(순위 대조, 중심)**: 업종군 간 서열이 Spearman 순위상관과 일치하는가 — 순위가 시점에 강한 이유를 siblisresearch.com의 섹터 PE 이력(2025-12-31→2026-06-30, 약 6개월)으로 뒷받침 확인(4개 섹터 절대수준은 전부 변했으나 서열[IT·RealEstate 상위, Financials 하위]은 유지됨). 🔴 **이건 WebFetch 요약모델이 짚어준 4개 섹터·2개 시점뿐이라 "뒷받침 정황"이지 "입증"이 아니다** — 우리가 직접 스피어만 상관을 계산하지 않았다.
  - **검증되는 것 / 안 되는 것**: 이 대조로 검증되는 것 = 4축 계산식의 자릿수 정합성(층A)·업종 간 서열이 독립출처와 맞는가(층B)·특정 업종만 크게 이탈하는지(모델결함 탐지). 🔴 **검증 안 되는 것 = 종목별 백분위가 맞는가다 — Damodaran이 종목별 값을 안 줘서 원리적으로 확인 불가.**
  - **DoD3 관점**: 🔴 **채우지 못한다.** DoD3 원문은 "종목" 단위 요건인데 이 설계는 "업종군"(집계) 단위 — 아무리 정교해도 단위 자체가 다르다. DoD3를 채울 다른 경로(판정 없이 후보만): STEP 958의 stockanalysis.com 종목 대조를 5→N종목으로 확장(이미 작동 확인) · macrotrends/gurufocus의 403 우회 조사 · stockanalysis.com 벌크 엔드포인트 유무 확인.
  - **실행 설계(안 돌림)**: symbol→industry_group 맵(이미 프로토타입 검증) → 88개 업종군별 우리 대표값 계산(§1-2 정의) → Damodaran 4개 xls 값과 나란히(층A) → 축별 Spearman 4개(층B) → 이탈 업종군 표시. 🔴 **SEC·야후 호출 불필요 — 전부 이미 저장된 값 + 이미 다운로드된 로컬 파일만 읽으면 된다.** 상세 = `docs/probe_960_compare_design.json`.
- 🟡 **STEP 962(2026-08-09) — Q1 4축 정의 정밀화(판정 재료만, SPEC·`lib/valuation.ts` 미변경).** SEC 신규 호출 78건(companyfacts, 150ms 간격·순차·429 없음, 캐시 재사용 23건 포함 표본 100종목+Citigroup).
  - **PBR 분모 3후보 실측**(위 미해결 3번에 통합 기록) — 후보ⓑ(보통주장부가) p90 절대상대차 3.21%·후보ⓒ(유형장부가) 12/49 음수전환.
  - **PSR 종목단위 정의**(위 미해결 1번에 통합 기록) — 못 찾음 재확인.
  - **EV/EBITDA 현금 범위** — Damodaran `variable.htm`: *"Cash and Marketable Securities reported in the balance sheet."*(제한현금 포함여부 불명기재). 우리 현재식(제한현금포함 태그 우선+증권 4종 합산)은 큰 틀에서 정합. 100종목 중 32종목 실측 — 현금 태그 자체는 종목별로 최대 84~98% 차이나지만 EV/EBITDA 전체 영향은 median 0.003%·p90 5.75%·max 9.2%로 완화됨. 🔴 **STEP 958의 EV/EBITDA 이상치(AAL +7.10%) 원인 재확인 — 설명 안 됨.** AAL은 `CashAndCashEquivalentsAtCarryingValue` 태그 자체가 없어(제한현금포함 태그만 존재) 두 정의 중 고를 여지가 없다 — EV/EBITDA가 완전히 동일하게 나온다. AMT(Real Estate, −7.56%)는 표본 밖이라 미확인.
  - **PER 우선주 배당 차감 — 신규 조사(못박은 적 없던 항목, 아래 신규 7번으로 등재).**
  - 상세 원자료 = `docs/probe_962_definition_refine.json`. 🔴 **판정 없음 — 장은태가 축별로 고른다.**
- ✅ **STEP 963(2026-08-09, 장은태 위임→Cowork 판정) — PER·PBR 보통주 기준 구현·백필 완료.** 착수 전 코드로 확인: `DriverFundamentals`(netIncome·equity·commonEquity 등)는 `DriverBundle`(driver 1~5 계산)과 완전히 분리된 구조체이고 `lib/revdcf/engine.ts`·`compute.ts`는 `dr.fundamentals`를 참조하지 않음(grep 확인) — **역DCF 무영향 확정 후 착수.**
  - **§1 태그존재율(190종목 표본, 시총상위100+사전순100 — 대형은행 포함 목적 명시)**: `NetIncomeLossAvailableToCommonStockholdersBasic` 54/156(34.6%) · `PreferredStockValue`류 태그존재 76/156(대부분 명시적 $0)이나 **실제 0 아닌 값은 6/156뿐**(ALB·ALLY·C·HWM·PG·V) · `MinorityInterest` 72/156(46.2%). Financials 19/190(10.0%, 962의 2/100보다 대표성 개선).
  - **§2 코드 변경**: `NET_INCOME` 배열 재정렬(새 태그 0개, coalesceMap 로직 무수정) · `commonEquity`(=equity−우선주−[NCI포함태그일때만]비지배지분) 신규 필드(`equity`는 보존) · `us_fundamentals`에 `common_equity`·`preferred_stock`·`minority_interest` 3컬럼 추가(마이그레이션) · `lib/valuation.ts` formula 문자열 갱신(계산함수 무수정) · `annualMap`·`coalesceMap`·태그배열 export 추가(재사용용, 동작무변경) · 테스트 7건 신규(332/332 통과).
  - **§3 영향 실측(1,127종목 전량, SEC companyfacts 신규 932건·429 0건)**: 🔴 **1차 시도가 `computeDrivers()`를 그대로 호출해 "오늘 기준 최신연도"로 재해석되는 함정에 빠짐**(PER 중앙값 19.5%라는 비현실적 결과로 발견 — 미해결0번의 "옛창·새창 혼입" 실제 재현 사례) → `annualMap`/`coalesceMap`을 저장된 `fiscal_year`에 고정해 재추출하는 것으로 정정. **PER**: 절대상대차 중앙값 0%·p90 1.0%, 새로 unavailable 3건(APG·FTAI·QXO — 우선주배당 차감 후 보통주귀속 손실 전환, 원래도 PER 72~2558배로 이익이 얇았던 종목, 경제적으로 유효). **PBR**: 중앙값 0%·p90 0%, 새로 unavailable 0건(예측 1건보다 적음). **Financials(61종목) p90 8.8%.** 🔴 **예상과 다른 것 — Utilities(38종목) p90 11.8%로 Financials보다 큼**(규제 유틸리티 VST·NRG·AES·EIX·PCG·D의 전통적 우선주 자본조달 관행, 실측 확인). Citigroup: PER 17.856→19.764(−9.65%)·PBR 1.0856→1.1872(−8.56%) — 장은태 제공 수치와 정확 일치.
  - **§4 적재**: `us_fundamentals_snapshot`(tag=`pre_step963`) 1,127행 선스냅샷 → `us_fundamentals` 930행 갱신(197행은 fiscal_year 미확보라 무접촉) → `us_valuation`(as_of=2026-08-08) 930행 갱신(price·market_cap은 기존값 그대로 — 시점오염 방지) → `us_sector_relative`(`computeSectorRelativeBatch` 순수함수 재사용, 로직복제 없음) 1,127행 재계산. 백필 후 행수 전부 불변(us_valuation 1,127·us_fundamentals 1,127·us_sector_wide 1,127·**revdcf_results 604**) — 🔴 **revdcf_results verdict 분포·AAL(value_destroying)·AAPL(over_cap)·NVDA(years·gap5) 개별 확인 전부 백필 전과 동일**, 코드상 `dr.fundamentals`를 참조하는 곳이 route.ts의 `fundamentalsRow()`(Q1 전용) 하나뿐임과 정합.
  - 🔴 **PSR·EV/EBITDA는 등재만 하고 손대지 않음**(아래 항목 1·962 EV/EBITDA 단락) · Citigroup Revenues 이중값(제출버전 문제)은 STATE.md 신규 항목.
  - 상세 원자료 = `docs/probe_963_definition_apply.json`.
- 🟡 **STEP 964(2026-08-09) — 잔여 계측 결함 정리 + 제출버전(vintage) 정책 재료. 조회 전용(DB 무변경·SEC 신규호출 0, 캐시 1,127종목 전량 재사용).**
  - **925 vs 930 규명 — 완료.** `net_income`/`fiscal_year`가 채워진 930행 중 **5행**(`ANDG`·`CNK`·`CQP`·`LGN`·`MDLN`)은 `common_equity`가 null이다. 원인 = 963의 계산 버그가 아니라 **이 5종목은 963 이전부터 `equity` 자체가 null**이었다(`us_fundamentals_snapshot(tag=pre_step963)` 대조로 확인 — `StockholdersEquity` 계열 태그가 애초에 그 회계연도에 안 잡힌다). `commonEquity`는 `equity`에서 파생되므로 분모가 없으면 자동으로 null. STEP 963 보고서의 "930행"은 스크립트의 `updates.length`(순이익 재계산 성공 건수)를 가리킨 것으로, "common_equity가 채워진 행 수"와 같다고 명시하지 않은 표현상 정밀도 문제였다 — 계산 로직 자체엔 결함이 없다.
  - **preferredStockUnknown = 496/930(53.3%)**. 세분화하면 **363건(73.2%)은 `PreferredStockValue`류 태그가 그 회사의 XBRL facts에 아예 한 번도 등장하지 않고**(강한 "우선주 미발행" 신호), **133건(26.8%)은 다른 회계연도엔 태그가 있으나 하필 그 종목의 고정연도(ly)에만 없다**(더 약한 신호, 진짜 "모른다"에 가깝다). 963의 190종목 표본 결과(태그 키 존재 76/156 중 실제 0 아닌 값은 6/156)와 정합 — 태그가 있어도 대부분 $0으로 명시적으로 채워지는 관행이 있다는 점과 겹쳐 읽으면, "태그 부재"가 "우선주 없음"에 가깝다는 정황은 쌓이지만 **100% 확정은 아니다**(개별 10-K 원문 대조는 이 STEP 범위 밖).
  - **commonEquityNciNotSubtracted = 34/930(3.7%)** — 훨씬 작다. 섹터별 발생률: Utilities 4/38(10.5%, 최고) · Financials 5/61(8.2%) · Health Care 5/160(3.1%). 🔴 **963이 발견한 "Utilities p90 11.8% > Financials p90 8.8%"의 일부는 이 미차감 잔차가 기여했을 가능성이 있다**(Utilities의 NCI 미차감률이 표본 내 최고) — 단 인과관계는 확인하지 않았다.
  - **preferredStockUnknown의 섹터 분포는 963의 우려(Financials·Utilities 편중)를 반증한다** — 오히려 Financials(41.0%)가 12개 섹터 중 **가장 낮은** 발생률이고(우선주를 실제로 발행하는 업종이라 태그가 채워지는 경우가 많다는 뜻과 정합), Materials(70.0%)·Energy(69.0%)·미분류(73.3%)가 가장 높다.
  - 상세 = `docs/probe_964_residuals.json`.

7. ✅ **PER 분자 — 우선주 배당 차감(2026-08-08 STEP 962 발견 → 2026-08-09 STEP 963 구현 완료).** Damodaran `pedata.xls` FAQ는 "Price per share divided by EPS"라 하는데 GAAP `EPS` 자체가 이미 "보통주 귀속 순이익 ÷ 가중평균 보통주식수"로 정의된다(FASB ASC 260) — 즉 원문이 말하는 "EPS"는 우선주가 있는 기업에서 이미 우선주 배당을 뺀 값이다. **963이 `NET_INCOME` 배열을 `NetIncomeLossAvailableToCommonStockholdersBasic` 최우선으로 재정렬해 구현·백필 완료.** Citigroup 실측 그대로 반영: PER 17.86→19.76(−9.65% 이동). STEP 958 대조 잔차(−21.43%)는 조정 후 −13.04%로 줄지만 **PBR만큼(−1.72%) 깨끗이 안 닫힌다** — 여전히 큰 잔차가 남고, 이건 숨기지 않는다.
