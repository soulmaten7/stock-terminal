<!-- STEP 1011(파일명은 원안 STEP1008 그대로 유지 — 명령서 §2-3 A 지시) — 조사 전용. 코드 수정 0 · DB 쓰기 0. -->
# 20슬롯 "지금 쓰는 소스" 코드 전수 대조

> 🔴 이 문서명은 `docs/step_orders/STEP1011.md`가 명시한 그대로 `probe_1008_slot_audit.md`다(원안이 STEP1008로 작성된 뒤 1009→1010→1011로 세 번 이관됐고, 파일명은 바꾸지 말라는 지시가 3곳에서 반복됨 — §2-3 A·§5·DoD). **실행 STEP 번호는 1011**이며 `docs/CHANGELOG.md`·`docs/STEP_LEDGER.md`에는 1011로 등재한다(파일명과 원장 번호가 다른 것은 의도된 불일치이니 혼동 방지를 위해 여기 명시한다).
> 대상 = `docs/DATA_SOURCE_CATALOG.md` "슬롯 매핑" 표(439~465행) 20줄. 코드 읽기만(수정 0) + Supabase `select`만(쓰기 0).

## 요약

**일치 15 / 불일치 5 / 확인불가 0**

불일치 5건: **#1(시총, 3단 취득 중 배치만 기재)** · **#2(발행주식수, "Yahoo 부수값(밸류)" 근거 없음)** · **#14(무위험수익률, wacc.xls→실제 ERPbymonth.xlsx)** · **#15(ERP, #14와 같은 사유)** · **#18(섹터분류, us_sector_wide append-only 갱신방식 미기재)**.

## §0. 템플릿 붙여넣기용 요약표 (`docs/step_orders/_TEMPLATE.md` ⓪-2 칸 형식)

| 슬롯# | 카탈로그가 말하는 소스 | 검증 상태 | 실제 도달률 |
|---|---|---|---|
| 1 | Yahoo 배치조회(정본, us_market_cap) | 🔴 불일치로 정정됨(1011) — 3단 취득 중 배치만 기재, 재시도·폴백 누락 | 93.8%(5,601/5,973, 604 유니버스 내 STALE_MARKETCAP 5.0%) |
| 2 | SEC XBRL 태그(역DCF), Yahoo 부수값(밸류) | 🔴 불일치로 정정됨(1011) — "Yahoo 부수값(밸류)" 근거 없음(computeValuation은 shares 미사용) | 604 유니버스 MULTI_CLASS_SHARES 0.83%(5/604)만 shares 직접사유 실패 |
| 3 | us_stock_perf(야후계열, 표시용) | ✅ 코드 대조 완료 | 99.9%(6,377/6,383) |
| 4 | SEC companyfacts(정본) | ✅ 코드 대조 완료 | us_fundamentals net_income 채움 65.1%(3,760/5,780, 광역유니버스) |
| 5 | SEC companyfacts(963 정책) | ✅ 코드 대조 완료 | (4와 같은 파이프라인, 게이트 공유) |
| 6 | SEC companyfacts | ✅ 코드 대조 완료 | 604유니버스 INSUFFICIENT_HISTORY 4.8%(29/604) |
| 7 | SEC companyfacts(폴백 포함) | ✅ 코드 대조 완료 | 604유니버스 MISSING_TAG_OPERATING_INCOME 2.8%(17/604) |
| 8 | SEC companyfacts | ✅ 코드 대조 완료 | (7 게이트 통과분 기준 산정, 개별 실패사유 없음) |
| 9 | SEC companyfacts(969 3분류) | ✅ 코드 대조 완료 | 604유니버스 UNRESOLVED_DEBT 0.17%(1/604) |
| 10 | SEC companyfacts | ✅ 코드 대조 완료 | 604유니버스 NOT_APPLICABLE_SECTOR+MISSING_TAG_OPERATING_CASH 1.5%(9/604) |
| 11 | Damodaran countrytaxrates(한계세율, US행) | ✅ 코드 대조 완료 | 100%(단일 조회, 폴백 없음, 실패 시 크론 자체가 죽음) |
| 12 | 원전 T5 방식(내부 계산) | ✅ 코드 대조 완료 | 🔴 **90% 미만** — 604유니버스 MISSING_TAG_PPE+NO_MARGINAL_CAPEX 10.4%(63/604) → 89.6% |
| 13 | 원전 T4 방식(내부 계산) | ✅ 코드 대조 완료 | (12와 같은 파이프라인, 개별 게이트 없음 — workingCapitalRate는 배열 존재만 요구) |
| 14 | Damodaran wacc.xls 상단값 | 🔴 **불일치로 정정됨(1011)** — 실제 최신행(as_of=2026-08-01)은 `ERPbymonth.xlsx`(STEP1005) | 100%(2행, latestAsOf 항상 해소) |
| 15 | Damodaran wacc.xls 상단값 | 🔴 **불일치로 정정됨(1011)** — #14와 동일 사유(짝 제약) | 100%(#14와 같은 행) |
| 16 | Damodaran betas.xls(업종, 연1회) | ✅ 코드 대조 완료 | 604유니버스 NO_INDUSTRY 1.66%(10/604) |
| 17 | Damodaran ratings.xls/wacc.xls(연1회) | ✅ 코드 대조 완료 | 100%(creditSpreadFor가 항상 값 반환 — 초과 시 최상단 밴드) |
| 18 | resolveSector() 0~4순위 | 🔴 **불일치로 정정됨(1011)** — 알고리즘명은 정확하나 us_sector_wide의 append-only 갱신방식(974) 미기재 | 🔴 **90% 미만** — us_sector_wide sector非null 81.4%(4,204/5,167) |
| 19 | (정정 1002) 비어있음, STEP980 자체계산 | ✅ 코드 대조 완료(1002 정정 재확인) | 해당없음(자체계산, 외부 도달률 개념 없음) |
| 20 | (정정 1002) #16과 동일 슬롯 | ✅ 코드 대조 완료(1002 정정 재확인) | 해당없음(#16 참조) |

