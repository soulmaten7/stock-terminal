# probe_1054 — 재료 다섯의 공급 실측

> STEP1054 실행 기록. 🔵 조사 전용 — 프로덕션 diff 0 · DB 쓰기 0. 태그를 배열에 넣지 않는다. 판정은 장은태가 한다.

---

## 맨 앞 — 숫자 요약 한 장

모집단(US, `us_fundamentals`) 5,820 → SEC companyfacts 확보 5,742(98.66%, 404 78건) → 그중 기준연도(REV 창) 보유 3,606(62.8%).

| 재료 | 후보 태그 | 공급(㉠1년이라도, 5,742 대비) |
|---|---|---:|
| 총자산 | `Assets` | 73.8% |
| 총부채 | `Liabilities`(직접) / `LiabilitiesAndStockholdersEquity`(재구성) | 65.9% / 73.6% |
| 이익잉여금 | `RetainedEarningsAccumulatedDeficit`(🔴 bare `RetainedEarnings`는 **0건**, 지시문 예측 적중) | 72.2% |
| 영업현금흐름 | `NetCashProvidedByUsedInOperatingActivities`계열 | 72.3% |
| 배당(지급/선언/지급·주당) | `PaymentsOfDividends`계열 / `CommonStockDividendsPerShareDeclared` / `CommonStockDividendsPerShareCashPaid` | 34.2% / 24.8% / 15.4% |

| 모델 | 완전 성립 종목수 | 분모 | 비율 |
|---|---:|---:|---:|
| Piotroski F-Score(9신호 전부) | 1,166 | 3,606 | 32.3% (병목=ΔLever 64.2%·ΔMargin 51.6%) |
| Altman Z(제조업 근사)+Z″(비제조업 근사) 합계 | 2,348 | 3,606 | 65.1% |
| 배당 수익률 | 1,829 | 3,606 | 50.7% |
| 자산성장(연속 2년) | 3,596 | 3,606 | 99.7% |
| B/M(장부가, 기존 파이프라인 값 재사용) | 3,726 | 5,820 | 64.0% |

🔴 ⓪-4 반증조건 판명: **틀렸다** 쪽으로 갈렸다 — `RetainedEarnings`(bare) 0건, 지시문이 지목한 정확한 후보(`RetainedEarningsAccumulatedDeficit`)가 표준 태그로 확인됐다. `Liabilities`도 예상대로 재구성 경로(`LiabilitiesAndStockholdersEquity`)가 7.7%p 더 넓다.

---

## ⓪-1a. 로드맵 원문 대조

| 층 | 걸리는 절 | 확인 |
|---|---|---|
| WHY | 없음 | 재료 공급 실측이라 WHY 층에 걸리는 서술 없음 |
| HOW | H-7 | *"결측을 채우고 실측인 척 절대 금지"* — 이 STEP 전체가 이 규칙을 지키기 위한 실측(추정 대신 원자료 직접 스캔) |
| WHAT | W-3 | *"US 상장 종목"* — 모집단은 US 단독으로 확인(§2-1) |
| 관문·순위 | F-1③·F-5⑧⑨⑪⑬-b | 이 STEP의 실측치가 그 판정들의 입력이 된다(§2-5) |
| 완성의 정의 | C-1 | 화면을 안 만들므로 심사 대상 아님 |
| 수익 모델 | 없음 | 무관 |

## ⓪-1b. 기존 답 확인 (`ls` 전수)

`docs/`에 `Assets`·`RetainedEarnings`·`배당`·`태그`로 검색되는 기존 판정 문서 없음(`KNOWN_ANSWERS.md` 포함). `ls docs/`로 `probe_105*` 확인: `probe_1050_sector_source_fix.md`·`probe_1051_unused_disposal.md`·`probe_1052_axis_role_and_layerC.md`·`probe_1053_question_set.md` — 이 STEP과 직접 겹치는 선행 판정 없음.

## ⓪-3중 규칙 요약

