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
| **PER** | `marketCap / netIncome` | **연간(FY) 고정**(장은태 판정 2026-08-08 — 분기 TTM은 이 STEP 범위 밖) | `netIncome <= 0` · `netIncome == null` |
| **PBR** | `marketCap / equity` | 최신 회계연도(FY) | `equity <= 0` · `equity == null` |
| **PSR** | `marketCap / revenue` | 최신 회계연도(FY) | `revenue <= 0` · `revenue == null` |
| **EV/EBITDA** | `(marketCap + debt - nonOperatingAssets) / (operatingIncome + dna)` | 최신 회계연도(FY) | `ebitda <= 0` · `operatingIncome == null` · `dna == null` · 🔴 **`debt == null` 또는 `nonOperatingAssets == null`**(아래 "코드가 스펙보다 넓힌 것" 참조) |

**분자(공통) 출처** — `us_market_cap.market_cap`(최신 `as_of`, US 크론이 매일 갱신). 5-5 확정대로 **주가에서 시총을 역산하지 않는다** — `market_cap`을 그대로 쓴다.

**분모 출처 — SEC XBRL `us-gaap` 태그(`lib/revdcf/drivers.ts`의 `NET_INCOME`·`EQUITY`, 기존 `REV`·`OperatingIncomeLoss`·D&A 체인 재사용)**

| 필드 | 태그(우선순위 — coalesce, 첫 매치 채택) | 비고 |
|---|---|---|
| `netIncome` | `NetIncomeLoss` → `ProfitLoss` → `NetIncomeLossAvailableToCommonStockholdersBasic` | flow(연간 duration 300~400일) |
| `equity` | `StockholdersEquity` → `StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest` → `CommonStockholdersEquity` | stock(시점) · 🔴 **2번째 태그는 비지배지분이 섞인다** — 아래 미해결 참조 |
| `revenue` | 기존 역DCF `REV` 4종 태그(항등식 선택, `drivers.ts:39`) | 재사용, 새 태그 없음 |
| `operatingIncome` | `OperatingIncomeLoss` → (매출−`CostsAndExpenses`) → (세전이익+이자비용) | 재사용 |
| `dna` | 기존 D&A 우선체인(합계 태그 → 감가+무형 분리합산, `drivers.ts:51~55`) | 재사용 |
| `debt`·`nonOperatingAssets` | 기존 역DCF 시장 부분(`drivers.ts` 부채·비영업자산 계산) | 🔴 **driver 파이프라인 전체가 성공(`ok:true`)해야만 채워진다** — PER·PBR·PSR·매출/영업이익/D&A와 달리 5년 게이트 뒤에서 계산되기 때문(아래 "코드가 스펙보다 넓힌 것" 참조) |

**모든 값은 어느 회계연도(`fiscalYear`)에서 왔는지, 어느 태그에서 왔는지(`sourceTags`)와 함께 저장된다**(`us_fundamentals.fiscal_year`·`source_tags` — 규칙 5-2 ④, 결과에 출처를 실어 보낸다).

## 🔴 코드가 이 표보다 넓힌 것 — `debt`·`nonOperatingAssets` null 처리

`lib/valuation.ts`의 `unavailableWhen`은 STEP 947 커맨드가 준 원문 그대로 `ebitda<=0`·`operatingIncome==null`·`dna==null` 셋만 나열했다. 구현하면서 **네 번째 조건을 추가했다**: `debt`나 `nonOperatingAssets`가 `null`이면(아직 계산 안 됨 — driver 파이프라인이 5년 게이트 중 하나에서 이미 멈췄다는 뜻) EV/EBITDA도 미성립으로 둔다(`MISSING_MARKET_DATA`).

