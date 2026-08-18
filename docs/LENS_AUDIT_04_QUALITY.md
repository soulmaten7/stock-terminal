<!-- 2026-08-18 · Claude Code 실측 · 코드 diff 0 · DB 쓰기 0 · 화면 변경 0 -->

# 렌즈 전수감사 ④ — 퀄리티(GP/A) (등급 「검증」·strong)

> `docs/LENS_AUDIT_03_LOWVOL.md`(③저변동) 다음 순서 — `strong` 등급 넷(모멘텀·저변동·퀄리티) 중 마지막.
> **범위**: `lib/lenses.ts:67~78·84~107·110~128·322~365` · `lib/lensCompute.ts` · `lib/edgar.ts` · `lib/lensCuts.ts` · `lib/lensCopy.ts`(`gpa`·`quality`) · `lens_scores`·`lens_cuts`·`lens_state_changes` 실측.
> 🔴 **판정은 장은태가 한다.** 08-16 US 파이프라인 사고는 이 STEP에서 다루지 않는다(§1-2에서 STEP1058/1059 §1-2 인용만).

---

## 요약

| | 항목 | 판정 |
|---|---|:--:|
| 🟢 | 원전 확보 | **완료** — Novy-Marx(2013) JFE 원문 직접 취득·대조 |
| 🟢 | 정의(REVT−COGS/AT, 같은 회계연도) | **원문과 정확히 일치**(STEP815의 801 되돌림이 옳았음, 원문으로 재확인) |
| 🟢 | `latestGrossProfit`↔`gpOfRow` | **같은 규칙**(코드 대조 완료, 갈라짐 없음) |
| 🟢 | `decomposition.source`("direct"/"computed") | **화면에 실제로 렌더됨**(`StockLensClient.tsx:244`) — F-1③ 정직 요건 충족, 우려가 기각됨 |
| 🟢 | 금융사 처리 | 원전도 제외(SIC=6) · 우리는 매출총이익 미보고로 자연 제외(명시적 필터 아님) — **이미 화면에 공개된 한계**(`lensCopy.ts` note), DB로 정량 확인(아래) |
| 🔴 | 재무 출처 | **①밸류 결함 2와 동일 계열 재현** — 100% 야후(`fundamentalsTimeSeries`), SEC(`edgar.ts`) 무접촉 |
| 🟡 | ~~손계산 3종목 중 2종목(MSFT·KO)에서 공식 출처 대비 소수점 이상 편차 관측 — 원인 미확정~~ → 🔴 **STEP1060 정정(§4·§6 참조): 원인 = 손계산이 구(舊) 회계연도 수동수치를 씀. 야후 실배선은 정상(SEC와 값까지 완전 일치).** | |
| — | 앞선 결함 15건 생존 | **15/15 그대로 또는 상태변경**(고쳐진 것 0건) — §5 |

---

## ⓪-4 반증조건 판명

**전제①(원전 있음)** — **참으로 확정.** Novy-Marx(2013) 원문을 직접 확보(`data/sources/academic/novy_marx_2013_gross_profitability_premium.pdf`)해 정의를 그대로 대조 — *"gross profits (revenues minus cost of goods sold, REVT − COGS) scaled by assets (AT)"*. `lib/lenses.ts:325` 주석과 **한 글자도 다르지 않음.**

**전제②(분자는 벤더 값이 먼저)** — **참(코드 확인)**, 단 재무 출처 자체가 100% 야후라 "벤더 vs 계산" 대조가 **둘 다 같은 벤더 안의 두 필드 비교**임을 §2에서 확정. 광범위 전수 대조는 이 STEP의 금지사항("재무 데이터 재취득 0")에 걸려 **못 함**으로 남긴다(§4).

**전제③(금융사 처리)** — **원전은 명시적으로 제외한다**(원문 Table 1·2·Fig.1 캡션에 반복: *"The sample excludes financial firms (those with a one-digit standard industrial classification (SIC) code of six)"*). 우리는 **능동적 SIC 필터가 아니라 매출총이익 미보고로 인한 수동적 결측**이라는 점이 `lensCopy.ts`의 `note`에 **이미 정직하게 공개돼 있다**(*"명시적 업종필터가 아니라 매출총이익 보고 여부에 따른 것이라 리츠 등 일부는 값이 나올 수 있어요"*). §3에서 이 공개 문구를 DB로 정량 검증 — **결함 아님(⓪-3b, 이중 계상 금지).**