- **A-0 우리 자산**: `lib/revdcf/drivers.ts`(현재 태그 union) · `docs/probe_951_cache/`(companyfacts 캐시) · `us_fundamentals`·`us_sector_wide`(DB)
- **A 원문**: SEC 컴퍼니팩트 JSON에 내장된 us-gaap 공식 `description` 필드(태그당 1회, 라벨링크베이스 정의 텍스트 — STEP969 R-file 방법과 동일 출처, 이번엔 로컬 캐시에서 직접 추출해 추가 SEC 호출 0)
- **B 실무**: 해당 없음(이 STEP은 재료 공급 실측이지 실무 비교가 아님)
- **C 반대 증거**: ⓪-4 반증 조건이 실제로 갈렸는지가 곧 반대 증거 확인(§2-3)
- **검증**: 원문(us-gaap description) / 우리실측(SEC companyfacts 전수 스캔) / 제3자 해당 없음
- **검수**: 반박 시도(캐시 1,167건만으로 결론 내리지 않고 부족분 4,653건을 실제로 더 받음, 아래) · 수치 출처(전부 오늘 스캔) · 이전 발언 대조(STEP967 "변형 태그 미발견" 재확인) · 분기 비중(㉠㉡㉢ 세 층 전부 숫자로)
- 🔴 **미측정**: 아래 "못 한 것" 참조

---

## 1. 배경

STEP1053이 질문 여섯(+전제 둘)을 확정했으나 각 질문의 재료가 실제로 있는지는 재지 않았다. 이 STEP이 그중 다섯(총자산·총부채·이익잉여금·영업현금흐름·배당)의 공급을 잰다 — Piotroski(재무건전성 질문의 모델)·Altman Z/Z″(부도위험 질문의 모델)·배당 지표(배당 질문의 모델)·자산성장(F-5 ⑪)·B/M(Piotroski 원전 표본 대조용)이 전부 이 다섯에 걸려 있다.

---

## 2-1. 모집단·캐시·부족분 — 숫자로

| 항목 | 값 |
|---|---|
| `us_fundamentals` 전체 행수 | 5,820 |
| `cik` 보유(=revdcf 파이프라인이 실제로 다룬 모집단) | 5,820 (100%) |
| 로컬 캐시(`docs/probe_951_cache/`) 파일수 | 1,167 |
| 모집단 ∩ 캐시 | 1,167 (캐시 파일 전부가 현재 모집단 안에 있음, 모집단 밖 캐시 0건) |
| 부족분(모집단 − 캐시) | 4,653 |

**타이밍 샘플(부족분 15건 실제 SEC 조회)**: 평균 다운로드 299ms·평균 파일크기 1.35MB, 요청당 총소요(다운로드+150ms 간격) 449ms → 부족분 4,653건 예상 2,088초(**34.8분**), 예상 다운로드량 **6.13GB**.

🔴 **어긋남 발견**: STEP1054 지시문 ⓪-5②의 비용 모델("부족분×0.1초")은 **SEC 레이트리밋 간격만 반영하고 실제 다운로드 시간(companyfacts 평균 1.35MB/파일)을 반영하지 않았다** — 실측 결과 요청당 실제 비용은 0.1초가 아니라 **0.45초**(4.5배). 그 결과 4,653건은 "465초"가 아니라 "2,088초(35분)"였다. 🔴 지시문 §⓪-5②의 기준("분 단위면 전수, 시간 단위면 상한 논의")에 따르면 35분은 **분 단위 상한선에 가깝지만 여전히 분 단위**(시간 단위=60분 이상)이므로, **전수로 진행**했다(아래). 배경(백그라운드 bash)으로 실행해 대화형 대기 없이 병행 작업.

**실행 결과**(`scripts/probe_1054_fetch_shortfall.ts`, 150ms 간격 순차·429 즉시중단 규약, 963과 동일):

1차 실행(백그라운드) — 4,200/4,653(90.3%) 확보 시점에 환경이 프로세스를 종료(`status: killed`, 하네스 백그라운드 태스크 한도 추정 — SEC 429는 아니었다, 로그에 429 없음). 2차 실행(재실행, 이미 받은 파일은 `already` 체크로 재조회 안 함, 963과 동일 스킵 로직) — 남은 428건 중 **350건 신규 확보, 78건 `HTTP_404`**(전량, 429·타임아웃 0건).

| 항목 | 값 |
|---|---|
| 모집단 | 5,820 |
| 최종 캐시 확보 | **5,742 (98.66%)** |
| SEC `HTTP_404`(companyfacts 자체가 없음 — 표본: AIO·AYA·BCX·BDJ·BGY 등) | 78 (1.34%) |
| 429(레이트리밋 차단) | 0 |