**왜**: `operatingIncome`·`dna`는 이제(§2) 5년 게이트 **앞**에서 수집되어, 회사가 나중 단계(PP&E·유동자산·현금흐름·주식수)에서 걸려도 값이 남아 있을 수 있다. 반면 `debt`·`nonOperatingAssets`는 여전히 게이트를 전부 통과해야만(`ok:true`) 계산된다. 이 둘이 없는데 `0`(무차입)으로 가정하면 **"모른다"를 "무차입이다"로 둔갑**시키는 것이라 규칙 5-1 ⑤ 위반이다. 그래서 원문 스펙보다 조건을 하나 더 넣었다 — 값이 아니라 **누락 사유를 정직하게 넓힌** 것이며, PER/PBR/PSR 세 식은 원문 그대로 손대지 않았다.

## 외부 근거

- **EV 정의·현금 정합성** — Damodaran, *vebitda.pdf*: *"Market Value of Equity + Market Value of Debt − Cash."* 현금을 분자에서 빼면 분모(EBITDA)에서도 현금성 이자수익이 빠져야 정합한데, 우리 EBITDA(`operatingIncome + dna`)는 애초에 이자수익이 안 들어가 있어 정합한다.
- **자기자본 정의** — Damodaran, *pbv.pdf*: 보통주 장부가(common equity book value) 기준이어야 한다는 근거 — `StockholdersEquity`(비지배지분 제외)를 1순위로 둔 이유.
- **음수 PER 처리 관행** — Stock Analysis 용어 페이지: 음수 PER은 통상 `n/a`로 표기하는 것이 관행.
- 🔴 **미확보**: 위 두 Damodaran PDF는 `data/sources/`에 원문이 저장돼 있지 않다(SEC CIK 파일과 달리 이번 STEP이 로컬 원본 확보를 지시하지 않았음). 이 절의 인용은 STEP 947 명령서 원문을 따른 것이고, **PDF 원문 재대조는 이번 세션에서 하지 않았다** — ⓪ 원전 인벤토리 규칙상 남은 빚으로 기록한다.

## 🔴 아직 못 푼 것 6개