🔴 **90% 미만 슬롯 별도 표시**: **#12(자본지출률, 604유니버스 89.6%)** · **#18(섹터분류, us_sector_wide 81.4%)**. 광역 us_fundamentals(5,780행, revdcf 604 + "나머지" 혼합)의 fiscal_year 확정률(65.1%)도 90% 미만이나, 이는 슬롯4~10 자체의 실패가 아니라 "나머지" 유니버스가 예산(BUDGET_MS) 안에서 기회적으로만 채워지는 설계이므로 별도 각주로 남긴다(아래 §4-10 상세 참조).

---

## §1. 슬롯 1 — 시가총액

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `lib/lensPrecompute.ts:107`(`topByMarketCap`) 3단: Stage1 배치 `:122-140` · Stage2 개별재시도 `:142-181` · Stage3 7일폴백 `:183-236`. 소비처 `app/api/cron/revdcf/route.ts:234-237`(mcapBy 조립)·`:307`(NO_MARKETCAP 게이트)·`:310-313`(STALE_MARKETCAP 게이트, MCAP_TTL_DAYS=7) |
| 저장소 | `us_market_cap.market_cap`(PK=symbol, 누적캐시 — 갱신 실패 시 옛 `as_of`째로 남음) |
| 채우는 주체 | `lib/lensPrecompute.ts:574`(`computeLensScores`) → `app/api/cron/lens-scores/route.ts`(크론, 21:30 UTC) |
| 외부 소스 | `yf.quote(그룹)`(Stage1, 100개 청크·동시성6) · `yf.quote(symbol)`(Stage2, 개별) — `lib/lensPrecompute.ts:125,155` |
| 폴백 순서 | 배치(마켓캡 필드 있는 것만 채택) → 배치 결측분 중 최대 400건 개별 재시도(40초 예산) → 그래도 없으면 최근 7일 이내 `us_market_cap` 값 재사용(`fallbackUsed`) |

**판정: 🔴 불일치(정정안 제시)** — 카탈로그 "지금 쓰는 소스" 칸은 `"Yahoo 배치조회(정본, us_market_cap)"`만 적어 **Stage2(개별 재시도)·Stage3(7일 폴백) 두 단계가 통째로 빠졌다.** 이 STEP이 §2-1에서 명시적으로 지적한 자리와 정확히 일치. 정정안: `"Yahoo 3단 취득(배치→개별재시도400건/40s→7일폴백, lib/lensPrecompute.ts:107-236)"`.

**런타임 도달률**: 오늘(2026-08-13) 기준 `us_market_cap` 최신 `as_of`(2026-08-12) 비율 = 5,601/5,973 = **93.8%**(STEP1011 §2-2가 제시한 참고값과 일치, 재확인). 604 revdcf 유니버스 내에서는 `STALE_MARKETCAP` 사유가 30/604(**5.0%**) — 즉 604건 중 570건(94.4%)은 신선한 시총을 확보(관측만, 이 값의 원인 규명은 STEP1006~1010의 범위, 여기선 재사용만).

---