🔴 **404의 성격**: `us_fundamentals`에 `cik`이 있는데도 SEC `companyfacts` 엔드포인트가 404를 반환하는 78종목은 **CIK은 존재하나 XBRL 구조화 팩트 자체를 낸 적이 없는 발행인**(표본 확인 결과 BCX·BDJ·BGY 등은 폐쇄형 펀드류 — N-CSR을 내고 10-K/XBRL을 안 냄). 재시도로 해결될 문제가 아니다 — **이 78종목은 태그 커버리지 분모에서도 애초에 빠진다**(companyfacts가 없으니 어떤 태그도 잴 수 없음). 아래 §2-2부터는 **분석 대상 = 캐시 확보 5,742건**을 모집단으로 쓴다.

---

## 2-2. 전체 태그 나열 — 빈도표 + 양방향 대조

**방법**: 각 companyfacts의 `facts["us-gaap"]` 전체 키를 나열해 종목수 기준 빈도표를 만든다(이름으로 찾지 않음, 전수의 조건 ③). `drivers.ts`가 실제 참조하는 태그 전부(export된 것 + 비공개 const를 원문 그대로 복사한 것, `scripts/probe_1054_analysis.ts` 주석에 출처 명시)와 양방향 대조한다.

**분석 대상 = 5,742건**(캐시 확보분 전량, JSON 파싱 오류 0건). 전체 태그 종류수·상위 200개 전체는 `docs/probe_1054_analysis.json`(`top200`)에 실림 — 아래는 발췌.

### 상위 30개 태그(종목수 기준)

| 순위 | 태그 | 종목수 | 비율 |
|---|---|---:|---:|
| 1 | `Assets` | 4,982 | 86.8% |
| 2 | `NetCashProvidedByUsedInFinancingActivities` | 4,974 | 86.6% |
| 3 | `NetCashProvidedByUsedInOperatingActivities` | 4,972 | 86.6% |
| 4 | `LiabilitiesAndStockholdersEquity` | 4,970 | 86.6% |
| 5 | `NetIncomeLoss` | 4,954 | 86.3% |
| 6 | `NetCashProvidedByUsedInInvestingActivities` | 4,906 | 85.4% |
| 7 | `StockholdersEquity` | 4,887 | 85.1% |
| 8 | `RetainedEarningsAccumulatedDeficit` | 4,873 | 84.9% |
| 9 | `EarningsPerShareBasic` | 4,720 | 82.2% |
| 10 | `WeightedAverageNumberOfSharesOutstandingBasic` | 4,710 | 82.0% |
| 11 | `EarningsPerShareDiluted` | 4,707 | 82.0% |
| 12 | `CashAndCashEquivalentsAtCarryingValue` | 4,690 | 81.7% |
| 13 | `WeightedAverageNumberOfDilutedSharesOutstanding` | 4,689 | 81.7% |
| 14 | `IncomeTaxExpenseBenefit` | 4,558 | 79.4% |
| 15 | `Liabilities` | 4,503 | 78.4% |
| 16 | `CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents` | 4,408 | 76.8% |
| 17 | `EffectiveIncomeTaxRateReconciliationAtFederalStatutoryIncomeTaxRate` | 4,332 | 75.4% |
| 18 | `PropertyPlantAndEquipmentNet` | 4,329 | 75.4% |
| 19 | `OperatingLeaseRightOfUseAsset` | 4,327 | 75.4% |
| 20 | `OperatingIncomeLoss` | 4,297 | 74.8% |
| 21 | `OperatingLeaseLiability` | 4,272 | 74.4% |
| 22 | `ShareBasedCompensation` | 4,272 | 74.4% |
| 23 | `IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest` | 4,226 | 73.6% |
| 24 | `CommonStockSharesIssued` | 4,218 | 73.5% |
| 25 | `AssetsCurrent` | 4,209 | 73.3% |
| 26 | `LiabilitiesCurrent` | 4,204 | 73.2% |
| 27 | `CommonStockSharesAuthorized` | 4,197 | 73.1% |
| 28 | `LesseeOperatingLeaseLiabilityPaymentsDue` | 4,186 | 72.9% |
| 29 | `EffectiveIncomeTaxRateContinuingOperations` | 4,177 | 72.7% |
| 30 | `CommonStockValue` | 4,156 | 72.4% |

### 역방향 양방향 대조

