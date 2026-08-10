# Q1 ④ — 야후 밸류 의존 전수 지도 (STEP 981)

> 🔴 조사 전용 문서. 판정 없음 — 선택지와 대가만 나열한다. 판정은 장은태.
> 🇺🇸 US 단독. KR 비교·예시 없음.
> 원자료 = `docs/probe_981_yahoo_dependency.json` · `docs/probe_981_decompose_output.json` · `docs/probe_981_search.md` · `scripts/probe_981_decompose.ts` · `scripts/probe_981_pebasis.ts`

## 배경

`docs/VALUE_LENS_DEFECT_AUDIT_2026-08-07.md`가 이미 코드 인용으로 지적한 결함(야후가 계산한 값을 받아씀·TTM PER과 연간 PER을 한 분포에 섞음)을 972가 육안으로 재확인했다(AMT: 야후 35.97 / SEC 연간 48.78 / SEC FY25 40.82). 장은태 판정: **valuation 렌즈는 내리고 Q1이 흡수한다.** 이 문서는 그 실행에 앞서 "지금 무엇이 어디에 얼마나 박혀 있는지"를 재는 지도다.

## 1. 야후 의존 지도

### 1-1·1-2. 무엇을 어디서 받는가

`lib/lensCompute.ts`가 야후에서 받는 필드:
- `quote.trailingPE` (1순위, TTM) · `quote.priceToBook` · `quote.marketCap` · `quote.regularMarketChangePercent`
- `fundamentalsTimeSeries`(연간): `totalRevenue`·`grossProfit`·`costOfRevenue`·`netIncome`·`totalAssets`·`currentAssets`·`currentLiabilities`·`longTermDebt`·`operatingCashFlow`·`ordinarySharesNumber`·`stockholdersEquity`

🔴 **`fundamentalsTimeSeries`는 valuation 전용이 아니다.** quality·assetgrowth·fscore 렌즈가 같은 fetch 결과(`d.financials`)를 공유해서 쓴다(`lib/lenses.ts:69,251,327-373`). valuation 렌즈를 빼도 **이 fetch 자체는 없앨 수 없다** — 다른 3개 렌즈가 여전히 그 데이터로 돈다.

US 경로 우선순위(`lensCompute.ts:233-243`): `trailingPE`가 있으면 그대로(`peBasis="ttm"`) · 없으면 `marketCap/직전연간순이익`으로 폴백(`peBasis="annual"`). **이 폴백은 시장 분기 없이 US에도 열려 있다** — KR 우선주 특례(`isKrPreferred`)만 US를 건드리지 않을 뿐, "폴백이 도는지 여부" 자체는 US·KR 공통 조건(`pe==null`)이다.

### 1-3. peBasis 분포 — 실측(US 1,023종목, 야후 재조회)

| | 종목 수 | 비율 |
|---|--:|--:|
| `trailingPE` 있음(TTM 1순위) | 913 | 89.2% |
| `trailingPE` 없음(annual 폴백 진입) | 110 | 10.8% |
| 조회 오류 | 0 | 0% |

🔴 US에서도 **10명 중 1명꼴로 이미 "TTM이 아닌" 기준으로 판정되고 있다.** 폴백이 실제로 값을 만드는지(순이익 존재 여부)는 이번엔 안 쟀다(미측정).

### 1-4. 표면 목록 — 실측 재검산

972가 구두로 "6곳"이라 했으나 이번 실측으로 다시 세면 **최소 18개 파일/DB객체**:

- 코드 컴포넌트 5: `StockLensClient.tsx`(5개소) · `TodayClient.tsx` · `ExploreClient.tsx` · `eightK.ts`(2개소) · `app/api/lens/route.ts`
- DB 읽기 라우트 8: `explore/lens-top` · `krx/ranking` · `watchlist/quotes` · `yahoo/{us,gb,cn,vn,jp}-list`(5개, 파킹 시장 포함 — SELECT 절엔 존재)
- DB 컬럼 2: `lens_scores.valuation_value` · `lens_scores.valuation_state`
- DB 함수 1: `lens_percentiles` RPC(`value_pctl` 컬럼)
- 테스트 2: `lib/lenses.charac.test.ts`(다수) · `lib/lensDenominator.test.ts`(1줄)

🔴 **용어 충돌 경고**: 코드베이스에 "밸류(valuation)"가 **둘** 있다 — (a) 이 문서가 다루는 야후 기반 7렌즈 `valuation` (b) `lib/valuation.ts`의 SEC 기반 Q1 4축 엔진. `lib/valuation.test.ts`·`lib/sectorCuts.test.ts`·`lib/sectorRelativeBatch.test.ts`·`app/api/q1/[symbol]/route.test.ts`는 (b) 소속 — 제거 대상 밖이니 혼동 금지.

## 2. 정의 차이 — 실측

### 2-1. 괴리 크기 (matchedN=510, `lens_scores.valuation_value` vs `us_valuation.per` 둘 다 있는 종목)