## §2. 슬롯 2 — 발행주식수

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `lib/revdcf/drivers.ts:367-373`(희석→기본→발행→dei 폴백) |
| 저장소 | `us_fundamentals.shares`는 없음(컬럼 자체가 없다 — `debt`·`non_operating_assets`·`shares`는 `route.ts:46`에서 `market.shares`로 조립돼 **`us_fundamentals`가 아니라 `revdcf_results.shares`에만** 저장됨, `route.ts:336`) |
| 채우는 주체 | `app/api/cron/revdcf/route.ts`(크론, 22:45 UTC) → `processOne()`(`:285-341`) → `computeDrivers()` |
| 외부 소스 | SEC `companyfacts` XBRL(`WeightedAverageNumberOfDilutedSharesOutstanding` 등, `drivers.ts:156,122`) |
| 폴백 순서 | `SHARES_DIL`(희석) → `SHARES_MORE`(기본·발행, `drivers.ts:122`) → `dei:EntityCommonStockSharesOutstanding`(`drivers.ts:372-373`) → 전부 없으면 `MULTI_CLASS_SHARES` skip(`drivers.ts:375-385`) |

**판정: 🔴 불일치(정정안 제시)** — "SEC XBRL 태그(역DCF)" 부분은 정확. 그러나 **"Yahoo 부수값(밸류)"는 코드 근거가 없다.** `lib/valuation.ts:62-101`(`computeValuation`)의 `ValuationInputs`는 `marketCap`·`netIncome`·`equity`·`revenue`·`operatingIncome`·`dna`·`debt`·`nonOperatingAssets` 8개뿐 — **`shares`를 입력으로 받지 않는다**(PER·PBR·PSR·EV/EBITDA 전부 `marketCap`을 직접 사용, 주식수로 나누지 않음). `lib/lensPrecompute.ts`에서 `sharesOutstanding`을 참조하는 곳은 986의 시총 재구성 진단(`:99`, 관측 전용·계산 미반영)뿐이다. 정정안: `"SEC XBRL 태그(역DCF만 — 밸류에이션 4축은 marketCap 직접사용이라 shares 자체가 불필요)"`.

🔴 **부수 발견(STEP1011 §2-1이 지목한 자리, 실측으로 재확인)**: `fundamentals.sourceTags`(→ `us_fundamentals.source_tags` 컬럼)에 실제로 담기는 키는 `netIncome`·`equity`·`preferredStock`·`minorityInterest`·`revenue`·`operatingIncome`·`dna`·`debt` **8개뿐**(`drivers.ts` 전체 grep으로 확인, `:286,288,305,306,311,315,319,414`) — **`shares` 키가 없다.** 채택된 태그명 자체(`sharesTag`)는 `drivers.ts:386`(`flags.sharesTag`)에 별도로 남지만, 이는 `revdcf_results.flags`에만 실리고(604건 한정) **`us_fundamentals` 테이블에는 어디에도 저장되지 않는다** — "나머지" 확장 유니버스(5,176건)는 어느 XBRL 태그로 주식수를 구했는지 기록이 아예 없다.

**런타임 도달률**: 604 유니버스에서 `MULTI_CLASS_SHARES`(주식수 완전 미해결) = 5/604(**0.83%**).

---

## §3. 슬롯 3 — 주가

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `app/api/cron/revdcf/route.ts:68-70`(priceBySym 조립, 표시용·계산 미사용) |
| 저장소 | `us_stock_perf.price` |
| 채우는 주체 | `lib/usPerf.ts`(`computeUsPerf`) → `app/api/cron/us-perf/route.ts`(크론, 22:00 UTC) |
| 외부 소스 | `yf.chart(sym, {period1, interval:"1d"})`(`lib/usPerf.ts:79`) |
| 폴백 순서 | 없음(단일 경로, 실패 시 해당 심볼만 결측) |

**판정: ✅ 일치.**

**런타임 도달률**: 6,377/6,383 = **99.9%**.

---

## §4~10. 슬롯 4~10 — SEC companyfacts 재무제표 계열

7개 슬롯이 같은 파이프라인(`app/api/cron/revdcf/route.ts:276-283`의 `fetchDrivers()` → `lib/revdcf/drivers.ts:200`의 `computeDrivers()`)을 공유해 한 절에 묶는다. **개별 판정은 슬롯마다 따로 적는다(STEP 지시대로 묶어서 뭉개지 않는다).**