0. ✅ **YS 고정창 결함 — 해소(STEP 951, 2026-08-08 장은태 판정).** 원래 문제(STEP 950): `lib/revdcf/drivers.ts:12`의 `const YS = [2020, 2021, 2022, 2023, 2024]`가 하드코딩이라 최신 회계연도 1~2년이 누락돼 **4축 전부가 영향**(NVDA PER 64.7%·AAPL PER 19.5% 과대). **951 — `resolveYearWindow()`로 전환**: 창 정의 = 종목별 실재 최신 5개 연도(매출 기준·연속·오늘 날짜 유도 상한, 정의 전문 = `docs/REVDCF_SPEC.md` §10-A). 30종목 검증 — **30/30 창 해소**, NVDA `fiscalYear=2025`(=NVDA 표기 FY2026, 매출 215,938,000,000·순이익 120,067,000,000)·AAPL `fiscalYear=2025`(매출 416,161,000,000·순이익 112,010,000,000) 둘 다 SEC 원문과 정확 일치. `fiscal_year`가 이제 매년 자동으로 올라간다(2024 고정 → 종목별 최신). 🔴 **과거 `us_valuation`/`us_fundamentals` 행은 재계산하지 않는다** — 다음 정규 크론부터 새 창이 적용되며, 그 전까지 DB엔 여전히 옛 창 값이 있다(`fundamentals_fiscal_year`가 951 이전 행은 대부분 2024, 이후 행부터 종목별로 다르다). 상세 = `docs/probe_951_verify.json`.
   🔴 **적용 경계(Q1 관점, 못박기) — 2026-08-08 push `e39595d`, 첫 정규 크론 🔴 2026-08-10 07:45 KST(정정 — 2026-08-09 07:45 KST 크론은 배포보다 먼저 돌아 옛 코드로 실행됨, `us_fundamentals` 22시대 723행 중 669행이 `fiscal_year=2024`로 실측 확인. 새 창의 첫 실행은 `2026-08-09 22:45 UTC`이며 `revdcf_results as_of='2026-08-09'`로 쓰인다)**: `us_fundamentals.fiscal_year`/`us_valuation.fundamentals_fiscal_year`가 종목별로 갈리기 시작한 행 = 새 창(951 이후). 대부분 2024로 고정된 행 = 옛 창(951 이전). **두 구간을 시계열로 이어 읽지 말 것** — PER·PBR·PSR·EV/EBITDA가 회사 실적 급변이 아니라 관측 연도 이동으로 크게 튈 수 있다. 🔴 `us_fundamentals`는 symbol PK upsert라 크론이 돌 때마다 이전 값이 사라진다 — **`us_fundamentals_snapshot`(tag=`pre_step951`, 2026-08-08, 1,127행)에 옛 창 원시 재무를 떠 뒀다** — 951 이전/이후 원시값(net_income·equity·revenue·operating_income·dna) 비교는 이 스냅샷을 before로 쓴다. 임시 테이블이며 쓸모가 끝나면 지운다.
   🔴 **정정 — 「나머지」 유니버스 순환 속도, STEP 947 추정 철회(2026-08-08).** STEP 947 §4는 `us_market_cap` 유니버스(5,497건)까지 넓힌 나머지 종목을 "`us_fundamentals.fetched_at` 오래된 순 자동 순환"으로 채운다고만 적었을 뿐 구체적 소요일수를 문서에 남기지 않은 줄 알았으나 — 🔴 **재정정(같은 날, Cowork 3중 검수) — "문구 자체가 어디에도 없었다"는 앞선 결론이 틀렸다.** grep 대상을 `VALUATION_SPEC.md`·`STATE.md`·`CHANGELOG.md` 3개(당시 표현은 "4개"라 적었으나 실제 실행은 3개+`REVDCF_SPEC.md` 확인뿐 — `LENS_COMPLETION_STANDARD.md`가 범위에서 빠졌다)로 좁힌 게 결함이었다. `docs/LENS_COMPLETION_STANDARD.md:104`에 **"3일 순환 완료 후"라는 원문이 실재했다**(정정 완료, 아래 실측으로 대체). **`us_fundamentals` 순증은 하루 약 124건**(1,003→1,127, STEP 948 수동실행 12시대 이후 정규크론 22시대 1회분). 크론이 쓴 723행 중 대부분은 역DCF 유니버스 604를 매일 다시 도는 몫(대기열 최우선)이라 "나머지"의 실제 순증은 이보다 적다 — **이 속도면 5,497 전량까지 대략 35일**(정밀 계산 아님, 1일 관측치의 단순 외삽). 🔴 **근본 원인 — 정규 크론 실행의 응답이 어디에도 저장되지 않는다**(상세 = `docs/STATE.md` 00-d) — 그래서 이 순환 속도의 병목이 처리량(항목 수) 자체인지 예산(`BUDGET_MS=270,000ms`) 소진인지조차 미측정이다. 처방은 판정 대기(장은태) — 후보: ① 역DCF 604를 매일 전량이 아니라 격일/주간으로 돌려 "나머지" 처리량을 늘린다 ② 크론 예산 여유를 00-d 해소 후 실측으로 먼저 잰다.