**① 죽은 태그(`drivers.ts` 배열에 있는데 실제 빈도 0)**: `CostOfSales` · `CostOfOperatingRevenues` · `CostOfRevenues` · `DepreciationAmortizationAndDepletion` — 4개. 🔴 **배열에서 빼지 않는다**(이 STEP은 측정까지). 참고: `COST` 배열 안의 나머지 3개(`CostOfRevenue`·`CostOfGoodsAndServicesSold`·`CostOfGoodsSold`)는 전부 고빈도라 `COST` 개념 자체는 살아 있다 — 죽은 4개는 coalesce 안의 "혹시 몰라 넣어둔" 변형들.

**② 누락 후보(빈도표 상위인데 `drivers.ts` 배열 밖, 30%+ 출현, 상위 20개)**: `Assets`(86.8%)·`NetCashProvidedByUsedInFinancingActivities`(86.6%)·`NetCashProvidedByUsedInOperatingActivities`(86.6%, 🔴 **이 STEP이 재는 다섯 중 하나**)·`LiabilitiesAndStockholdersEquity`(86.6%)·`NetCashProvidedByUsedInInvestingActivities`(85.4%)·`RetainedEarningsAccumulatedDeficit`(84.9%, 🔴 **이 STEP이 재는 다섯 중 하나**)·`EarningsPerShareBasic`(82.2%)·`EarningsPerShareDiluted`(82.0%)·`IncomeTaxExpenseBenefit`(79.4%)·`Liabilities`(78.4%, 🔴 **이 STEP이 재는 다섯 중 하나**)·`EffectiveIncomeTaxRateReconciliationAtFederalStatutoryIncomeTaxRate`(75.4%)·`OperatingLeaseRightOfUseAsset`(75.4%)·`OperatingLeaseLiability`(74.4%)·`ShareBasedCompensation`(74.4%)·`CommonStockSharesIssued`(73.5%)·`CommonStockSharesAuthorized`(73.1%)·`CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalentsPeriodIncreaseDecreaseIncludingExchangeRateEffect`(73.0%)·`LesseeOperatingLeaseLiabilityPaymentsDue`(72.9%)·`EffectiveIncomeTaxRateContinuingOperations`(72.7%)·`CommonStockValue`(72.4%) — 총 60개(전체 목록 `probe_1054_analysis.json`의 `missingHighFreqCandidates`). 🔴 **이 STEP이 다루는 5개념(총자산·총부채·이익잉여금·CFO·배당) 넷이 이미 이 상위 목록에 스스로 나타난다** — 정확히 이 STEP이 재려던 것들이 실제로도 고빈도라는 교차 확인.

---

## 2-3. 다섯 개념의 후보 태그 확정 — us-gaap 공식 Definition 대조

**방법**: 로컬 캐시 companyfacts JSON에 태그당 `description` 필드가 이미 내장돼 있다(SEC 공식 라벨링크베이스 정의 텍스트 — STEP969가 쓴 R-file 방법과 같은 출처, 이번엔 추가 SEC 호출 없이 로컬에서 직접 추출). 각 후보 태그를 처음 보유한 종목에서 `label`+`description`을 그대로 옮긴다.

| 개념 | 후보 태그 | us-gaap 공식 정의(원문 그대로) | 판정 |
|---|---|---|---|
| 총자산 | `Assets` | *"Sum of the carrying amounts as of the balance sheet date of all assets that are recognized. Assets are probable future economic benefits obtained or controlled by an entity as a result of past transactions or events."* | ✅ 실재 확인 |
| 총부채 | `Liabilities` | *"Sum of the carrying amounts as of the balance sheet date of all liabilities that are recognized. Liabilities are probable future sacrifices of economic benefits arising from present obligations of an entity to transfer assets or provide services to other entities in the future."* | ✅ 실재 확인 |
| 총부채(재구성 경로) | `LiabilitiesAndStockholdersEquity` | *"Amount of liabilities and equity items, including the portion of equity attributable to noncontrolling interests, if any."* | ✅ 실재 — `Assets − StockholdersEquity`로 총부채 재구성 가능(별도 커버리지, §2-4) |
| 이익잉여금 | `RetainedEarnings` | 🔴 **캐시 1,167건 전수 스캔에서 0건 검출 — us-gaap 개념 자체가 사실상 안 쓰인다.** | 🔴 **⓪-4 반증조건 적중** — 아래 |
| 이익잉여금(표준) | `RetainedEarningsAccumulatedDeficit` | *"The cumulative amount of the reporting entity's undistributed earnings or deficit."* | ✅ 실재 확인 — **이것이 표준 태그** |
| 영업현금흐름 | `NetCashProvidedByUsedInOperatingActivities` | *"Amount of cash inflow (outflow) from operating activities, including discontinued operations..."* | ✅ 실재 확인 |
| 영업현금흐름(변형) | `NetCashProvidedByUsedInOperatingActivitiesContinuingOperations` | *"...excluding discontinued operations..."* | ✅ 실재 확인(계속영업 한정 변형) |
| 배당(지급기준) | `PaymentsOfDividends` | *"Cash outflow in the form of capital distributions and dividends to common shareholders, preferred shareholders and noncontrolling interests."* | ✅ 실재 확인 |
| 배당(지급기준, 보통주만) | `PaymentsOfDividendsCommonStock` | *"Amount of cash outflow in the form of ordinary dividends to common shareholders of the parent entity."* | ✅ 실재 확인 |
| 배당(선언기준, 주당) | `CommonStockDividendsPerShareDeclared` | *"Aggregate dividends declared during the period for each share of common stock outstanding."* | ✅ 실재 확인 |
| 배당(지급기준, 주당·참고) | `CommonStockDividendsPerShareCashPaid` | *"Aggregate dividends paid during the period for each share of common stock outstanding."* | ✅ 실재 확인 — 지급기준·주당 혼합형(제3의 변형, 참고용) |