| # | 슬롯 | 실제 읽는 지점(태그 배열) | 판정 |
|---|---|---|---|
| 4 | 순이익 | `NET_INCOME`(`drivers.ts:161`) — `NetIncomeLossAvailableToCommonStockholdersBasic`→`NetIncomeLoss`→`ProfitLoss` | ✅ 일치 |
| 5 | 자기자본(보통주) | `EQUITY`(`:163`) + `PREFERRED`(`:165`) + `NCI`(`:166`) → `commonEquity` 재구성(`:294-303`) | ✅ 일치 |
| 6 | 매출 | `REV`(`:93`) 4종 + 은행형 폴백(`REV_BANK_NII`+`REV_BANK_NONINT`, `:104-105,209-230`) | ✅ 일치 |
| 7 | 영업이익 | `OperatingIncomeLoss` → `매출−CostsAndExpenses` → `Pretax+Interest`(`:262-268`) | ✅ 일치(카탈로그 "폴백 포함" 문구가 정확히 이 3단을 가리킴) |
| 8 | D&A | `DNA_TOTAL`(4종 합계태그) → `Depreciation+AmortizationOfIntangibleAssets` 분리합산(`:271-279`) | ✅ 일치 |
| 9 | 부채 | `DEBT_TOTAL_SINGLE`(2종) → `DEBT_LT+DEBT_CUR+FIN_LEASE` 합산 → 미해결 스캔(969, `:388-417`) | ✅ 일치 |
| 10 | 비영업자산/현금 | `CASH_NONOP`+`SECURITIES` 합(`:419-422`), 유동자산·유동부채·영업현금은 게이트로만 사용(`:355-362`) | ✅ 일치 |

**공통 저장소**: `us_fundamentals`(net_income·common_equity·revenue·operating_income·dna·debt·non_operating_assets 컬럼). **공통 채우는 주체**: `app/api/cron/revdcf/route.ts`(22:45 UTC), revdcf 604 유니버스 우선 + "나머지" 유니버스(`us_cik_map ⋈ us_market_cap`, `:239-246`)를 `fetched_at` 오래된 순으로 예산 안에서 채움(`:248-256`). **공통 외부 소스**: `https://data.sec.gov/api/xbrl/companyfacts/CIK{10자리}.json`(`route.ts:278`).

**런타임 도달률**:
- **604 revdcf 유니버스**(revdcf_results, 2026-08-12 as_of) 기준 — 슬롯6(매출/창): `INSUFFICIENT_HISTORY` 29/604(**4.8%**) · 슬롯7(영업이익): `MISSING_TAG_OPERATING_INCOME` 17/604(**2.8%**) · 슬롯8(PP&E, driver5 재료): `MISSING_TAG_PPE` 13/604(포함 슬롯12에 산정) · 슬롯9(부채): `UNRESOLVED_DEBT` 1/604(**0.17%**) · 슬롯10(유동자산/부채·영업현금): `NOT_APPLICABLE_SECTOR` 6 + `MISSING_TAG_OPERATING_CASH` 3 = 9/604(**1.5%**).
- 🔴 **광역 `us_fundamentals`(5,780행, revdcf+나머지 혼합) 기준은 훨씬 낮다** — `fiscal_year` 확정 3,762/5,780(**65.1%**), `net_income` 3,760/5,780(**65.05%**), `revenue` 3,762/5,780(**65.09%**). 🔴 이 낮은 숫자는 슬롯4~10 자체의 실패가 아니라 **"나머지" 유니버스가 매일 예산(BUDGET_MS) 안에서 `fetched_at` 오래된 순으로 기회적으로만 채워지는 설계**(`route.ts:222-257`)이기 때문 — 604 유니버스는 매일 최우선으로 전량 처리된다.

---

## §11. 슬롯 11 — 세율

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `app/api/cron/revdcf/route.ts:215-217` |
| 저장소 | `damodaran_country_tax.marginal_rate`(country='United States of America'로 필터) |
| 채우는 주체 | `scripts/ingest_damodaran.ts`(수동 실행, 크론 미등록 — `.github/workflows/`·`vercel.json` grep 결과 0건) |
| 외부 소스 | Damodaran `countrytaxrates.xls`(카탈로그 원문 기재, 이번 STEP은 스크립트 소스 파싱 코드는 재검증 안 함 — DB 값만 대조) |
| 폴백 순서 | 없음(`.single()` — 행이 없거나 2개면 크론 자체가 예외로 죽음) |

**판정: ✅ 일치.**

**런타임 도달률**: 100%(단일 조회, 폴백 없음). `damodaran_country_tax` 229행, 최신 `as_of`=2026-01-05(1행뿐, 미갱신 — 슬롯16·17과 같은 시점 정지 상태, 별도 판정 사항 아님).

---