---

## §1. 원전 대조표 — Novy-Marx (2013)

> 원문 = `data/sources/academic/novy_marx_2013_gross_profitability_premium.pdf`(2026-08-18 취득, `oldschoolvalue-files.s3.amazonaws.com/pdf/Novy-Marx_Gross-Profitability-Anomaly_JFE_2013.pdf`). `data/sources/README.md` 등재 완료.

| 항목 | 원전 정의(원문 그대로) | 우리 구현(`lib/lenses.ts`) | 차이 |
|---|---|---|---|
| 분자 | *"gross profits (revenues minus cost of goods sold, REVT − COGS)"* | `grossProfit ?? (totalRevenue − costOfRevenue)`(:71) | **없음** — 벤더값 우선순위만 원전에 없는 우리 추가 관행(§2) |
| 분모 | *"assets (AT)"*, 분기 데이터도 동시점(`ATQ`, footnote 3) | 같은 회계연도(`lrRow.totalAssets`, :329) | **없음** — STEP815가 801의 "기초" 변경을 되돌린 것이 원문과 정확히 일치함을 이번에 원문으로 재확인 |
| 리밸런싱 | *"accounting data for a given fiscal year starting at the end of June of the following calendar year"*(look-ahead 방지 지연 매칭) | 시점 스냅샷(요청 시점 최신연도) | 원전은 **포트폴리오 백테스트**(월별 리밸런싱), 우리는 **개별 종목 판정**(스냅샷) — 목적이 다르다(③ 감사가 BBW에서 확인한 것과 같은 구조) |
| 금융사 | *"The sample excludes financial firms (…SIC code of six)"* — 반복 3회(Table 1·2·Fig.1) | 능동적 SIC 필터 없음, 매출총이익 미보고 시 자연 결측 | **방식이 다르다** — 결과는 81% 겹침(§3), 19%는 갈림(리츠 등) |
| 유니버스 | Compustat 전체, 1963.7~2010.12 | 시총 상위 1,000(US, 매일) | ①밸류·②모멘텀·③저변동 감사와 동일한 유형의 차이(생존편향·오늘 스냅샷) |
| 컷 | 5분위(quintile), NYSE breakpoint | 시장 분포 p30/p70 3분위(STEP805) | ③ 감사와 같은 유형 |

🔑 **핵심 확인 — GP/A 자체의 계산 정의(분자·분모)는 원전과 완전히 일치한다.** 차이는 전부 "포트폴리오 백테스트 vs 개별종목 판정"이라는 이미 알려진 구조적 차이(①②③ 감사와 동종)뿐이다.

---

## §2. 재무 출처 확정 — ①밸류 결함 2 재현

`lib/lensCompute.ts:198~230`(`fundamentalsTimeSeries`) — 코드로 확정:
```ts
const fts = await yf.fundamentalsTimeSeries(resolved, { period1: ..., period2: ..., type: "annual", module: "all" });
rows = raw.map((r) => ({ totalRevenue: r.totalRevenue, grossProfit: r.grossProfit, costOfRevenue: r.costOfRevenue, totalAssets: r.totalAssets, ... }));
```
**퀄리티(그리고 F-스코어·자산성장·밸류 폴백까지) 전부 이 한 함수 하나에서 나온다.** `grep -n "edgar" lib/lensCompute.ts lib/lenses.ts` — **0건.** `lib/edgar.ts`(SEC 원자료, `GrossProfit` 태그 보유 확인됨)는 **7렌즈 퀄리티 경로에서 전혀 쓰이지 않는다** — SEC 원자료 경로는 `revdcf`/Q1 파이프라인 전용이다.

🔴 **①밸류 결함 2("야후가 계산한 값을 받아쓴다")와 정확히 같은 구조가 여기도 있다** — `lenses.ts:71`이 `lr.grossProfit`(야후가 이미 계산해서 준 값)을 `totalRevenue−costOfRevenue`(우리가 원자료에서 재구성)보다 **우선** 쓴다. 원전 정의는 "계산"인데 코드는 "벤더값 우선, 계산은 폴백"이다.