1. **PSR 표준 정의 원문 미확보** — "매출총이익 대비"인지 "매출 대비"인지 등 세부 관행의 1차 출처를 아직 찾지 않았다. 지금 정의(`marketCap/revenue`)는 가장 널리 쓰이는 형태를 그대로 채택한 것이지, 원문 대조를 거치지 않았다.
2. **다중 클래스 주식(GOOG/GOOGL 등) 시총 합산 미해결** — 현재 `us_market_cap`은 **클래스별로 별도** 값을 갖는다(`resolveSector`의 형제 매칭과 달리, 시총 자체를 합산하는 로직이 없다). PER·PBR 등은 클래스별로 각각 계산되며, 통합 시총 기준 배수와 다를 수 있다.
3. **`StockholdersEquity`에 비지배지분이 섞이는 변형** — 2순위 태그(`StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest`)를 쓴 기업은 PBR 분모가 순수 보통주 지분보다 크게 잡힐 수 있다. **추적만 한다** — `source_tags.equity`에 실제 채택 태그를 기록해 사후에 걸러낼 수 있게 해 두었을 뿐, 자동 보정은 하지 않는다. 🔴 **실측(STEP 948, 2026-08-08)**: `equity`를 확보한 851건 중 **48건(5.64%)**이 이 2순위 태그를 채택 — "가능성 있음"이 아니라 실측치. 이 48건은 PBR이 실제보다 낮게(저평가로) 잡혀 있을 수 있다는 뜻이며, 자동 보정은 여전히 안 함.
4. **야후 대비 상대차 미측정** — 🔴 **원인은 STEP 948 명령서 §5의 전제 오류다** — "`lens_scores`에 야후 원시 PER이 저장돼 있다"고 썼으나 실제로는 파생 점수(`valuation_value`·`valuation_state`)만 있고, 원시 `trailingPE`·`priceToBook`은 어디에도 저장되지 않는다(`lib/lensCompute.ts`의 즉시계산 값). 따라서 **`lensCompute.ts` 교체 판정의 근거가 아직 없다** — 측정 수단(라이브 재조회 방식 등) 설계가 선행돼야 한다.
5. **`us_market_cap` 결측으로 4축이 전부 안 나오는 종목이 있다** — Cowork 교차검증(2026-08-08, `docs/probe_948_live.json`의 `cowork_crosscheck`)이 발견·Claude Code가 재확인: 68종목(`ACM`·`ADI`·`AIT`·`APA`·`AZO`·`BBY`·`BDX` 등 다수 S&P 500 대형주 포함)이 `us_market_cap`의 최신 `as_of`(2026-08-07)에 행이 없고 **2026-07-30 등 옛 `as_of`에만 값이 있어** 분자(시총)가 없다. 🔴 **「계산이 안 된 것」이 아니라 「분자가 없는 것」이다** — 구분해서 읽을 것. 🔴 **날짜 우연 일치, 인과 미확인**: 2026-07-30은 US `lens_cuts`가 정지된 바로 그 날짜다(`STATE.md` ▶다음 00번) — 같은 원인인지는 확인하지 않았다.
6. **NVDA 회계연도 라벨 — 표시 문구 판정 필요(2026-08-08, 판정 대기).** 우리는 NVDA를 `fiscal_year=2025`로 라벨하는데(`calYear`의 5월 경계 규칙 — 종료월≤5월이면 전년도 귀속) NVDA 자신은 이 회계연도를 **FY2026**이라 부른다. 값(매출 215,938,000,000·순이익 120,067,000,000)은 SEC 원문과 정확히 일치하나, 화면에 「2025년 실적」으로 표기하면 사용자가 틀렸다고 볼 수 있다. **표시 문구 판정 필요(장은태)** — Q1 카드 작업 시 함께 정한다.

## 「업종 대비」 — 정의 공개표 (STEP 952, 2026-08-09 장은태 판정)

🔴 **원전 없음 — 규칙 5-1 트랙.** 백분위로 업종 대비 위치를 매기는 것은 회계 관행이나 학술 정의가 아니라 우리가 고른 산술 방법이다. 정의를 하나로 고정하고 여기 공개한다. **유일한 출처 = `lib/sectorRelative.ts`의 `SECTOR_RELATIVE_SPEC`**(규칙 5-2 ⑤) — 아래는 그 객체를 그대로 옮겨 적은 것이다.

```
method: "percentile"
direction: "higher_is_more_expensive"   // 4축(PER·PBR·PSR·EV/EBITDA) 전부 값이 클수록 비싸다
axes: ["per", "pbr", "psr", "evEbitda"]
sectorSource: "us_sector_wide"
percentileFn: "empirical_rank"          // count(v < target) / n_valid — 아래 계산 정의 그대로
minSample: null                          // 🔴 미정(장은태 판정 대기, 아래 §minSample 재료 참조)
unavailableWhen: ["sector == null", "축 값이 없음(us_valuation.unavailable에 사유 있음)", "업종 내 유효 표본 < minSample"]
```