## §12. 슬롯 12 — 자본지출률

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `lib/revdcf/drivers.ts:452-463`(`fixedCapitalRateLevel`·`fixedCapitalRateMarginal` 이중 산정) |
| 저장소 | `revdcf_results.fixed_capital_rate`·`fixed_capital_rate_level`·`fixed_capital_rate_marginal`(`route.ts:334-335`) |
| 채우는 주체 | `app/api/cron/revdcf/route.ts` 내부 계산(외부 크론 아님) |
| 외부 소스 | 없음(원전 T5 방식의 내부 계산 — `PPE`·`CAPEX`·`DNA` 등은 이미 위에서 수집된 SEC 태그 재사용) |
| 폴백 순서 | 원전식(marginal) 계산 실패 시(`fixedCapitalRateMarginal==null`) → `NO_MARGINAL_CAPEX` skip(`route.ts:320-321`). level값은 항상 계산되지만 주 판정에는 안 쓰임(880 확정) |

**판정: ✅ 일치**("원전 T5 방식(내부 계산)" — 외부 소스 없음이 정확).

**런타임 도달률**: 🔴 **90% 미만.** 604 유니버스에서 `MISSING_TAG_PPE`(13) + `NO_MARGINAL_CAPEX`(50) = 63/604 = **10.4% 실패 → 89.6% 도달**.

---

## §13. 슬롯 13 — 운전자본률

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `lib/revdcf/drivers.ts:464`(`workingCapitalRate`) |
| 저장소 | `revdcf_results.working_capital_rate`(`route.ts:334`) |
| 채우는 주체 | `app/api/cron/revdcf/route.ts` 내부 계산 |
| 외부 소스 | 없음(원전 T4 방식 — `AssetsCurrent`·`LiabilitiesCurrent`·`CASH_OP`는 게이트에서 이미 확보된 값 재사용) |
| 폴백 순서 | 없음(게이트 통과 시 항상 계산 — `MISSING_TAG_OPERATING_CASH` 등은 슬롯10 게이트에서 이미 걸러짐) |

**판정: ✅ 일치.**

**런타임 도달률**: 슬롯10 게이트(현금 확보)를 통과한 건은 항상 계산됨 — 별도 실패 사유 없음(슬롯10 도달률과 동일선상).

---

## §14. 슬롯 14 — 무위험수익률

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `app/api/cron/revdcf/route.ts:210-213`(`latestAsOf`로 최신 행 선택 후 `riskfree_rate` 추출) |
| 저장소 | `damodaran_global_inputs.riskfree_rate`(as_of별 행) |
| 채우는 주체 | `scripts/ingest_damodaran.ts:145-146`(wacc.xls 기반, 원 행) · **`scripts/ingest_erp_monthly.ts:66`(ERPbymonth.xlsx 기반, STEP1005 신규 행)** — 둘 다 수동 실행, 크론 미등록 |
| 외부 소스 | 실측: `damodaran_global_inputs` 현재 **2행** — `as_of=2026-01-05`(wacc.xls 유래) · `as_of=2026-08-01`(**ERPbymonth.xlsx 유래**, STEP1005). `route.ts:210`의 `latestAsOf()`는 **더 최신인 2026-08-01행을 선택** |
| 폴백 순서 | 없음(`latestAsOf` 실패 시 크론이 명시적 Error로 죽음, `route.ts:211`) |

**판정: 🔴 불일치(정정안 제시)** — 카탈로그가 "Damodaran wacc.xls 상단값(연1회라 서술되나 실질 정체 7개월+)"이라 적고 있으나, **STEP1005(2026-08-13 이전)가 `ERPbymonth.xlsx` 유래 새 행(as_of=2026-08-01)을 이미 INSERT했고, `route.ts`의 `latestAsOf()` 로직은 항상 가장 최신 `as_of`를 고르므로 실제 프로덕션이 지금 쓰는 값은 wacc.xls가 아니라 ERPbymonth.xlsx다.** STEP1011 §2-1이 정확히 예견한 불일치. 정정안: `~~Damodaran wacc.xls 상단값(연1회라 서술되나 실질 정체 7개월+)~~ → Damodaran ERPbymonth.xlsx "$ Riskfree Rate"열(월1회, latestAsOf가 최신행 자동선택 — 2026-08-01행이 현재 활성. wacc.xls 유래 구행(2026-01-05)은 테이블에 남아있으나 더 이상 안 읽힘) (1011 정정)`.

🔴 **부수 확인(카탈로그 후보란이 이미 예견)**: `lib/revdcf/riskfree.ts`(STEP1000 신설, FRED 대체 경로)는 **`route.ts`의 import 목록에 없다**(전체 import 재확인, `route.ts:1-14`) — 여전히 미배선. 카탈로그의 기존 후보란 서술("유일한 유효 후보 = ERPbymonth.xlsx")은 **이미 1005로 실현됐으므로 더 이상 "후보"가 아니라 "현재값"**이다.