🔴 **⓪-4 반증조건 판명**: 지시문이 *"가장 유력한 후보는 `RetainedEarnings` — us-gaap 표준 태그는 `RetainedEarningsAccumulatedDeficit`일 가능성이 높다"*고 미리 지목했고, **정확히 그대로 맞았다.** `RetainedEarnings`(bare)는 1,167건 전수(§2-2 최종은 전체 모집단 대상, 아래)에서 0건. **이익잉여금 개념은 `RetainedEarningsAccumulatedDeficit` 하나로 확정**(coalesce 불필요, 단일 태그).
`Liabilities`도 지시문이 우려한 대로("많은 발행인이 `LiabilitiesAndStockholdersEquity`만 낸다") 일부 감소가 있는지 §2-4에서 실측.

---

## 2-4. 커버리지 실측 — ㉠㉡㉢ 세 층

- ㉠ 태그가 1년이라도 있는 종목수
- ㉡ **최신 회계연도**(REV 창의 `latestAvailable`, `resolveYearWindow` 재사용 — 새 로직 발명 없음)에 있는 종목수. 🔴 REV 태그 자체가 없어 기준연도를 못 잡은 종목은 **자체 최신연도로 대체(fallback)** — 대체 발생 건수를 별도 표기.
- ㉢ 연속 2년(전년 대비 변화 신호용) 있는 종목수

**분모 = 5,742**(캐시 확보 전량). ㉡·㉢은 REV 창 기준연도(`resolveYearWindow`가 반환하는 `latestAvailable`)를 재사용 — 이 기준연도 자체가 없는 종목(REV 태그 전무) 2,136건(37.2%)은 ㉡·㉢에서 **자체 최신연도로 대체(fallback)**했고, 각 행의 `fallback` 열이 그 건수다.

| 개념 | 후보 | ㉠ 1년이라도 | ㉡ 최신FY | ㉢ 연속2년 | fallback 발생 |
|---|---|---:|---:|---:|---:|
| 총자산 | `Assets` | 4,238 (73.8%) | 4,236 (73.8%) | 4,134 (72.0%) | 632 |
| 총부채(직접) | `Liabilities` | 3,784 (65.9%) | 3,729 (64.9%) | 3,677 (64.0%) | 609 |
| 총부채(재구성 경로) | `LiabilitiesAndStockholdersEquity` | 4,227 (73.6%) | 4,225 (73.6%) | 4,122 (71.8%) | 621 |
| 이익잉여금 | `RetainedEarningsAccumulatedDeficit`(단일, coalesce해도 동일 — bare `RetainedEarnings` 0건이므로) | 4,146 (72.2%) | 4,120 (71.8%) | 4,030 (70.2%) | 623 |
| 영업현금흐름 | `NetCashProvidedByUsedInOperatingActivities` ∪ `...ContinuingOperations`(coalesce) | 4,152 (72.3%) | 4,151 (72.3%) | 4,036 (70.3%) | 547 |
| 배당(지급기준) | `PaymentsOfDividends` ∪ `PaymentsOfDividendsCommonStock`(coalesce) | 1,962 (34.2%) | 1,603 (27.9%) | 1,870 (32.6%) | 221 |
| 배당(선언기준·주당) | `CommonStockDividendsPerShareDeclared` | 1,423 (24.8%) | 1,076 (18.7%) | 1,326 (23.1%) | 159 |
| 배당(지급기준·주당, 참고) | `CommonStockDividendsPerShareCashPaid` | 886 (15.4%) | 494 (8.6%) | 810 (14.1%) | 92 |

