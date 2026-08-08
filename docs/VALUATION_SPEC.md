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

## 🔴 아직 못 푼 것 3개

1. **PSR 표준 정의 원문 미확보** — "매출총이익 대비"인지 "매출 대비"인지 등 세부 관행의 1차 출처를 아직 찾지 않았다. 지금 정의(`marketCap/revenue`)는 가장 널리 쓰이는 형태를 그대로 채택한 것이지, 원문 대조를 거치지 않았다.
2. **다중 클래스 주식(GOOG/GOOGL 등) 시총 합산 미해결** — 현재 `us_market_cap`은 **클래스별로 별도** 값을 갖는다(`resolveSector`의 형제 매칭과 달리, 시총 자체를 합산하는 로직이 없다). PER·PBR 등은 클래스별로 각각 계산되며, 통합 시총 기준 배수와 다를 수 있다.
3. **`StockholdersEquity`에 비지배지분이 섞이는 변형** — 2순위 태그(`StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest`)를 쓴 기업은 PBR 분모가 순수 보통주 지분보다 크게 잡힐 수 있다. **추적만 한다** — `source_tags.equity`에 실제 채택 태그를 기록해 사후에 걸러낼 수 있게 해 두었을 뿐, 자동 보정은 하지 않는다.

## 🔴 범위 밖 — 「업종 대비」

이 문서는 4개 축의 **절대값 계산**만 다룬다. Q0(섹터 분류, `docs/LENS_COMPLETION_STANDARD.md` Q0 행)가 정의하는 「업종 대비」 비교는 **이 STEP의 범위 밖**이다. `us_sector_resolved`가 1,021행(`lens_scores` US 유니버스 기준)뿐이라, 이번에 넓힌 밸류에이션 유니버스(`us_cik_map ⋈ us_market_cap`, 5천 건대)를 전부 커버하지 못한다 — 업종 대비를 붙이려면 Q0 커버리지 확장이 선행돼야 한다.

## 🔴 성립하지 않는 경우 — 커버리지 결측 12종목(2026-08-08 실측)

`us_market_cap` 최신 `as_of`(2026-08-07) 5,509종목 중 **12종목(0.22%)**은 `data/sources/sec/company_tickers_exchange_20260802.json`에 티커가 없어 **CIK를 못 얻었다.** 이 12종목은 `us_cik_map`에 아예 들어가지 않으므로(CIK를 모르는 채로 넣지 않는다 — 지어내지 않는다) **4개 축 전부 값이 없다.**

전수: `CNSY` · `FRBA` · `GRSD` · `HIFS` · `QNME` · `RCBC` · `SSBI` · `STLN` · `TCGX` · `TONT` · `TOWN` · `YARW`

🔴 **원인은 조사하지 않았다.** 목록에 `HIFS`·`TOWN`·`FRBA` 등 현재 상장·보고 중인 것으로 보이는 이름이 포함돼 있어, 상장폐지가 아니라 SEC 파일의 누락일 가능성이 있으나 **확인하지 않았다.** 「없다」가 아니라 「모른다」다. 근거 = `docs/probe_947_cik_coverage.json`.

## 검증

- `lib/valuation.test.ts` — `VALUATION_SPEC`의 formula·basis 고정 문자열 회귀 + 4케이스(흑자·무차입/흑자·유차입/적자/자기자본 음수) 손계산 검산 + 미성립 경계 6건.
- `lib/revdcf/drivers.test.ts` — `fundamentals`(netIncome·equity·revenue·operatingIncome·dna·fiscalYear·sourceTags) 수집이 driver 5년 게이트보다 앞에서 끝나는지, skip 경로에도 실리는지 회귀 고정.
- 🔴 **STEP 948(2026-08-08) — 실제 종목 기반 검증 시도, 실패.** 장은태 승인 하 `/api/cron/revdcf`를 Production에 1회 호출했으나 **401(unauthorized)로 즉시 실패** — 재시도 금지 규칙에 따라 그 자리에서 중단했다. `us_fundamentals`·`us_valuation`은 여전히 **0행**. 진단(재호출 없이 로컬 파일 형식만 확인): `.env.local`의 `CRON_SECRET` 값이 큰따옴표로 감싸져 있는데 1회성 셸 추출(`cut`)이 따옴표를 벗기지 않아 헤더에 따옴표 문자가 섞여 들어갔을 가능성이 높다 — **Production 크론 자체가 깨졌다는 증거는 아니다.** 손계산 검산·SEC 원문 대조·야후 상대차 실측은 데이터가 없어 전부 미실시. 상세 = `docs/probe_948_live.json`. **재실행은 별도 승인 필요.**