🔴 **분모 선택 문제**: `|a-b|/denom`은 분모를 어느 쪽으로 두느냐에 따라 순위가 크게 갈린다(TWLO 실측: SEC분모 96.9% vs yahoo분모 3125% — 같은 두 숫자, 다른 %). 방향 무관 대칭지표 **ratio = max/min**을 정본으로 쓴다.

| 지표 | 값 |
|---|--:|
| 중앙값(ratio) | **1.117배** |
| p90(ratio) | **1.846배** |
| p99(ratio) | 8.445배 |
| ±20% 이내 | 315/510 (61.8%) |
| ±50% 이내 | 418/510 (82.0%) |
| 2배 초과 | 43/510 (8.4%) |

**AMT(972 사례)**: 야후 27.87 / SEC 35.65, ratio=1.279배, **전체의 70.9백분위**. → 972가 본 사례는 **예외가 아니라 평범한 쪽**이다(중앙값보다는 확실히 크지만, 극단 8.4%엔 못 미침).

### 2-2. 상위 20종목 원인 분류

방법: `predictedRatio = TTM순이익/FY순이익`(둘 다 SEC companyfacts 로컬캐시에서 직접 재구성, marketCap이 분자에서 상쇄된다고 가정) vs `observedRatio = SEC_PER/야후_PER`. 2배 이내로 맞으면 "TTM/FY 시점차"로 분류.

| 원인 | 건수 |
|---|--:|
| TTM/FY 시점차(예측·실측 부합) | 10 |
| 불명 | 10 |

- **우선주 처리**: US에는 우리 코드의 우선주 특례(`isKrPreferred`)가 구조적으로 없음(KR 6자리 코드 전용) — **이 분류축은 애초에 해당사항 없음**(판정 불필요).
- **재작성 반영여부**: SEC 파이프라인은 이미 "최신 filed 값"을 쓴다(`coalesceMap`) — 재작성이 잔차 원인일 가능성은 구조상 낮음. 별도 실측은 안 함(미측정).
- **TTM/FY 시점차 확인 사례(TWLO)**: FY2025 순이익 $33.8M(annual) vs TTM(2025Q3~2026Q2) 순이익 $1,217M — 2026Q2 discrete 분기에 대규모 일회성 항목이 반영되며 TTM이 FY 대비 36배 커짐. 예측 ratio 35.97 vs 실측 32.25로 정확히 부합.
- **불명 10건**: 예측 방향은 맞으나 배율이 2배 이상 어긋남(예: DLR·XYZ·FANG·TEL·BMRN·A·UHAL-B) — 셰어카운트 기준차(야후는 TTM 가중평균 희석주식, SEC파이프라인은 현재 시총 기준) 등 추가 요인 추정되나 **검증 안 됨, "불명"으로 남긴다.**

### 2-3. cheap/mid/rich 재시뮬레이션 (계산만, DB 미기록)

🔴 **전제**: `lens_cuts`(US·valuation)는 **2026-07-30부터 정지 상태**(`docs/STATE.md` 미해결 13번) — 오늘 화면에 실제로 걸려 있는 그 낡은 컷(lo=18.24, hi=35.1)을 그대로 시뮬레이션에 썼다. 컷이 갱신되면 이 숫자는 달라진다.

- 510종목 중 **103종목(20.2%)이 판정이 달라진다**(cheap↔mid, mid↔rich 경계이동 포함).
- 그중 **완전히 반대 극으로 뒤집힌 것 4종목**: APO·GPN(rich→cheap) · VLO·FIS(cheap→rich).

## 3. 제거 시 파급 — 나열만 (제거 안 함)

### 3-1. 영향받는 것 전수

§1-4 표면 목록과 동일 — 지금 밸류 렌즈가 이미 닿아 있는 곳 전부가 제거의 대상이 된다(코드 5·DB읽기라우트 8·DB컬럼 2·DB함수 1·테스트 2).

### 3-2. US만 내리는 것이 기술적으로 가능한 구조인가

**없다.** `LENSES`(`lib/lenses/registry.ts`)·`LENS_KEYS`(`lensPrecompute.ts`)·`CUT_LENSES`(`lensCuts.ts`)가 전부 **시장 구분 없는 단일 상수 배열**이다. `computeSymbolLenses()`는 market 파라미터조차 안 받는다. `computeLensScoresFor(universe, market)`의 `market`은 컷(판정 기준값) 조회에만 쓰이지 "어느 렌즈를 계산할지"엔 안 쓰인다. `lensCopy.ts`의 `valuation` 문구(ko·en)도 시장 무관 단일 객체 — KR·US가 같은 코드·같은 문구를 공유한다.

**의미**: US만 끄려면 지금 없는 새 분기를 코드에 새로 만들어야 한다 — 순수 삭제가 아니라 **신규 조건문 추가** 작업이다.

## 4. 선택지 — 판정 없음, 대가만