🔴 **`Liabilities`(직접 태그) 65.9% vs `LiabilitiesAndStockholdersEquity`(재구성 경로) 73.6% — 지시문이 예상한 대로 재구성 경로가 7.7%p 더 넓다.** `Assets − StockholdersEquity`로 총부채를 재구성하면 직접 태그보다 종목을 더 확보할 수 있다(단 `StockholdersEquity` 자체도 85.1%뿐이라 재구성 경로의 진짜 상한은 `min(Assets, LiabilitiesAndStockholdersEquity, StockholdersEquity)` 조합에 달려 있음 — 이 STEP은 존재 확인까지, 조합 최적화는 범위 밖).

🔴 **배당 세 축이 서로 다른 종목을 담는다** — 지급기준(현금, 34.2%)이 선언기준(주당, 24.8%)보다 넓고, 참고용 지급기준·주당(15.4%)이 가장 좁다. **"둘을 섞지 않는다"는 지시가 실측으로도 정당화된다** — 셋을 하나로 합치면 서로 다른 기준의 값을 뒤섞게 된다.

---

## 2-5. 모델 단위 완성 가능성

🔴 **"성립"의 정의 — 이 STEP에서는 "신호를 계산할 수 있다"(원자료 존재)를 뜻한다. 신호가 1인지 0인지(방향 판정)는 재지 않는다(그건 모델 로직이지 재료 공급이 아니다).**

### Piotroski F-Score 9신호

🔴 **분모 주의 — 두 겹이다.** ① 5,742건 중 **기준연도(REV 창의 `latestAvailable`)를 아예 못 잡은 2,136건(37.2%)은 t/t-1 비교 자체가 성립하지 않아 Piotroski 분모에서 제외**(신호별·9개 전부 판정 둘 다 이 기준연도가 있어야 계산 가능하므로). ② 남은 **기준연도 보유 3,606건(refYearBase)이 Piotroski의 진짜 분모**다.

| 신호 | 필요 원자료 | 성립 종목수 / 3,606 | 비율 |
|---|---|---:|---:|
| ① ROA>0 | NetIncome(t)·Assets(t) | 3,602 | 99.9% |
| ② CFO>0 | CFO(t) | 3,604 | 99.9% |
| ③ ΔROA | NetIncome·Assets (t, t−1) | 3,584 | 99.4% |
| ④ Accrual(CFO>NI) | CFO(t)·NetIncome(t) | 3,602 | 99.9% |
| ⑤ ΔLever | 장기부채(`DEBT_LT`)·Assets (t, t−1) | 2,314 | 64.2% |
| ⑥ ΔLiquid | AssetsCurrent·LiabilitiesCurrent (t, t−1) | 3,074 | 85.2% |
| ⑦ Eq_Offer(무증자) | 가중평균 희석·기본주식수 (t, t−1) | 3,426 | 95.0% |
| ⑧ ΔMargin | GrossProfit(또는 Rev−COGS 재구성)·Revenue (t, t−1) | 1,862 | 51.6% |
| ⑨ ΔTurn | Revenue·Assets (t, t−1) | 3,548 | 98.4% |
| **9개 전부 성립** | 위 전부 동시 | **1,166** | **32.3%**(전체 5,742 대비 20.3%) |

🔴 **병목은 ⑤(64.2%)와 ⑧(51.6%)이다.** 나머지 7개 신호는 전부 85% 이상(대부분 95%+)인데, 이 둘이 F-Score 9신호 전부 성립 비율을 32.3%까지 끌어내린다 — ⑤는 장기부채(`DEBT_LT`) 태그 결측, ⑧은 `GrossProfit` 태그 미보유 기업이 매출총이익을 재구성(`Revenue − CostOfRevenue` 등)해야 하는데 그 COGS 계열 태그도 함께 없는 경우가 겹친 결과. 🔴 **"성립"의 정의를 다시 강조 — 여기서 성립은 "계산 가능"이지 "신호가 긍정적"이 아니다.** F-Score 부분 합산(9개 중 일부만으로 점수 매기기)은 H-7 위반이므로, **9개 전부 성립하는 32.3%(3,606 기준) 바깥은 F-Score를 낼 수 없다.**