**계산 정의**: 한 종목의 백분위 = 같은 업종·같은 축에서 **그 종목보다 값이 작은 유효 종목의 비율**(`count(v < target) / n_valid`). 값이 없는 종목(결측)은 분모·분자에서 뺀다(0으로 치지 않는다). 동점인 종목들은 서로를 "작다"고 세지 않으므로 같은 백분위를 받는다(중간순위 보정 없음). 🔴 이 함수는 `lib/sectorCuts.ts`의 `pctile()`(백분위→값, type-7 분위수)과 **수학적으로 반대 방향**이라 그 함수를 그대로 재사용하지 않았다 — `pctile`을 부르면 정의 문장과 실제 동작이 어긋난다(분모가 `n-1` vs `n`으로 다름). 상세 = `lib/sectorRelative.ts` 코드 주석.

**섹터 출처 — 5단계 그대로, `resolveSector()`를 수정 없이 재호출**(0순위 SPDR·1순위 Damodaran 직접·2순위 형제클래스·3순위 야후·4순위 미분류). `us_valuation` 최신 as_of(2026-08-08) 1,127종목 전체에 적용한 실측(Q0 1,021 기준과 나란히):

| 출처 | Q0(1,021, STEP 939~942) | 952(1,127) |
|---|---|---|
| spdr(0순위) | 498 | 402 |
| damodaran(1순위) | 311 | 601 |
| damodaran-sibling(2순위) | 5 | 5 |
| yahoo(3순위) | 207 | 29 |
| 미분류(4순위) | 0 | 90 |

🔴 **단순 확장이 아니다 — 두 유니버스는 부분집합 관계가 아니다.** `us_sector_wide`(952, 1,127종목)와 `us_sector_resolved`(Q0, 1,021종목)의 교집합은 **640종목뿐**(직접 교차대조, 불일치 0건 — 같은 함수·같은 입력이면 같은 결과가 나옴은 확인됐다). 나머지는 서로 다른 유니버스 소속이다 — `us_valuation`(SEC XBRL 기반, `us_cik_map ⋈ us_market_cap`)과 `lens_scores`(Q0 원 유니버스)가 애초에 다른 파이프라인이라 종목 구성이 갈린다. 이 때문에 spdr 절대건수가 늘지 않고 오히려 줄고(498→402), damodaran이 거의 두 배(311→601)로 늘고, 미분류 90건이 새로 생겼다 — **1,127 유니버스에 SPDR 미커버 소형주가 대거 포함**된 결과로 해석되나 원인은 이 STEP에서 조사하지 않았다(추정, 미확인).

🔴 **섹터표가 둘로 갈려 있다 — `us_sector_resolved`(화면용, 1,021)와 `us_sector_wide`(계산용, 1,127).** 이유 = **라이브 화면 변경 회피.** `app/api/sector/us/route.ts`가 `us_sector_resolved`의 최신 `as_of`를 그대로 노출하고 `ExploreClient.tsx:467`이 그 값으로 Explore 화면의 거래대금 목록 라벨·필터칩 카운트를 그린다 — 여기 새 `as_of` 행을 넣는 순간 라이브 화면이 바뀐다. Q1은 아직 화면이 없으므로(카드 자체가 없음) 별도 테이블(`us_sector_wide`)에 격리해 계산 재료로만 쓴다. **컬럼 구성은 동일하게 맞췄다** — 통합 판정이 나면(예: Q1 카드 출시 시 `us_sector_resolved`를 이 넓은 유니버스로 교체) `toResolvedRows()` 그대로 옮겨 쓸 수 있다. **통합 여부·시점은 판정 대기(장은태) — Q1 카드 작업 시 함께 정한다.**