**런타임 도달률**: 100%(2행 중 최신 1행 항상 해소).

---

## §15. 슬롯 15 — ERP

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `app/api/cron/revdcf/route.ts:212-213`(`gi.erp`, 슬롯14와 같은 행 조회에서 동시 추출) |
| 저장소 | `damodaran_global_inputs.erp`(슬롯14와 같은 테이블·같은 행) |
| 채우는 주체 | 슬롯14와 완전 동일(`ingest_damodaran.ts`/`ingest_erp_monthly.ts`) |
| 외부 소스 | 슬롯14와 완전 동일 — 현재 활성 행(as_of=2026-08-01)은 `ERPbymonth.xlsx`의 ERP 열 |
| 폴백 순서 | 슬롯14와 동일(짝 제약 — 의존관계①ⓐ, 같은 쿼리 한 번으로 둘 다 나옴) |

**판정: 🔴 불일치(정정안 제시)** — 슬롯14와 **완전히 같은 사유**. 정정안도 동일 패턴: `~~Damodaran wacc.xls 상단값(연1회, 사실상 정체 7개월+)~~ → Damodaran ERPbymonth.xlsx "ERP(T12m) with adj riskfree rate"열(#14와 같은 행에서 짝으로 옴, 2026-08-01행 활성) (1011 정정)`.

**런타임 도달률**: 슬롯14와 동일(100%, 같은 쿼리).

---

## §16. 슬롯 16 — 베타

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `app/api/cron/revdcf/route.ts:224-230`(`betaByInd` 조립) · `:305`(`indByT.get`→`betaByInd.get`) · `:316`(`assembleWacc`에 주입) |
| 저장소 | `damodaran_beta.unlevered_beta_cash_adj`·`std_dev_equity`(industry 컬럼으로 키) |
| 채우는 주체 | `scripts/ingest_damodaran.ts`(수동, 크론 미등록) |
| 외부 소스 | Damodaran `betas.xls`(카탈로그 원문 기재, 이번엔 값 대조만 — 파싱 코드 재검증 안 함) |
| 폴백 순서 | 없음(`ind`나 `beta`가 없으면 `NO_INDUSTRY` skip, `route.ts:306`) — 후보 1개뿐(실질적 단일, 1002 재분류 재확인) |