### Altman Z(제조업)·Z″(비제조업)

🔴 **업종 라벨 출처와 정확도**: `us_sector_wide.sector`(Damodaran 계열 GICS 유사 라벨, 원전 SIC 2000–3999 이진분류가 아님 — 로컬에 종목별 실제 숫자 SIC코드 전수가 없어 **근사**로 대체). 제조업 근사 = {Industrials, Materials, Information Technology, Consumer Discretionary, Energy}, 비제조업 근사 = 그 외 sector 값. 🔴 이 매핑 자체가 §2-3처럼 원문 대조된 것이 아니라 **연구자 판단(근사)** — 정확한 SIC 기반 분류가 아님을 명시.

**분모(기준연도 보유) = 3,606.** 섹터 라벨(`us_sector_wide.sector`) 결측 = **159건(4.4%)** — 이 159건은 제조/비제조 분류 자체가 안 되므로 Z든 Z″든 계산 대상에서 빠진다(altman.unclassified·altman.sectorMissing 동일 카운트, 코드상 같은 조건).

| 구분 | 성립 종목수 | 분모 | 비율 |
|---|---:|---:|---:|
| Z(제조업 근사: Industrials·Materials·Information Technology·Consumer Discretionary·Energy) — X1~X5 전부 원자료 존재 | 1,276 | 3,606 | 35.4% |
| Z″(비제조업 근사: 그 외 sector) — X1~X4 전부 원자료 존재 | 1,072 | 3,606 | 29.7% |
| 섹터 라벨 없음(분류 불가) | 159 | 3,606 | 4.4% |
| **Z 또는 Z″ 성립 합계** | **2,348** | 3,606 | **65.1%** |

🔴 **섹터 판단 자체가 "섹터가 있는데 데이터가 없어서" 못 하는 게 아니라, 섹터를 안 셈**(159건). "제조/비제조 각각 완전 성립"과 "섹터는 알지만 X1~X5 중 일부가 없어서 미성립"은 다른 사유인데, 이 STEP은 후자를 종목별로 분해하지 않았다(성립/미성립만 셈 — 아래 "미측정" 참조). **섹터 알고 있는 3,447건(=3,606−159) 중 2,348건(68.1%)이 실제로 성립**, 나머지 1,099건(31.9%)은 섹터는 알아도 X1~X5(또는 X1~X4) 중 하나 이상이 결측.

### 배당

**분모(기준연도 보유) = 3,606.**

| 항목 | 종목수 | 비율 | 정의 |
|---|---:|---:|---|
| 배당 수익률 성립(지급 또는 선언 중 하나라도 값 존재) | 1,829 | 50.7% | `divPaid` ∪ `divDeclared` any |
| 배당 0 또는 원자료 없음(제외) | 1,777 | 49.3% | 원리적 미성립 — "배당 안 함"과 "데이터 없음"을 이 STEP에서는 분리하지 않음(아래 미측정) |
| 연속 증가 연수 계산 가능(3개년 이상 시계열) | 1,619 | 44.9% | `divPaid` 3개 연도 이상 |
| DDM 성립 근사(배당+순이익 둘 다 존재) | 1,739 | 48.2% | `divPaid` any ∧ `NetIncome`(t) 존재 |

🔴 **"배당 0"과 "데이터 없음"을 이번엔 분리하지 못했다** — 지시문 §2-5가 요구한 "배당 0이면 원리적 미성립이므로 제외 사유를 분리해 센다"를 완전히는 못 지켰다. 1,777건은 "무배당 기업"과 "배당은 하는데 태그가 안 잡힌 기업" 둘 다를 포함한다(아래 "못 한 것"에 명시).

### 자산성장(연속 2년 `Assets`)

| 항목 | 종목수 | 분모 | 비율 |
|---|---:|---:|---:|
| 연속 2년 `Assets` 보유(자산성장 계산 가능) | 3,596 | 3,606(기준연도 보유) | 99.7% |