**미분류 90종목 전수**(`docs/probe_952_sector_wide_step1.json` 참조): 대부분 소형주·클로즈드엔드펀드(`BME`·`CII`·`CIK`·`CRF`·`DHY`·`FLC` 등)·해외 ADR. `AKO-A`/`AKO-B`처럼 구두점이 있는데도 형제매칭에 안 걸린 케이스 포함(2순위는 Damodaran 내부 형제만 봄 — SPDR/야후에 없고 Damodaran에도 없으면 3개 tier 전부 실패).

🔴 **미분류 = 재료 부재가 아니다(2026-08-09 실측, `docs/probe_952b_unclassified.json`).** 90건 중 `us_cik_map` 90건(100%) 존재. **아래 두 수치는 Cowork이 먼저 제시한 값(damodaran 53건/58.9%·nasdaq 88건/97.8%)을 Claude Code가 Supabase 직접 재조회로 독립 재검증해 다르게 나온 결과다 — 원 수치를 정정한다**(90종목 모집단 자체·사전순 표본 20개는 재현 일치 확인됨):
- `damodaran_industry`: 정규화 매칭 시 **29건(32.2%)**에 실제로 행이 존재(원 보고 53건은 `ticker_norm`이 여러 나라 기업에 중복 매핑돼 부풀려진 JOIN 행수였다 — 서로 다른 심볼 기준으로 세면 29건). 그중 `is_us_listed=true` 행을 가진 것은 **1건뿐**(`RAYA` — 미국 상장 중국기업, `primary_sector="Industrials"`).
- `us_sector_nasdaq`: 원시 존재 **90건(100%)**이나, `resolveSector`는 나스닥을 분류 tier로 쓰지 않는다(`crossCheck` 전용) — 5순위로 새로 추가할 경우 실제로 쓸 수 있는 건 `NASDAQ_TO_GICS` 매핑 성공분(`Miscellaneous`·결측 제외)뿐이며 그 수는 **79건(87.8%)**이다(원 보고 88건과도 다름, 집계 방식 차이로 추정·미확인).

### 🔴 damodaran tier 조사 완료(STEP 952b, 2026-08-09) — 원인 규명, 처방 미정

`docs/probe_952b_damodaran_tier.json` 참조. **원래 가설(ticker_norm 중복=RAYA형)은 틀렸다** — 조사 중 그보다 크고 일반적인 버그를 발견했다.

🔴 **핵심 발견 — `resolveSector()`는 동일 입력으로 반복 호출해도 결과가 매번 다르다.** `lib/sector.ts`의 `fetchAll()`(damodaran_industry·us_sector_nasdaq·us_sector_yahoo·us_sector_gics 4개 fetch 전부, `:21`·`:64`)이 `.order()` 없이 `.range()`만으로 페이지네이션한다 — PostgreSQL/PostgREST는 `ORDER BY` 없는 쿼리의 행 순서를 실행마다 보장하지 않으므로, 별개의 `.range()` 호출(페이지)들이 실행마다 다른 스캔 순서를 쓰면 경계에 걸친 행이 어느 페이지에도 안 들어가는(누락) 일이 생긴다. **실측**: 동일 인자로 `resolveSector()`를 5회 연속 호출 — `damodaran_industry(is_us_listed=true)`의 `COUNT(*)`는 매번 6,937로 고정(데이터는 안 바뀜)인데 분류 성공 건수는 **1038/1038/1032/1038/1038**로 흔들렸다(미분류 89/89/95/89/89). `RAYA`는 이 5회 전부 성공했다 — 즉 RAYA가 "항상" 실패하는 게 아니라, 어떤 실행에서는 RAYA가, 다른 실행에서는 무작위로 다른 6개 심볼이 빠진다.

**29건 분류(A~E 대신 실측대로)**: **F(페이지네이션 비결정성) 1건**(`RAYA` — 이번 `us_sector_wide` 적재 실행에서 우연히 걸림) + **B(is_us_listed=false, 설계대로 제외) 28건**(`AERO`·`ALM`·`API`·`ASM`·`MSC` 등 — Damodaran이 애초에 미국 상장으로 분류 안 함, 버그 아님) + C(industry_group 결측)·D(티커 표기 불일치)·E(그 외) = **0건**(29건 전부 정규화 매칭 자체는 성공).