**판정: ✅ 일치.** `damodaran_beta` 94행, `as_of=2026-01-05` 단일(변화 없음 — #14/#15와 달리 이 테이블엔 새 행이 안 들어왔다, ingest_damodaran.ts 재실행 이력 없음).

**런타임 도달률**: 604 유니버스 `NO_INDUSTRY` = 10/604(**1.66%**) → 98.3% 도달.

---

## §17. 슬롯 17 — 신용스프레드

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `app/api/cron/revdcf/route.ts:219-222`(`spreads` 조립) · `lib/revdcf/compute.ts:41-45`(`creditSpreadFor`) |
| 저장소 | `damodaran_credit_spread`(std_dev_lo·std_dev_hi·spread 밴드) |
| 채우는 주체 | `scripts/ingest_damodaran.ts`(수동, 크론 미등록) |
| 외부 소스 | Damodaran `ratings.xls`/`wacc.xls`(카탈로그 원문 기재) |
| 폴백 순서 | `creditSpreadFor`가 표준편차 구간을 못 찾으면 **최상단 밴드로 대체**(`compute.ts:44`, `sorted[sorted.length-1].spread`) — 그래서 실패 사유 자체가 없음(항상 값 반환) |

**판정: ✅ 일치.** 후보란의 "카테고리25(FRED ICE BofA OAS)"는 이미 정확히 "후보"로만 서술돼 있음(현재 소스로 오기재 아님).

**런타임 도달률**: 100%(밴드 함수 설계상 실패 케이스 없음). `damodaran_credit_spread` 7행, `as_of=2026-01-05`(변화 없음).

---

## §18. 슬롯 18 — 섹터분류

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `lib/sector.ts:80-223`(`resolveSector`, 0~4순위) — 소비처 `app/api/cron/revdcf/route.ts:135`(`computeAndSaveSectorRelative` 내부, `us_sector_wide` 증분 갱신) |
| 저장소 | `us_sector_wide.sector`(as_of·symbol 복합키) — Q0 백분위용은 별도로 `us_sector_relative.sector`에도 복사(`route.ts:168`) |
| 채우는 주체 | `app/api/cron/revdcf/route.ts:132-152`(신규 심볼만 `resolveSector` 호출 후 upsert) |
| 외부 소스 | 0순위 `us_sector_gics`(SPDR) → 1순위 `damodaran_industry.primary_sector` → 2순위 형제클래스(구두점 패턴 + `GOOG/FOX/NWS` 3쌍) → 3순위 `us_sector_yahoo` → 4순위 미분류(`sector.ts:152-219`) |
| 폴백 순서 | 위 4단 그대로(0~4순위, 4순위=미분류로 Map에 안 실림) |

**판정: 🔴 불일치(정정안 제시)** — "resolveSector() 0~4순위(SPDR→Damodaran→형제→야후→미분류)"는 **해석 알고리즘 자체는 정확**하지만, **`us_sector_wide`가 어떻게 갱신되는지(STEP974 방식 ⓐ)를 슬롯 매핑 칸이 아예 언급하지 않는다** — 새 `as_of`를 만들지 않고 **기존 `as_of`(현재 2026-08-08)에 신규 심볼만 append**하는 방식(`route.ts:116-120` 주석·`:124-148` 구현)이라, "언제 갱신되는가"라는 질문에 슬롯 매핑만으로는 답할 수 없다. 정정안: `resolveSector() 0~4순위(SPDR→Damodaran→형제→야후→미분류) — us_sector_wide는 새 as_of를 안 만들고 기존 as_of(현재 2026-08-08)에 신규 심볼만 append(STEP974 방식ⓐ, route.ts:116-148) (1011 정정)`.

**런타임 도달률**: 🔴 **90% 미만.** `us_sector_wide` 5,167행 중 `sector IS NULL` 963행 → non-null **4,204/5,167 = 81.4%**.

---

## §19. 슬롯 19 — 업종배수

| 칸 | 내용 |
|---|---|
| 실제 읽는 지점 | `lib/sectorRelativeBatch.ts:71`(`sectorMedianRelative` 호출) → `lib/sectorRelative.ts:103`(정의) |
| 저장소 | `us_sector_relative.per_med`·`pbr_med`·`psr_med`·`ev_ebitda_med`(섹터·축별 중앙값) |
| 채우는 주체 | `app/api/cron/revdcf/route.ts`(22:45 UTC, `computeAndSaveSectorRelative` 내부) |
| 외부 소스 | **없음** — 자기 유니버스(`us_valuation`)의 섹터별 값을 스스로 집계(외부 배수 벤치마크 미사용) |
| 폴백 순서 | 없음(표본<`minSample`이면 그 섹터·축은 unavailable) |

**판정: ✅ 일치(1002 정정 재확인).** `lib/valuation.ts:11,30`·`lib/revdcf/drivers.ts:159`의 `pedata.xls`/`vebitda.pdf` 인용은 **정의 근거 주석으로만 존재**(grep 재확인 — `ingest`나 실제 파싱 코드에 이 파일들에 대한 참조 없음), 1002가 "비어 있다"고 정정한 판단이 그대로 유효.

**런타임 도달률**: 해당없음(자체 계산, 외부 도달률 개념이 성립하지 않음).

---

## §20. 슬롯 20 — 업종베타

**판정: ✅ 일치(1002 정정 재확인).** `route.ts:224-230,305`(`betaByInd` 조립 및 사용처)를 다시 열어 확인 — `damodaran_beta.unlevered_beta_cash_adj`가 유일한 beta 소스이고 쓰이는 곳도 `releveredBeta` 계산(`lib/revdcf/compute.ts:31`) 단 한 곳뿐이다. **#16과 완전히 동일한 소스·동일한 소비처** — 1002의 "카탈로그 이중 등재 오류" 판정이 재확인으로도 그대로 유지된다.

**런타임 도달률**: 해당없음(#16 참조).

---

## §C. 완료 조건 재정의 — 🔴 제안만, 문서(DATA_SOURCE_CATALOG.md 등)는 고치지 않음

STEP1011 §2-3 C 지시대로 **판정 요청 형식**으로만 적는다. 실행하지 않는다.

### 조건 6개 중 3·5·6번이 카탈로그의 조건이 아니라는 근거

카탈로그 완료조건 6개(`docs/DATA_SOURCE_CATALOG.md` §5, 원문 미확인 시 이 STEP 범위 밖이라 조건 원문 자체는 재인용하지 않고 998/1002가 이미 남긴 서술을 그대로 따른다)는:
- **조건 3(의사결정 이력 정리)**: 카탈로그가 "무엇이 왜 이렇게 됐는지"를 기록하는 조건 — 이건 카탈로그의 **내용 정확성**이 아니라 **문서화 완결성**의 조건이다. 슬롯 대조(이번 STEP)와 독립적으로 성립·불성립할 수 있다.
- **조건 5(실행 준비)**: 다음 작업(예: R5 라운드)을 시작할 수 있는 상태인지 — 이건 카탈로그 자체가 아니라 **다음 일의 착수 조건**이다.
- **조건 6(탐색 재개 여부)**: R5 라운드를 열지 말지 — 이것도 카탈로그의 정확성과 무관한 **범위 결정**이다.

세 조건 다 "카탈로그의 슬롯 매핑이 코드와 일치하는가"라는 질문(=조건 1)과 **답이 서로 독립적**이다 — 조건1이 통과해도 3·5·6은 별도로 미충족일 수 있고, 반대도 마찬가지다.

### 뗄 경우 남는 조건 1·2·4의 상태 — 이번 실측 숫자를 붙여서

- **조건 1(슬롯 매핑이 코드와 일치)**: 🔴 **이번 실측 = 20개 중 5개 불일치(25%)**. 그중 2개(#14·#15)는 **최근 1주 이내 실제로 바뀐 프로덕션 상태를 카탈로그가 못 따라간 것**(정보 노후화형), 1개(#1)는 **애초에 서술이 불완전했던 것**(3단 중 1단만 기재, 작성형 누락), 1개(#2)는 **근거 없는 서술이 그대로 남아있던 것**(미검증 주장 잔존), 1개(#18)는 **알고리즘은 맞으나 운영 방식이 누락된 것**(부분 서술).
- **조건 2**: 998/1002가 이미 "✅"로 판정(이번 STEP은 조건2 자체를 재검증하지 않음 — 범위는 슬롯 매핑 20줄뿐).
- **조건 4**: 998/1002가 이미 "✅"로 판정(마찬가지로 재검증 범위 밖).

### 🔴 불일치 건수에 따라 재정의 자체가 달라진다는 점

이번 실측(5/20=25% 불일치)은 STEP1011 §2-3이 제시한 두 극단(0~1건=사실상 통과 · 5건 이상=최우선 미해결) 중 **"5건 이상"** 쪽에 해당한다. 다만 5건의 **성격이 균질하지 않다** — 2건(#14·#15)은 이번 주 안에 생긴 최신성 문제라 "카탈로그를 못 고쳐서"가 아니라 "너무 빨리 바뀌어서" 생겼고, 나머지 3건(#1·#2·#18)은 애초에 검증 없이 쓰여 있던 서술이다. 🔴 **어느 쪽으로 판정할지는 고르지 않는다** — 숫자와 성격 구분만 놓는다. (본 STEP §2-3 지시: "🔴 어느 쪽인지 고르지 말 것.")

---

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- 카탈로그 완료조건 2·4번 자체의 재검증(이 STEP 범위는 슬롯 매핑 20줄뿐, 998/1002 판정을 그대로 인용).
- `scripts/ingest_damodaran.ts`/`ingest_erp_monthly.ts`의 **파싱 코드**(엑셀 셀 좌표 정확성) 재검증 — 이번엔 **DB에 이미 들어간 값과 route.ts의 소비 지점**만 대조했다(원본 엑셀 재개봉 안 함).
- 슬롯4~10의 광역 `us_fundamentals`(65.1%) 낮은 도달률의 정확한 원인 분해(BUDGET_MS 소진 vs 실제 SEC 결측 비율) — 각주로만 남기고 별도 실측은 안 함.

**철회·정정한 것**
- 없음(이 STEP 자체가 카탈로그의 정정 대상 5건을 새로 만든 것이지, 이전 STEP의 판단을 철회한 것은 아니다 — #19·#20은 1002의 정정을 "재확인"했을 뿐 새로 뒤집지 않았다).

**미측정으로 남은 것**
- 조건1 재정의를 "5건 불일치=최우선 미해결"로 볼지 "노후화 2건은 별건, 실질 불일치는 3건"으로 볼지 — 판정은 장은태.
- #1(시총)·#18(섹터) 90% 미만 도달률의 **처방**(어느 쪽을 언제 고칠지) — 이 STEP은 숫자만 놓는다.
- `revdcf` heartbeat(1007 W1) — 이 STEP 작업 시각은 22:45 UTC 이전이라 미도래. `cron_heartbeats` 읽기 전용 확인 결과 여전히 4행(`email-brief`·`jp-disclosures`·`kr-lens-scores`·`lens-scores`)뿐, `revdcf` 없음. 다음 정규 크론 이후 확인으로 남긴다.

🔴 **판정은 장은태가 한다. 이 STEP은 숫자를 놓는 것까지다.**