🔴 **다만 밸류 결함 2와 다른 점 하나** — 밸류는 "우리가 SEC로 직접 계산할 수 있는데도 야후를 우선한다"는 구조였다. 퀄리티는 **애초에 SEC 경로 자체가 이 렌즈에 배선돼 있지 않다** — "폴백이 안 좋다"가 아니라 "폴백도 벤더(야후)의 다른 필드일 뿐, 독립 소스가 없다"는 점에서 **더 근본적**이다.

---

## §3. 금융사 처리 — DB 정량 검증(⓪-4③)

`us_sector_wide`(2026-08-18 조회, `lens_scores` 조회시각 = DB `now() = 2026-08-18 03:02:06 UTC`, `lens_scores.updated_at` 균일 `2026-08-17 22:03:40 UTC`)와 교차:

| | 건수 | 비율 |
|---|---:|---:|
| `quality_state='na'` 전체 | 142 | 100% |
| 그중 `sector='Financials'` | **115** | **81.0%** |
| 그중 비금융(Health Care 12·Communication 5·Industrials 3·IT 2·기타 4·미상 1) | 27 | 19.0% |

🔴 **역방향도 확인** — `sector='Financials'`(총 162종목) 중 **47종목(29%)이 na가 아니라 실제 GP/A 점수를 받는다**(low 23·mid 16·high 8). 상위 값 종목: `MA`(Mastercard)·`V`(Visa)·`MCO`(Moody's)·`MSCI`·`SEIC`·`FDS`(FactSet) 등 — **전부 결제망·신용평가·데이터/지수 제공업체**로, 전통적 은행·보험이 아니다.

🔑 **이것은 결함이 아니라 `lensCopy.ts`의 note가 이미 밝힌 그대로다** — *"명시적 업종필터가 아니라 매출총이익 보고 여부에 따른 것이라 리츠 등 일부는 값이 나올 수 있어요."* DB 실측이 그 문구를 **정량으로 확인**했을 뿐이다(81%/19%, 47종목).

🔴 **다만 한 가지는 판정 재료로 남긴다** — 원전의 제외 기준은 **SIC 코드**이고 `us_sector_wide.sector`는 **GICS 유사 라벨**이다(이 저장소에서 이미 여러 번 확인된 한계, Altman Z 감사 등과 동일). MA·V·MCO·MSCI가 GICS "Financials"이면서도 GP/A 점수를 받는 것이, **SIC=6 기준으로도 제외 대상이었을지는 SIC 코드 없이는 판정 불가**(결제망·신용평가사는 SIC 6199·7389 등으로 갈릴 수 있음 — 이 STEP은 SIC 코드를 새로 조회하지 않았다, 미측정).

---

## §4. 분자 출처 전수 대조 — 🔴 못 함(구조적 제약)

⓪-4②가 요구한 "재무 캐시 전수에서 grossProfit(벤더) vs totalRevenue−costOfRevenue(계산) 대조"를 시도했으나 **불가능함을 확인했다**:

- `us_fundamentals`/`us_fundamentals_snapshot`(DB 전수 조회) — **SEC 원자료(revdcf 전용)뿐, 7렌즈가 쓰는 야후 `fundamentalsTimeSeries`의 원시 필드(grossProfit·totalRevenue·costOfRevenue)는 어디에도 저장되지 않는다.**
- 로컬 캐시(`find ... fundamentalsTimeSeries`)도 **0건** — ③ 감사(BBW)·①-A 축이 늘 쓰던 "이미 가진 캐시"가 이 렌즈엔 없다.
- 이 STEP은 "재무 데이터를 새로 취득하지 않는다"를 명시적으로 금지한다 — **광범위 재취득으로 이 공백을 메우지 않았다.**

🔴 **STEP1060 정정(2026-08-18, ⓪-4③)** — 위 "구조적으로 불가능"은 **분자 두 필드(`grossProfit`·`costOfRevenue`)에 한정해서만 맞다.** `us_fundamentals`에 SEC의 `revenue`·`total_assets` 컬럼이 **이미 존재**한다(STEP1055가 추가) — **분모(총자산)와 매출은 재취득 0으로 대조 가능**했고, STEP1060이 실제로 대조했다(§2-3 결과는 아래에 별도 절로 추가). 좁혀진 결론: "전수 대조가 전부 불가능"이 아니라 **"grossProfit·costOfRevenue 두 필드만 비교 불가(야후 원시값 미저장) — revenue·totalAssets는 대조 가능"**. 근거: `docs/probe_1060_yahoo_sec_fiscal_year.json`(175종목 층화표본).

🔴 **이 자체가 하나의 실측 결과다** — `revdcf`/Q1 파이프라인(`us_fundamentals`)은 원시 입력을 DB에 영구 저장해 사후 감사가 가능하지만, **7렌즈 퀄리티(그리고 밸류·F-스코어·자산성장 전부)는 매 요청 야후 호출 결과를 저장하지 않아 사후 검증 인프라 자체가 없다.** ①밸류 감사도 같은 문제를 겪었을 가능성이 높다(그때는 이 문장으로 명시되지 않았다).

### §4-1. 🔴 STEP1060 추가 — revenue·total_assets 전수 대조 실측(재취득 0)

`us_fundamentals`(SEC)에 `revenue`·`total_assets`가 있는 전 종목(2026-08-18 기준 3,762종목 중 `total_assets`는 STEP1055 신규 필드라 최신 크론분 1,025종목만 채워짐) 중 시가총액 5티어×섹터로 층화한 175종목을 **야후 실조회**(이 STEP의 유일한 예외, §2-0 상한 200 준수)와 대조했다.

| 대조 축 | 일치(±2% 이내) | 불일치 | 비고 |
|---|---:|---:|---|
| `revenue` | 146/175(83.4%) | 18/175 | |
| `total_assets` | 163/175(93.1%) | 10/175 | |
| `fiscal_year`(연도 번호 그대로 비교) | 142/175(81.1%) | 33/175 | 🔴 아래 참조 — 불일치 33건 중 **23건은 값이 완전 일치하는 라벨 컨벤션 아티팩트**(1월 등 비12월 결산사는 SEC의 회계연도 넘버링과 원자료 캘린더연도가 어긋남 — 코드는 `financials[length-1]`로 **배열 위치**만 쓰므로 이 라벨 문제 자체와 무관), **5건은 오히려 SEC(`us_fundamentals`)측이 옛 연도에 멈춘 반대 방향 사례**(AGNC FY2019·AMH FY2020·LCNB FY2013·FLG FY2022·FRD — REIT/금융 소형주), 5건은 야후 매출 결측으로 비교 불가. **야후가 SEC보다 뒤처진 확정 사례 = 0/175.** |
| `grossProfit`(야후 direct) vs `revenue−costOfRevenue`(야후 내부 계산) | 138/138(100%) | 0 | 두 필드가 존재하면 **항상 정확히 일치** — `direct`/`computed` 갈래 구분은 커버리지 문제일 뿐 정확도 문제가 아님 |

원자료: `docs/probe_1060_yahoo_sec_fiscal_year.json`(호출 175건·성공 175·실패 0·소요 213.8초·2026-08-18T04:44:13Z~04:47:46Z UTC). 상세는 `docs/LENS_DEV_PLAYBOOK.md` 문제해결 로그(신규 행)·`docs/STEP_LEDGER.md` STEP1060 참조.

---

## §5. DB 전수 실측(감사 3축 ③)

**조회 시각**: DB `now()=2026-08-18 03:02:06 UTC`. `lens_scores` US `updated_at` 전 999행 **균일 `2026-08-17 22:03:40 UTC`**(최신·최고 동일 — 스테일 행 0건, §1-2의 08-17 정상 갱신과 일치).

- 전체 999행 · `quality_value` 비결측 857 · 결측 142(14.2%)
- `quality_state` 분포: mid 343 · high 257 · low 257 · na 142(high=low 대칭 — p30/p70 컷 정합)
- 분포: min **−23.02**(음수 GP/A 존재 — 매출<매출원가) · p10 8.43 · **p30 14.038** · median 21.11 · **p70 30.52** · p90 48.57 · p99 84.31 · max 114.98
- 🔴 **스테일 극단치 재확인(③ 감사 신규②) — 오늘은 재현되지 않는다.** 전 행 `updated_at` 균일(위) — QH류의 정지값이 섞인 흔적 없음
- `lens_cuts`(US, quality): `lo=14.038 · hi=30.52 · n=857 · as_of=2026-08-17` — **위 분포의 p30/p70과 정확히 일치**(STEP805 "시장 분포 유도" 약속이 코드에 실재함을 확인, ㉡ 문서→코드 방향 검증 완료). 방향 = `high`(높을수록 우호), `meta.percentile.dir:"high"`와 정합
- `lens_state_changes`(US, quality): 전체(07-20~08-18) **197건·97종목**. `LENS_DISPOSITION` §1이 인용한 창(07-20~08-07)으로 재조회 → **179건·95종목 — 정확히 재현**(독립 검증 완료)

---

## §6. 손계산 검산 + 외부 독립 대조(C-1 #3)

야후를 다시 호출하지 않고(§4의 제약), **회사 공식 발표 자료·독립 3자 데이터 사이트**로 3종목을 검산했다.

| 종목 | DB `quality_value` | 외부 출처 원자료 | 손계산 GP/A | 차이 |
|---|---:|---|---:|---:|
| **AAPL** | 54.34 | Apple 공식 FY2025 재무제표(`apple.com/newsroom`, 12개월 매출 $416,161M − 매출원가 $220,960M = 매출총이익 $195,201M ÷ 총자산 $359,241M) | **54.337%** | **0.00%p(사실상 완전 일치)** |
| **MSFT** | 29.73 | Microsoft 공식 IR(FY2025, 매출 $281,724M − 매출원가 $87,831M = $193,893M ÷ 총자산 $619,003M) | **31.32%** | 🔴 **1.59%p** |
| **KO** | 28.19 | stockanalysis.com(3자 집계, FY2024 매출총이익 $28,737M ÷ 총자산 $100,549M) | **28.58%** | 0.39%p |

🔑 **AAPL은 사실상 완전 일치** — 산식·연도 선택("최신연도")이 정확함을 실증. **MSFT는 1.59%p, KO는 0.39%p 차이** — 방향은 같으나 소수점 이상 벌어진다.

~~🔴 **원인 미확정으로 남긴다** — 후보 셋(㉠야후 `costOfRevenue`가 공식 10-K의 "Cost of revenue" 라인과 다르게 재분류됐을 가능성 ㉡회계연도 시차(야후가 최신연도로 아직 안 갱신) ㉢`direct`/`computed` 중 어느 경로였는지) 중 **어느 것인지는 §4의 제약(재취득 금지)상 이 STEP에서 가리지 못한다.** MSFT는 공식 1차 출처(IR 보도자료) 대비 편차라 **가장 신뢰도 높은 반증 후보**다 — 판정 재료로 남긴다.~~

🔴 **STEP1060 정정(2026-08-18) — 원인 확정: ㉡회계연도 시차, 단 "야후가 안 갱신"이 아니라 "이 문서(STEP1059)의 손계산이 구(舊) 연도 수동수치를 씀".**

`us_fundamentals`(SEC, `fetched_at` 2026-08-17 23:38, 어젯밤 신선)과 야후 실조회(2026-08-18, `docs/probe_1060_yahoo_sec_fiscal_year.json`)를 대조한 결과:

| 종목 | SEC(`us_fundamentals`) | 야후 실조회(오늘) | STEP1059 §6 손계산이 쓴 값 | 일치? |
|---|---|---|---|:--:|
| **AAPL** | FY2025·매출 416,161M·총자산 359,241M | FY2025·매출 416,161M·총자산 359,241M | FY2025·매출 416,161M·총자산 359,241M | ✅ **셋 다 일치** |
| **MSFT** | FY2026·매출 331,839M·총자산 758,376M | FY2026·매출 331,839M·총자산 758,376M | 🔴 **FY2025**·매출 281,724M·총자산 619,003M | SEC=야후(완전 일치), **손계산만 구연도** |
| **KO** | FY2025·매출 47,941M·총자산 104,816M | FY2025·매출 47,941M·총자산 104,816M | 🔴 **FY2024**·총자산 100,549M | SEC=야후(완전 일치), **손계산만 구연도** |

**결론**: 야후 `fundamentalsTimeSeries`는 이 시점 세 종목 전부 SEC의 최신 회계연도와 **값까지 완전 일치**했다 — 7렌즈 프로덕션 코드의 야후 배선은 정상이다. STEP1059 §6이 관측한 MSFT 1.59%p·KO 0.39%p 편차는 **야후 실배선의 결함이 아니라, 그 STEP의 손계산이 수동으로 가져온 재무제표 수치 자체가 최신 회계연도가 아니었기 때문**이다. ㉠(벤더 재분류)·㉢(direct/computed 갈래) 후보는 §4-1의 grossProfit 대 계산값 138/138 완전 일치 실측으로 사실상 배제된다(두 값이 다를 이유가 없음이 확인됨). 근거: Cowork Supabase MCP 직접 조회(2026-08-18)·`docs/probe_1060_yahoo_sec_fiscal_year.json`.

---

## §7. 질문 귀속(2-9) — 억지로 맞추지 않는다

`lensCopy.ts:59`가 이미 스스로 정의한 질문: **"돈을 잘 버는 회사인가?"**(자산 대비 수익성의 **수준**).

정본 W-2 여섯 질문과 대조 — **어느 것과도 정확히 일치하지 않는다**:
- "재정 상태가 좋아지고 있을까 나빠지고 있을까?"(재무건전성) — 이건 **방향/변화**(Piotroski 자리), GP/A는 **수준**. 다른 질문.
- "사업 자체가 커지고 있을까?"(성장) — `docs/probe_1045_growth_restore.md`·`docs/CHANGELOG.md`(STEP1056 W-2-5)가 **이미 원문 대조로 불일치 확정**(SWS "Past Performance"는 수익성 수준 지표이지 성장률 아님, GP/A≠ROA 캐비어트도 이미 원문에 있음) — 재론하지 않는다.
- 나머지 넷(배수·배당·부도위험·최근변화)과는 개념 자체가 안 겹친다.

**분류 = 새 질문 후보.** 🔴 **결론 내지 않고 재료만 놓는다** — "quality의 일곱 번째 질문 후보"(예: *"이 회사, 자산을 얼마나 효율적으로 굴리나?"*류)가 성립하는지는 W-2-1 원칙(정보 목록이 먼저·질문은 그걸 묶는 것) 그대로, **재료(원전 있음·정의 공개·컷 정합·15/15 결함 생존이 화면 영향 없음)는 갖췄으나 신설 여부는 장은태 판정.**

---

## §8. 🔴 앞선 결함 15건 생존 확인 (2-8)

### ①밸류 6건 — 전부 그대로(코드 무접촉 확인, STEP1057과 동일 결과 재확인)
`nameEn`/`peVal`-only 판정·야후 `trailingPE` 우선·TTM+연간 혼재 컷·적자 통째 제외·섹터내컷 미적용·B/M 미계산 — **6/6 그대로**(`grep` 재확인, §2·§5 코드 라인 불변).

### ②모멘텀 5건 — 전부 그대로
`avg([r1,r3])` 이중계산·±5% 하드코딩·`adjUsed` 미표기(app/components/messages **0건 재확인**)·"FF 관행" 부분 오귀속 문구·US 컷 정지(⑤는 아래 참조 — **상태 변화**) — **5/5 그대로**.

### ③저변동 4건(신규①~④)
| # | 결함 | 상태 |
|:--:|---|:--:|
| 신규① 배당조정 미적용 | 🔴 **그대로** — `lib/lowvol.ts`·`lenses.ts:284` `d.closes`(raw) 불변, 결정·공개 없음 |
| 신규② `lens_scores` 스테일 극단치(QH) | 🟡 **상태 변경(해소)** — QH는 `lens_scores`에서 **행 자체가 사라짐**(08-17 정상 프루닝 추정). 오늘 전 999행 `updated_at` 균일 — 스테일 행 재현 안 됨. 단 구조적 위험(취득 실패 시 스테일 행이 다시 섞일 수 있음)은 그대로 |
| 신규③ 08-16 US 취득 실패 | ✅ **복구 확정(재조사 없이 인용)** — `docs/probe_1017_cron_failure_causes.md`§4(STEP1058)·`LENS_AUDIT_04_QUALITY.md`(이 문서) §1-2 인용: 08-17 밤 크론에서 freshCoverage 0.986·cutGateOk true로 자연 복구. 구조적 결함(`us_market_cap` 단일-`as_of` 조인)은 미해결이나 이 STEP 범위 밖 |
| 신규④ `volState()` 데드코드 | 🔴 **그대로** — `lib/lowvol.ts:24` 여전히 export+테스트만 되고 라이브 호출 0건(재확인) |

🔑 **15건 중 코드가 실제로 바뀐 것은 0건이다.** 유일한 두 "변화"(신규②·③)는 코드 수정이 아니라 **데이터 상태가 자연 갱신된 것**이다.

---

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- ~~§4 — 야후 `grossProfit`(벤더) vs `totalRevenue−costOfRevenue`(계산) **전수 대조**: 저장되는 캐시가 없고, 이 STEP이 재무 데이터 재취득을 금지해 **구조적으로 불가능**.~~ → 🔴 **STEP1060이 좁혀 실행**: `grossProfit`/`costOfRevenue` 자체(야후 원시값 미저장)는 여전히 못 함이지만, `revenue`·`total_assets`는 SEC(`us_fundamentals`)로 175종목 대조 완료(§4-1). 야후 내부 `grossProfit` vs 계산값은 138/138 완전 일치.
- MA·V·MCO·MSCI 등 47종목의 **실제 SIC 코드**(GICS "Financials" 라벨과 원전의 SIC=6 기준이 정확히 겹치는지) — 새로 조회하지 않았다. **STEP1060 범위 밖(별건).**
- ~~MSFT·KO 손계산 편차(1.59%p·0.39%p)의 **정확한 원인**(벤더 재분류/연도시차/direct·computed 갈래 중 어느 것인지).~~ → 🔴 **STEP1060이 확정**(§6 정정): 원인 = 손계산이 구연도 수동수치를 씀. 야후 실배선은 SEC와 완전 일치.
- STEP1060 자체가 못 한 것: 175종목 표본에서 「연도 라벨 불일치·값도 다른」5건(AGNC·AMH·LCNB·FLG·FRD)이 **왜 `us_fundamentals`(SEC 파이프라인)에서 옛 연도에 멈췄는지**의 근본 원인 — 이 STEP은 7렌즈(야후) 입력을 감사하는 것이지 revdcf/SEC 파이프라인 버그를 진단하는 것이 아니라 범위 밖으로 남겼다.

**철회·정정한 것**
- 🔴 **STEP1060(2026-08-18)** — §4 "구조적으로 불가능"을 "grossProfit·costOfRevenue 두 필드만 불가능, revenue·total_assets는 대조 가능"으로 좁힘. §6 "원인 미확정"을 "원인=손계산 구연도 사용, 야후 배선 정상"으로 확정. 근거·좌표는 §4-1·§6 정정 문단.
- `LENS_AUDIT_03_LOWVOL.md`·`docs/probe_1017_cron_failure_causes.md`의 직전 인용은 원문 재확인 결과 **전부 정확했다**(정정 불필요, STEP1059 시점 기준 유지).

**미측정으로 남은 것**
- 47종목(금융사 non-na)의 SIC 코드 기반 재분류 여부.
- `decomposition.source`("direct"/"computed") 값 자체의 전 종목 분포(direct가 몇 %, computed가 몇 %인지) — 저장 안 됨.
- ~~손계산 3종목 중 2건의 편차 원인.~~ → STEP1060이 확정(위 참조).
- Ball, Gerakos, Linnainmaa, Nikolaev(2015/2016) 계열의 "영업이익성 기준이 더 낫다"는 후속 비판 논문 자체는 원문 미확보(`lensCopy.ts` note가 이미 요약 인용 중이라 이 STEP에서 별도 확보 안 함 — 판정 필요시 별건).
- 🔴 **STEP1060이 남긴 것**: `us_fundamentals`(SEC)에서 AGNC(FY2019)·AMH(FY2020)·LCNB(FY2013)·FLG(FY2022) 등 REIT·소형 금융주가 왜 옛 연도에 멈춰 있는지(revdcf 파이프라인 쪽 원인) — 미조사. F-score/asset-growth/quality-fallback 4개 렌즈에 대한 §2-5 코드 경로별 전파 분석(자산성장의 `nonConsecutive()` 가드가 실제로 무엇을 막는지 포함)은 `docs/LENS_DEV_PLAYBOOK.md` 문제해결 로그(STEP1060 행)에 별도 기록.

🔴 **판정은 장은태가 한다. 이 문서는 결함을 놓는 것까지다.**