🔴 **Q0(1,021종목)에도 같은 흔적이 있다.** `us_sector_resolved`의 `source='yahoo'`(tier-3) 207건 중 **5건**(`PTGX`·`TEAM`·`TIGO`·`WMS`·`WTRG`)이 실제로는 `damodaran_industry`에 `is_us_listed=true`·`primary_sector` 존재 행을 갖고 있다 — tier-1(damodaran)이 잡았어야 정상인데 tier-3까지 내려갔다. 이 5건은 SPDR 494종목 정답지(`us_sector_gics`)에는 없어 **"Damodaran vs 진짜 GICS 99.6%(492/494)" 수치가 이 증거로 직접 영향받았는지는 확인도 반증도 안 된다.** Q0의 "미분류 0건·커버리지 100%"라는 최종 숫자 자체는 오늘 재확인해도 참이다(재확인 완료) — 그러나 **source 라벨(어느 tier가 잡았다는 귀속)의 정확성과 최종 sector 커버리지는 다른 질문**이며, 그 실행의 tier 배정이 항상 결정론적이었다는 보장은 없다.

🔴 **처방 후보(고르지 않음, 판정 대기)**: ① `fetchAll()`의 모든 `.range()` 호출에 안정적인 `.order()` 추가(비용: 소폭 성능저하 가능·다른 fetchAll류 함수도 같은 패턴인지 확인 필요, 이 STEP에서 미조사) ② damodaran tier의 `is_us_listed` 필터 완화(비용: 설계 변경, 28건 B형에 영향) ③ 현행 유지(비용: 비결정성 자체는 남음).

🔑 **질적 결론은 유지된다** — 미분류가 "정보 자체가 없어서"가 아니라 **있는데 안 붙는** 경우가 존재한다(29건 중 1건 확정, 판정 대기 상태로 나머지 재확인 필요). 다만 규모는 최초 보고(53건)보다 작고(29건), 원인은 예상(ticker_norm 중복)과 다르다(fetchAll 페이지네이션 비결정성).

**미성립 조건 전수** — `unavailableWhen` 그대로 3가지: ① `sector == null`(위 미분류 90종목) ② 축 값 자체가 없음(`us_valuation.unavailable`에 사유 있음 — `NEGATIVE_EARNINGS`·`MISSING_NET_INCOME` 등, `lib/valuation.ts` 기존 정의) ③ 업종 내 유효 표본 < `minSample`(아직 미정, 아래 재료 참조).

### 🔴 minSample 재료(숫자는 고르지 않았다 — 장은태 판정 재료만)

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

**Q0 선례**: `sector_cuts`(섹터×지표 컷)는 78개 조합 중 **7개를 IQR 대비 폭 1.0 초과로 제외, 71개(91%) 적용**(STEP 943~944, `docs/CHANGELOG.md` 검증 완료 — 표본 크기가 아니라 부트스트랩 분산 기준이었다는 점은 다르다). 여기서는 표본 **개수** 하한(`minSample`)을 판정해야 한다 — 위 표가 그 재료다.

## 🔴 성립하지 않는 경우 — 커버리지 결측 12종목(2026-08-08 실측)

`us_market_cap` 최신 `as_of`(2026-08-07) 5,509종목 중 **12종목(0.22%)**은 `data/sources/sec/company_tickers_exchange_20260802.json`에 티커가 없어 **CIK를 못 얻었다.** 이 12종목은 `us_cik_map`에 아예 들어가지 않으므로(CIK를 모르는 채로 넣지 않는다 — 지어내지 않는다) **4개 축 전부 값이 없다.**

전수: `CNSY` · `FRBA` · `GRSD` · `HIFS` · `QNME` · `RCBC` · `SSBI` · `STLN` · `TCGX` · `TONT` · `TOWN` · `YARW`