| | 원전·실무 근거 | 깨지는 것 | 되돌릴 수 있는가 | 별도 승인 필요? |
|---|---|---|---|---|
| **A. 현행 유지**(야후 밸류 렌즈 그대로, Q1과 병존) | 없음(972·07-07 결함 문서가 이미 부정) | 없음 | — | 불필요(현상유지) |
| **B. US에서 밸류 렌즈 제거, Q1으로 완전 대체** | Q1은 SEC 원자료 직접계산(`docs/VALUATION_SPEC.md`) — BRAND_IDENTITY 직시 기둥과 정합 | §3-1 전수(18개 파일/객체) 수정 필요 · §3-2 신규 분기 코드 필요 · lens_cuts 5렌즈 컷 재산정 시 valuation 축 취급 재정의 필요 · `LENS_KEYS`/`CUT_LENSES`가 KR과 공유라 **KR도 같이 손대지 않으려면 분기 신설이 불가피**(US 단독 원칙과 충돌 가능성) | 부분적(코드는 되돌릴 수 있으나 이미 노출된 화면의 사용자 인지는 되돌릴 수 없음) | **필요**(라이브 화면 변경) |
| **C. 밸류 렌즈를 "야후 값"에서 "SEC 값"으로 교체(제거 아닌 소스 교체)** | Q1 파이프라인 재사용 가능(중복 계산 회피) | 렌즈 이름·등급(`weakSignal`·`partial`)·컷 분포가 전부 새 값 기준으로 바뀜 → `lens_cuts` 재산정 필수 · 기존 사용자가 봐온 판정이 대량으로 바뀔 수 있음(§2-3: 103/510=20.2%) | 어려움(컷 이력이 섞이면 원복 복잡) | **필요**(값이 바뀌므로 사실상 신규 노출) |
| **D. 두 값을 나란히 노출(야후 TTM + SEC 연간, 라벨 분리)** | Damodaran 원전이 Current/Trailing/Forward를 **애초에 별도 컬럼으로 유지**(`pedata.xls`) — 원전과 가장 정합 | 카드 레이아웃 변경 필요(1개 지표 → 2개) · "어느 게 맞냐"는 사용자 질문에 답을 안 주고 미룸(판단은 당신 원칙과는 부합하나 UX 복잡도 증가) | 쉬움(추가만, 기존 값 보존) | **필요**(화면 변경) |

🔴 **표시 설계(x배/%차이 등)는 이번 범위 밖** — STEP980의 미결(43번)과 같은 자리, 이번에도 안 정함.

## 못 한 것 / 미측정 / 새로 드러난 것 / 판정이 필요한 것

**못 한 것**
- ch17.pdf("Fundamental Principles of Relative Valuation") 미독 — ch18의 일관성 원칙이 처음 나오는 자리일 수 있음.
- 폴백 진입 110종목(peBasis=annual) 중 실제로 값을 얻는 비율(순이익 존재 여부) 미측정.
- 2-2 "불명" 10건의 정확한 원인(셰어카운트 기준차 추정만, 검증 안 함).

**미측정**
- 재작성(restatement) 반영 여부가 잔차에 실제로 기여하는지(구조상 낮다고 추정만 함).
- 선택지 B·C·D 각각의 구현 공수(시간).

**새로 드러난 것**
- 972의 "표면 6곳"은 실측하면 최소 18개로 늘어난다(972 자체엔 산출 근거가 없어 재현 불가 — 972가 무엇을 6개로 셌는지 확인 불가).
- US 경로에서도 이미 10.8%가 annual 폴백을 타고 있다(기존 문서 LENS_DEV_PLAYBOOK #29의 "US 경로 무영향" 서술은 **원래 KR 결측 버그의 맥락 설명**이었지 "US엔 폴백이 안 뜬다"는 주장이 아니었음 — 오독 방지 차 명시).
- 3곳 실무 플랫폼 전부 "Current PE"(연간·FY 기준)를 별도 라벨로 노출하지 않는다 — Q1이 계산하는 "annual" 기준은 원전(Damodaran 데이터셋)엔 있지만 소비자 실무엔 없는 기준이라, 그대로 노출하면 사용자가 "왜 야후·다른 사이트와 다르냐"고 물을 가능성이 구조적으로 있다.
- `LENS_KEYS`/`CUT_LENSES`가 KR·US 공유라, "US만 손본다"는 대전제(선택지 B·C)가 실행 단계에서 KR 코드에도 손을 대게 만들 가능성 — 🇺🇸 US 단독 원칙과의 충돌 지점으로 기록.

**판정이 필요한 것**
- 선택지 A/B/C/D 중 무엇으로 갈지.
- lens_cuts(US) 정지(07-30부터, 미해결 13번) 자체를 언제 다룰지 — 이 STEP과 별개 이슈지만 §2-3 시뮬레이션이 그 낡은 컷에 의존한다는 걸 감안해야 함.