🔴 자산성장은 Piotroski·Altman과 달리 **원자료가 사실상 병목이 아니다** — 기준연도가 있는 종목의 99.7%가 계산 가능. F-5 ⑪("자산성장은 재료 문제였다, 모멘텀·변동성은 이미 있다")의 "재료가 없어 못 만든다"는 서술은 **여기서 실측으로 확인된다** — `Assets` 태그 자체의 공급은 73.8%(전체 5,742 기준)로 낮지만, **그 73.8% 안에서는** 연속 2년 확보율이 99.7%로 매우 높다(한 번 보고하면 대체로 매년 계속 보고).

### B/M 분위(Piotroski 원전 표본 대조용)

`us_fundamentals.equity`(장부가, 기존 파이프라인이 이미 산출) 보유 종목수로 근사 — 이 STEP의 새 스캔 대상 아님(이미 있는 값 재사용).

| 항목 | 값 |
|---|---|
| `equity` 보유(장부가 존재) | 3,726 / 5,820 (**64.0%**) |
| `common_equity` 보유 | 3,726 / 5,820 (64.0%, equity와 동일 — 우선주 조정이 equity 존재 여부 자체를 바꾸지 않음) |

🔴 이 64.0%는 로드맵 HTML이 예전에 *"자기자본이 64.0%인 걸 보면 총자산도 그 언저리일 텐데 이건 추정이지 실측이 아니다"*라고 적어둔 바로 그 수치다. §2-4의 `Assets` ㉠(실측)과 나란히 놓으면 그 추정이 맞았는지 이번에 처음으로 확인된다.

---

## 못 한 것 / 미측정 / 철회·정정

**못 한 것**
- SEC `HTTP_404` 78종목(1.34%)의 개별 원인 분류(표본 5개만 이름으로 폐쇄형 펀드류로 추정 — 전수 확인 안 함).
- Altman "섹터는 알지만 미성립" 1,099건을 X1~X5(또는 X1~X4) 어느 항목이 빠졌는지 항목별로 분해하지 않았다(성립/미성립 이분류만).
- 배당 "무배당 기업"과 "배당하지만 태그 결측"을 분리하지 않았다(1,777건 뭉뚱그림, 지시문 §2-5 요구를 완전히 못 지킴).
- ㉡·㉢의 "기준연도 없음 2,136건 → 자체 최신연도로 대체(fallback)"는 revdcf 파이프라인이 실제로 쓰는 "최신연도" 정의(REV 창 기준)와 다르다 — 이 대체 때문에 ㉡·㉢ 수치가 **revdcf가 실제로 쓸 수 있는 값보다 다소 낙관적**일 수 있다(각 개념 표의 `fallback` 열이 그 규모).

**아직 안 함(장은태 판정 대상 — 이 STEP은 재는 것까지)**
- 5개 태그(`Assets`·`Liabilities`·`RetainedEarningsAccumulatedDeficit`·`NetCashProvidedByUsedInOperatingActivities`계열·배당 3계열)를 `drivers.ts`에 실제로 추가할지.
- 죽은 태그 4개(`CostOfSales`·`CostOfOperatingRevenues`·`CostOfRevenues`·`DepreciationAmortizationAndDepletion`)를 배열에서 뺄지.
- 누락 후보 60개 중 이 STEP이 다룬 5개 외 나머지(리스·EPS·이연법인세 등)를 새 개념으로 볼지.
- Altman 섹터 근사(GICS 유사 라벨)를 실제 SIC 코드 기반으로 교체할지(추가 SEC `submissions` 5,742건 조회 필요, 이 STEP 범위 밖).

**철회·정정**: 없음(신규 실측). 단 §2-1에서 지시문 자체의 비용 모델("0.1초/건")이 실측(0.45초/건, 4.5배)과 어긋난 것을 정정 기록으로 남김(⓪-4 문단).

**미측정**
- SEC 404 78종목의 정확한 성격(폐쇄형 펀드/지주회사/기타)
- Altman 결측 1,099건의 항목별(X1~X5) 분해
- 배당 무배당·데이터없음 분리
- `RetainedEarnings`(bare) 태그가 us-gaap taxonomy에서 공식적으로 폐기(deprecated)됐는지 — 이번엔 5,742종목 전수 실측(0건 출현)으로만 판단, taxonomy 릴리스 노트 원문 대조는 안 함
- Z·Z″ 각 섹터군의 "전체 모집단"(성립 여부와 무관하게 그 섹터에 속하는 종목수) — 이번엔 "성립" 카운트만 냄

---

🔴 **판정은 장은태가 한다. 이 문서는 숫자를 놓는 것까지다.**