🔴 **원인은 조사하지 않았다.** 목록에 `HIFS`·`TOWN`·`FRBA` 등 현재 상장·보고 중인 것으로 보이는 이름이 포함돼 있어, 상장폐지가 아니라 SEC 파일의 누락일 가능성이 있으나 **확인하지 않았다.** 「없다」가 아니라 「모른다」다. 근거 = `docs/probe_947_cik_coverage.json`.

## 검증

- `lib/valuation.test.ts` — `VALUATION_SPEC`의 formula·basis 고정 문자열 회귀 + 4케이스(흑자·무차입/흑자·유차입/적자/자기자본 음수) 손계산 검산 + 미성립 경계 6건.
- `lib/revdcf/drivers.test.ts` — `fundamentals`(netIncome·equity·revenue·operatingIncome·dna·fiscalYear·sourceTags) 수집이 driver 5년 게이트보다 앞에서 끝나는지, skip 경로에도 실리는지 회귀 고정.
- ✅ **STEP 948(2026-08-08) — 실제 종목 기반 검증 완료(재시도 1회 후 성공).** 1차 시도 401 실패의 원인을 호출 없이 확정(`vercel env pull`로 받은 Production 시크릿과 로컬 `.env.local`을 sha256 앞 8자리로만 대조 — 완전 일치, 값은 어디에도 안 남김) → 원인은 1차 시도의 셸 추출이 `.env.local`의 큰따옴표를 안 벗긴 것으로 확정(Production 시크릿 자체는 문제 없었음). 파싱을 고쳐 2차(마지막) 호출 → **200 성공**. `us_fundamentals` 1,003행 적재(`net_income` 855·`equity` 851·`revenue` 855·`operating_income` 837·`dna` 816·`debt`/`non_operating_assets`/`shares` 685 — 뒤 셋은 driver 전체 성공 시에만 채워짐). **비지배지분 혼입 실측 = 48건**(`equity` 851건 중 `StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest` 채택 48건, 5.64%) — "가능성 있음"이 아니라 실측치. `us_valuation` 1,003행(`per` 606·`pbr` 738·`psr` 793·`ev_ebitda` 528). `MISSING_MARKET_DATA`(원문 스펙에 없던 코드 추가 조건, 위 "코드가 스펙보다 넓힌 것" 참조)가 실제로 **131건** 발생 — 이론이 아니라 실전에서 검증됨. 손계산 4종목(A·AAL·ABNB·AIRI, us_valuation에서 조건별 사전순 결정적 선정) **전부 bit-for-bit 일치**(python 독립 재계산 대조 — 10자리 정수 나눗셈의 4자리 소수 정확도는 손 암산으로 보장 불가해 스크립트로 대체, 정신은 동일). `A`(Agilent, CIK 1090872)의 SEC `companyfacts` 원문을 직접 열어 `NetIncomeLoss`·`StockholdersEquity`·`Revenue...`·`OperatingIncomeLoss`·`DepreciationDepletionAndAmortization` 5개 태그의 회계연도·값을 `us_fundamentals`와 대조 — **전부 일치.** `revdcf_results` 2026-08-08 = 604건(08-07과 동일, 감소 없음). 🔴 **§5(야후 상대차) 미실시 — 명령서 전제 오류(2번째 발견)**: `lens_scores`에 야후 원시 PER/PBR이 저장돼 있다는 전제가 틀렸다(테이블에 `valuation_value`/`valuation_state`라는 파생 점수만 있고, 원시 `trailingPE`/`priceToBook`은 `lib/lensCompute.ts`의 즉시계산 값이라 DB 어디에도 저장 안 됨 — grep 3파일 전수 확인). 종목별로 라이브 재조회(수백 건)해야 분포를 낼 수 있는데, 이는 이번 STEP이 승인한 "`/api/cron/revdcf` 1회"를 벗어나는 별도의 대량 라이브 호출이라 임의로 하지 않았다. 상세 = `docs/probe_948_live.json`.
