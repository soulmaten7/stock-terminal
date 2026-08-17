# 크론 관측 인프라 설계 (STEP 983, 미해결 16번)

> 🔴 설계·조사 전용 문서. 코드·마이그레이션·DB 쓰기 0. 구현은 다음 STEP. 판정은 장은태.
> 원자료 = `docs/probe_983_observability.json` · `docs/probe_983_search.md`

## 배경

STEP982가 `lens_cuts` 정지를 `cutGateOk` 게이트(freshCoverage 93.04%<97%)로 특정했고, 그 원인은 `us_market_cap` 결측(미해결 14번)이다. 14번은 `LOCAL_OK_PROD_FAIL` — 로컬은 성공하고 프로덕션만 실패한다(949). 원인 규명은 프로덕션 내부를 봐야 하는데, 지금 볼 수단이 부실하다.

## 1-3. 🔴 이미 되고 있는 것 (맨 앞)

STEP982가 08-09 실행의 `freshCoverage=93.04%`를 어떻게 읽어냈는지부터 밝힌다 — **이미 있는 것을 다시 만들면 낭비다.**

`computeLensScores()`가 매 실행 끝에 `recordHeartbeat(sb, 'lens-scores', r.ok, {...diag 필드 20여개...})`를 호출해 `cron_heartbeats.note` 컬럼에 JSON을 통째로 넣는다. 이 필드들(`freshCoverage`·`noCapField`·`retryAllLen`·`coverageOk`·`cutGateOk` 등)은 **STEP917에서 이미 "계측 전용"으로 추가돼 있었다** — 그때도 "Vercel 1시간 로그를 못 읽어서 옮긴다"는 정확히 지금과 같은 문제를 겪고 고쳤다. 982는 이 note JSON을 `SELECT` 한 번으로 읽었을 뿐, **아무것도 새로 만들지 않았다.**

🔴 **917이 "어디에 남길지"는 풀었지만 "몇 건 남길지(이력 vs 스냅샷)"는 안 풀었다.** `cron_heartbeats`의 PK가 `job` 하나뿐이라 업서트할 때마다 이전 값이 사라진다 — 08-09 실행의 diag는 봤지만, 982가 필요로 했던 07-31~08-08 각각의 diag는 이미 덮어써져 없다. **이번 STEP이 채워야 할 구멍은 정확히 여기 하나다: 스냅샷을 이력으로 바꾸는 것.**

## 1. 지금 관측 가능한 것 전수

### 1-1. `cron_heartbeats` 스키마

| 컬럼 | 타입 |
|---|---|
| `job` | text, **PRIMARY KEY** |
| `last_run_at` | timestamptz |
| `ok` | boolean |
| `note` | text(JSON.stringify 자유형식) |

현재 4행(`kr-lens-scores`·`email-brief`·`lens-scores`·`jp-disclosures`[파킹 크론의 잔존 레코드]). **이력이 없다 — job당 최신 1건.** "보존 기간"이라는 개념 자체가 이 테이블엔 없다(스냅샷 테이블로 설계됨).

### 1-2. 크론 9개 매트릭스

| 크론 | 스케줄 | heartbeat 씀? | health가 보는가 |
|---|---|:--:|---|
| us-perf | 22:00 | ✗ | 간접(us_stock_perf 나이·신선행수) |
| kr-perf | 10:00 | ✗ | 간접(kr_stock_snapshot) |
| kr-etp | 10:15 | ✗ | 간접(kr_etp_snapshot) |
| kr-lens-scores | 10:30 | ✅(성공여부 그대로) | 직접+간접 |
| lens-scores(US) | 21:30 | ✅(성공여부 그대로) | 간접(lens_scores 나이·행수, lens_cuts 나이 49h) |
| health | 12:00 | ✗ | 🔴 **없음 — 자기 자신을 감시하는 주체가 없다** |
| daily-brief | 22:30 | ✗ | 간접(daily_brief 나이) |
| email-brief | 23:00 | ✅(🔴 단, "성공"이 아니라 "실행됨"만 — 작업 시작 **전**에 무조건 `ok:true` 기록. 코드 주석이 명시적 설계) | 직접(cron_heartbeats 나이) |
| **revdcf** | 22:45 | ✗ | 🔴 **없음 — health의 CHECKS 배열에 revdcf_results·us_valuation·us_sector_relative 어느 것도 없다.** `REVDCF_ENABLED=false`는 화면 노출만 막지 계산 자체는 매일 돈다(route.ts에 그 플래그 참조 자체가 없음, 코드로 확인) — **매일 도는데 관측이 0인 크론.** |

🔑 **요약**: 9개 중 3개만 heartbeat를 쓰고, 그중 하나(email-brief)는 의미가 다르다(실행됨 vs 성공함). 완전히 관측이 0인 것 = `health`(자기 자신) · `revdcf`.

## 2. 미해결 14번 규명에 필요한 최소 관측 항목

🔴 **대상을 좁힌다**: 14번의 진짜 미스터리는 949의 **D그룹(383건 — 로컬 성공·프로드 실패)**이지, B그룹(82건 — 로컬에서도 marketCap 자체가 안 옴, 우선주·ETN류로 추정되는 별개 현상)이 아니다.

| 항목 | 검증하는 가설 |
|---|---|
| HTTP 상태코드 분포(429/5xx/타임아웃) | 레이트리밋 vs 서버오류 vs 무응답 — 지금은 배치 1단계에서 구분 없이 뭉뚱그려짐 |
| 요청/성공/실패 수(심볼당) | 실패가 무작위인지 특정 종목군 고정인지 — 949의 "항상 같은 380여개"를 정밀화 |
| 응답 본문 일부(에러 앞 200자) | 야후가 차단 메시지를 주는지, 빈 응답인지, 오염 데이터를 주는지 |
| 소요시간(개별 요청) | 타임아웃 임박(예산 소진)인지, 즉시 실패인지 |
| 재시도 횟수·최종결과 | 이미 diag에 있음(추가 불필요, 이력으로만 안 쌓임) |
| 실패 종목 전체 목록 | 949의 380목록과 매일 비교 — 지금은 샘플 5건뿐(코드 확인) |
| 프로덕션 아웃바운드 IP | IP차단 가설 검증 — 🔴 **서버리스는 실행마다 IP가 바뀔 수 있어, 매번 다른 IP인데 왜 항상 같은 380종목만 실패하는지 설명이 안 됨(오히려 이 가설을 약화시키는 관찰)** |

**가설 후보(949 미검증 4개 유지 + 신규 1개, 폐기된 2개는 되살리지 않음)**:
- (유지) Vercel IP대역 야후측 차단·레이트리밋 — 단 위 IP고정성 문제로 설득력 약화
- (유지) 실행시간 예산 안에서 배치가 잘림
- (유지) 로컬·프로드 yahoo-finance2 버전/설정 차이
- (유지) 07-30 전후 야후 API 변경
- 🆕 (983 신규, 미검증) 야후 서버측 지역·부하분산 라우팅 차이로 같은 심볼군이 매번 같은 백엔드 샤드로 가고 그 샤드가 문제
- ~~배치방식 자체 문제~~ / ~~심볼 부재~~ — **949가 로컬 실측(A=0·C=0)으로 이미 폐기, 되살리지 않음**

## 3. 저장 설계 (구현하지 않는다)

### 3-1. 테이블 하나로 할지, `cron_heartbeats` 확장할지

| | 장점 | 대가 |
|---|---|---|
| **A. `cron_heartbeats` PK 확장**(`job,run_at`) | 코드 재사용 최대 | 마이그레이션(기존 4행 이관) + `health` 크론의 "최신 1건" 가정 쿼리도 손봐야 함 |
| **B. 신규 이력 테이블**(`cron_run_log` 등) | 기존 코드·쿼리 무변경, 순수 추가 | 쓰기가 2곳(스냅샷+이력)으로 늘어남 |

**보존·정리**: 요약 통계(카운트·비율)는 매일 쌓아도 가볍다(9크론×365일≈3,285행/년). 단 "실패 종목 전체 목록"처럼 무거운 필드는 매일 전부 남기면 용량이 빠르게 는다 — **요약은 길게 보존, 전체 목록은 N일 후 정리**(969·973의 스냅샷-비교-후-정리 패턴 재사용 가능)로 이원화하는 것이 합리적(판정은 아님, 설계 옵션).

### 3-2. 🔴 크론 코드 변경 범위만 (실제로 안 고침)

- `lensPrecompute.ts`의 `recordHeartbeat` 호출부 — 이력 insert로 교체 또는 병행
- `topByMarketCap()` stage1(배치)에 stage2(재시도)와 같은 수준의 HTTP상태/에러사유 분류 추가(`lensPrecompute.ts:112-122`, 지금은 `catch{failedChunks++}`뿐)
- 🔴 **실패 경로에서도 기록이 남게** — 지금은 `computeLensScores` 자체가 상류에서 throw하면 `recordHeartbeat`에 도달 못해 **아무것도 안 남을 수 있다**(982 §1-3의 branch D). `route.ts`의 최상위 catch 또는 `try/finally`에 최소 1줄 기록이 필요.

### 3-3. 격리 원칙(974 재인용, 코드 안 고침)

기록 자체가 실패해도 크론 본체는 계속 돌아야 한다. `email-brief`의 `try{...}catch{/* 하트비트 실패는 비치명 */}`가 이미 이 패턴 — 새 이력 기록도 동일하게 감싸야 한다.

## 4. 선택지와 대가 — 판정 없음

| 옵션 | 비용 | 공수 | 코드 변경 범위 | 되돌릴 수 있나 | 승인 |
|---|---|---|---|---|---|
| **1. Sentry 대시보드 직접 확인**(신규 구축 없음) | $0 | 0(로그인만) | 없음 | 해당없음 | 불필요 |
| **2. cron_heartbeats 이력화**(§3-1 A) | $0 | 중 | lensPrecompute.ts·health/route.ts | 어려움(스키마 변경) | 필요(마이그레이션) |
| **3. 신규 이력 테이블**(§3-1 B) | $0 | 중 | lensPrecompute.ts(+확산 시 8개 각각) | 쉬움(테이블 드롭) | 필요(마이그레이션+코드) |
| **4. Axiom `next-axiom` SDK** | $0(무료 500GB/월) | 중 | 전 크론 route.ts | 쉬움 | 필요(신규 외부서비스) |
| **5. Vercel Log Drains** | 🔴 Pro $20/월~ + $10/5GB | 낮음 | 없음 | 쉬움 | 필요(유료전환 — 최소비용 원칙과 충돌) |
| **6. 실패경로 기록 보강만**(저장구조 불변) | $0 | 낮음 | route.ts catch 블록들 | 쉬움 | 필요(코드) |

## 못 한 것 / 미측정 / 새로 드러난 것 / 판정이 필요한 것

**못 한 것**
- Sentry 대시보드를 직접 열어 `[lens-cut-gate]`·`[topByMarketCap] 청크 실패` 이력을 확인하는 것(Sentry 조회 도구 없음 — 사람이 해야 함).
- Vercel MCP `get_runtime_logs`/`get_runtime_errors`로 실제 조회 **시도**는 했으나 둘 다 `403 Forbidden`(권한 없음, Hobby 플랜 제약으로 추정) — 이 경로가 막혀 있음을 **직접 테스트로 확인**(가정이 아니라 실측).

**미측정**
- Sentry 무료 티어(30일 보존)에 실제로 07-31~08-08 데이터가 남아있는지(있을 가능성이 높다고만 추정, 확인은 사람 몫).
- 옵션 2/3/4의 정확한 구현 시간(공수는 "중"으로만 정성 평가, 시간 단위 추정 안 함).

**새로 드러난 것**
- 🔴 `health` 크론이 **이미 `lens_cuts` 나이를 49시간 임계로 감시하고 있었다**(STEP828 §2-5) — US 컷이 07-30부터 정지라면 이 체크가 11일 내내 stale로 잡혔어야 한다. **왜 대응이 없었는지는 이번 STEP 범위 밖**(Sentry 미확인이라 실제로 알림이 갔는지조차 모름) — 장은태에게 그대로 보고할 사안.
- `email-brief`의 heartbeat 의미론이 다른 2개(`kr-lens-scores`·`lens-scores`)와 다르다("실행됨" vs "성공함") — 지금까지 이 차이가 문서화된 적 없었다.
- `revdcf` 크론이 매일 도는데(계산 자체는 `REVDCF_ENABLED`와 무관) 관측이 완전히 0이라는 것.
- Vercel MCP 로그 조회 도구가 403으로 막혀 있다는 것(가정이 아니라 이번에 실측으로 확인).
- Google SRE북의 "화이트박스/블랙박스" 구분이 우리 현재 상태(health=블랙박스만 존재, 화이트박스는 부분적)를 정확히 설명한다는 것.

**판정이 필요한 것**
- 옵션 1~6 중 무엇을 실행할지(옵션 1은 승인 불필요 — 그냥 확인하면 됨, 다른 옵션들과 병행 가능).
- `health`가 11일간의 lens_cuts stale을 실제로 Sentry에 올렸는지 — 사람이 Sentry에서 먼저 확인해야 다음 판단(대응 프로세스 문제인지 감시 자체의 결함인지)이 갈린다.

---

## 5. STEP992 — 신선도 점검 범위 고정 (2026-08-11, 장은태 판정 반영)

> 🔴 STEP991에서 미해결 62·63번(verify CI 38시간 무대응·Sentry health 11일 무대응)의 처방이 정해졌다: **ⓐ 알림 = 이상 시 즉시 + 주 1회 요약** — Vercel 크론이 아니라 **Cowork 예약 작업** 두 개로 이미 구현됨. **ⓑ 점검 범위 밖 실패는 게이트로 강제** — `docs/COMMIT_GATES.md` 게이트 9. 이 절은 ⓐ의 점검 범위를 문서에 고정한다.
> 🔴 **이 문서가 정본이고 Cowork 예약 프롬프트가 사본이다.** 새 테이블·크론이 생기면 먼저 이 문서를 고치고(게이트 9), 그다음 Cowork이 예약 프롬프트를 이 문서에 맞춰 갱신한다 — 반대 방향(예약 프롬프트를 먼저 고치고 문서가 안 따라가는 것)은 금지.

### 5-1. 예약 두 개

| 예약 | trigger_id | 실행 시각 | 무엇을 하는가 |
|---|---|---|---|
| 매일 신선도 점검 | `trig_01SyGJuDEYUBT9xkm1JUSPa8` | 매일 08:00 KST | 아래 9개 테이블의 신선도를 확인, 이상 없으면 세 줄 요약, 이상 있으면 즉시 알림 |
| 주간 요약 | `trig_018ZvkjCwYWeYtzpC4nPZhr9` | 일요일 08:00 KST | 아래 5-3의 3개 테이블에서 지난 7일간 "빠진 날"(그날 as_of가 없는 날 = 그날 실패)을 찾아 보고 |

### 5-2. 매일 점검 대상 9개 표

🔴 아래 임계값은 **이 문서가 정하는 정본**이다 — 기존에 코드/문서로 확정된 값(`lens_cuts` 49h·`freshCoverage` 97%)은 그대로 가져왔고, 나머지는 각 테이블을 산출하는 크론의 스케줄(§1-2 매트릭스)에 "다음 실행 시각 + 여유"를 더해 도출했다. 🔴 **Cowork 예약 프롬프트가 실제로 이 값을 쓰는지는 대사(정본↔사본 일치) 확인이 안 됐다** — 아래 「판정이 필요한 것」에 등재.

| 테이블 | 산출 크론(스케줄 UTC) | 보는 값 | 임계 | 넘으면 |
|---|---|---|---|---|
| `revdcf_results` | revdcf(22:45) | 최신 `as_of` 나이 | 30h | 경고 |
| `us_valuation` | revdcf(22:45, 같은 실행) | 최신 `as_of` 나이 | 30h | 경고 |
| `us_sector_relative` | revdcf(22:45, `computeAndSaveSectorRelative`) | 최신 `as_of` 나이 **+ 그 날짜의 `sector=null` 비율** | 나이 30h **또는** `null` 비율 50% | 경고 |
| `us_sector_wide` | lens-scores(US)(21:30) 부속 | 최신 `as_of` 나이 | 상한 미도입(27번, 973·974에서 저빈도로 재확인) — 이 점검은 **정보성**만, 코드 게이트와는 별개 | 정보 |
| `us_market_cap` | lens-scores(US)(21:30) | 최신 `as_of` 나이 + `freshCoverage` | 나이 30h / `freshCoverage<97%`(984 게이트 기준 그대로) | 경고 |
| `lens_scores` | lens-scores(US)(21:30) | `updated_at` 나이 | 30h | 경고 |
| `lens_cuts` | lens-scores(US)(21:30) 부속 | 나이 | **49h**(STEP828 기존값, 그대로) | 경고 |
| `us_fundamentals` | 별도 수집 파이프라인(비정기, 970: 순증 ≈124건/일 추정치 미확정) | 순증 건수 정체 여부. 🔴 **STEP1055(2026-08-16)로 컬럼 7개 추가**(`total_assets`·`total_liabilities`·`liabilities_and_equity`·`retained_earnings`·`cash_from_ops`·`dividends_paid`·`dividends_declared_per_share`, 전부 nullable) — 신선도 판정 대상은 여전히 이 표의 `fetched_at`(행 단위) 하나뿐, 새 컬럼별 개별 신선도는 이 절의 점검 범위 밖(값 계산·표시는 후속 STEP) | 관찰만(임계 미설정 — 970 자체가 추정 단계) | 정보 |
| `us_market_cap_nasdaq`(STEP1013 신설) | us-perf(22:00) 부속 | 최신 `as_of` 나이 + 행수(줄면 경고) | 나이 **30h** | 경고 |
| `cron_heartbeats` | 전 크론 공통 | `job`별 `last_run_at` 나이 | 각 크론 스케줄 + 여유(예: lens-scores는 30h) | 경고 |
| `us_coverage_history`(STEP1025 신설) | lens-scores(US 21:30·KR도 같은 테이블에 적재) | 최신 `as_of`(market='US') 나이 | 30h(다른 21:30~22:00대 크론과 같은 여유) | 경고 |

🔴 **`cron_heartbeats.job='revdcf'` 신설(STEP1007, 2026-08-13)** — §1-2가 "관측 완전 0"이라 적었던 바로 그 크론이 이제 heartbeat를 쓴다(스케줄 22:45 UTC, 다른 22시대 크론과 같은 여유로 **30h** 임계). `note`에 `processed`·`finished`·`elapsedMs`·`valuationSaved`·`sectorRelativeSaved`·`sectorWideAdded`·`sectorWideError`·`loopMs`(SEC 워커 루프)·`budgetExhausted`(BUDGET_MS 소진이 루프 종료 사유였는지)·`finallyMs`(1006 P2와 같은 이름의 6구간)·`finallyTotalMs`·`routeMs`·`sectorRelativeError`(예외 시 message+stack 앞 500자)를 싣는다. 계산 로직(`revdcf_results` 산출 경로)은 무변경 — 계측만 추가.

🔴 **`cron_heartbeats.job='revdcf'`에 `stage` 필드 추가(STEP1018, 2026-08-14)** — 1007이 heartbeat를 `finally` 맨 끝(현재의 `stage:"complete"`)에만 둔 설계 오류를 고쳤다: 함수가 Vercel `maxDuration`(300s)으로 강제 종료되면 `finally`조차 안 돌아, **죽는 지점을 재려는 계측이 죽는 지점 뒤에 있는 상태**였다(1017이 heartbeat 완전 부재로 이 문제를 실측). 이제 같은 `job='revdcf'` 행을 stage가 끝날 때마다 upsert로 덮어써 **마지막으로 성공한 stage가 남는다**: `loop_done`(SEC 워커 루프 종료) → `valuation_done`(`computeAndSaveValuation` 반환) → `sector_relative_done`(`computeAndSaveSectorRelative` 반환, 성공 시에만) → `complete`(기존 위치, 최종 성공/실패 판정 포함). **🔴 점검 규칙 — `stage`가 `complete`가 아니면 경고**(그 크론 실행이 어디선가 죽었다는 뜻, `elapsedMsAtStage`·`maxDurationRemainingMs`로 얼마나 남기고 죽었는지 함께 확인). `stage` 필드가 아예 없는 행(과거 형식)은 1018 배포 이전 실행이므로 별도 경고 대상 아님. 계산 로직·upsert 대상·`BUDGET_MS`·`maxDuration` 전부 무변경.

🔴 **`cron_heartbeats.job='us-perf'` + `us_market_cap_nasdaq` 신설(STEP1013, 2026-08-13)** — us-perf(22:00 UTC)에 나스닥 시총 매일 재수집을 배선(1012가 실측한 야후 밖 시총 후보). `us_market_cap_nasdaq`(as_of·symbol 복합키, 이력 누적 — `us_market_cap`처럼 symbol 단일 PK로 덮어쓰지 않는다)에 매일 새 `as_of` 행이 쌓인다 — **30h** 임계(다른 22시대 크론과 같은 여유). `us-perf`는 지금까지 heartbeat가 없던 크론이라 이번이 최초 도입 — `note`에 `perfMs`·`nasdaqMs`·`routeMs`·`nasdaqRows`(원본 응답 행수)·`nasdaqSaved`(적재 행수)·`nasdaqEmptyCap`(marketCap 빈 행수)·`nasdaqError`(사유별)·`budgetLeftMs`를 싣는다. 🔴 **격리 원칙** — 나스닥 취득 실패는 `nasdaqError`에만 기록되고 `us-perf` 본체(`computeUsPerf`) 응답·`us_stock_perf` 갱신에는 영향을 주지 않는다(974 원칙, try/catch 완전 분리). 🔴 **D-1 지연** — us-perf가 22:00 UTC에 도는데 lens-scores(21:30 UTC)가 그 전에 이미 끝나므로, 나스닥 값을 나중에 폴백으로 쓰더라도 항상 그날 lens-scores 실행 기준으로는 하루 전(D-1) 값이다.

🔴 **`us_sector_relative` 행 보완(992 정정, 2026-08-11)** — 나이만으로는 08-10 사고(1,247행 전부 `sector=null`, 973 미배포)를 못 잡는다. 행은 제때 생겼고 **내용만 비어 있었기 때문**이다. 그래서 나이에 `sector=null` 비율 조건을 더했다. 🔴 **이번엔 방향이 반대였다** — 이 값은 **Cowork 예약 프롬프트(사본)에 이미 반영돼 있었고, 이 문서(정본)가 그걸 뒤늦게 따라간 것**이다. 위에서 "정본을 먼저 고치고 사본이 따라간다"고 못박은 순서와 어긋난 사례를 그대로 남긴다 — **앞으로는 이 문서를 먼저 고치는 순서를 지킨다.**

🔴 **`us_coverage_history` 신설 + `cron_heartbeats.job='lens-scores'` 새 관측 필드(STEP1025, 2026-08-14)** — 장은태 판정(게이트를 "급락 탐지"로 재정의)의 드라이런. `us_coverage_history`(as_of·market 복합키, 이력 누적)에 매일 밤 `fresh_coverage`·`comp_ratio`·`total`·`fresh_count`를 US·KR 둘 다 적재(market 컬럼 구분, try/catch 격리 — 적재 실패가 크론을 안 죽인다). `cron_heartbeats.job='lens-scores'`의 `note`에 새 필드 추가: `newCoverageOk`·`newCutGateOk`(관측 전용 — **실제 판정 `cutGateOk`는 그대로**)·`priorCoverage`·`priorSource`(history/heartbeat/none)·`coverageDrop`·`successRate`·`wouldPrune`·`wouldPruneRows`·`wouldPruneSample`·`universeOk`·`pass2Ok`·`pruned`. 🔴 **점검 규칙 — 지금은 `newCutGateOk`가 `cutGateOk`와 달라도 경고하지 않는다**(둘이 갈리는 것 자체가 이 STEP의 관측 대상이지 이상이 아니다). 실제 게이트 전환 여부는 장은태 판정(1025 §0-A). 계산 로직(`capGateDecision`의 기존 4개 필드·`canPrune`·실제 프루닝 실행)은 전부 무변경 — 833 값 잠금 테스트로 증명됨.

🔴 **게이트 실제 전환 + `pruneBlockedByFlag` 신설(STEP1031, 2026-08-14, 장은태 승인)** — 위 1025 드라이런을 실제 판정으로 전환: `coverageOk`(따라서 `cutGateOk`)가 이제 "급락 탐지" 산식(절대 하한 85% + 전일 대비 낙폭 상한 3%p)으로 계산된다 — 고정 97% 임계는 폐기. 🔴 **점검 규칙 갱신 — 이제부터 `cutGateOk ≠ newCutGateOk`는 경고 대상**(같은 산식의 독립 재계산인데 어긋나면 self-check 실패, `[us-cut-gate-mismatch]` Sentry 태그로 코드에서도 별도 캡처). `compositionOk`(메가캡 95%)는 무변경. **프루닝은 이번엔 안 켰다** — `cron_heartbeats.job='lens-scores'`의 `note`에 `pruneBlockedByFlag`(boolean) 신설: **`true`가 정상**(US만 `pruneEnabled:false`로 명시 차단, KR은 무전달로 기존 동작 완전 불변) — `false`가 나오면 차단이 안 걸린 것이므로 즉시 보고 대상. 되돌리는 법 = `lib/lensPrecompute.ts`의 `computeLensScores`(US) 안 `pruneEnabled: false` 한 줄 삭제(다음 실행부터 즉시 복원, 833 4중 게이트는 그대로 살아있어 추가 안전장치 역할). 상세 = `docs/probe_1031_gate_activation.md`.

🔴 **프루닝 활성화 + 삭제 상한 `pruneAborted`·`pruneRowsAttempted` 신설(STEP1032, 2026-08-15, 장은태 승인)** — 08-14 21:30 UTC 실행에서 게이트 전환이 실측으로 성공(`lens_cuts` US 07-30→08-14, 19일 만에 갱신)한 것을 확인한 뒤, US `pruneEnabled`를 다시 `true`로 켰다. `pruneBlockedByFlag`는 이제 **`false`가 정상**(1031 문서와 반대 — 갱신 필요). 대신 **삭제 상한**을 신설: `cron_heartbeats.job='lens-scores'`의 `note`에 `pruneAborted`(boolean)·`pruneRowsAttempted`(number) 추가 — 4중 게이트(STEP833)를 전부 통과해도 지울 행 수(`pruneRowsAttempted`)가 `PRUNE_MAX_ROWS`(기본 100, 근거 = 2일 관측·08-13 63행/08-14 76행)를 넘으면 `pruneAborted:true`로 전량 중단한다(일부만 지우지 않음 — 어느 행을 남길지 고를 근거가 없다). 🔴 **점검 규칙 — `pruneAborted=true`가 나오면 Sentry `[lens-prune-abort]`가 이미 error 레벨로 캡처했을 것이므로 그걸 최우선으로 본다**(상한이 걸렸다는 것은 유니버스가 뭔가 크게 바뀌었다는 신호 — 833의 게이트 실패와 같은 급). 이 상한은 US·KR 공용(순수 함수 `pruneDecision`, `lib/lensPrecompute.ts`) — `pruneEnabled`와 달리 시장을 안 가린다(4중 게이트와 같은 급의 공유 안전장치라는 판단, KR 실측 프루닝 대상은 항상 0행이라 사실상 KR엔 영향 없음). 상세 = `docs/probe_1032_prune_activation.md`.

### 5-3. 주간 요약이 보는 3개 — "빠진 날 찾기"

주간 요약은 위 9개 중 **`as_of`별로 행이 쌓이는(덮어쓰지 않는) 3개**만 본다: `revdcf_results` · `us_valuation` · `us_sector_relative`. 지난 7일의 날짜 각각에 대해 그 날짜의 `as_of` 행이 존재하는지 확인하고, **없으면 그날은 실패한 것으로 간주**한다(덮어쓰는 테이블은 "최신 1건"만 남아 이 논리가 성립하지 않는다 — `lens_scores`·`lens_cuts`·`us_market_cap`·`us_sector_wide`·`cron_heartbeats`는 대상 밖).

### 5-4. 🔴 남는 구멍 — 마지막 고리가 없다

매일 점검이 이상을 잡고, 주간 요약이 매일 점검이 놓친 걸 잡는다. 하지만 **주간 요약 자체가 꺼지거나 실패하면 그것을 잡을 것이 없다.** 매일 점검 → 주간 요약 → **?** 의 사슬에서 마지막 고리가 비어 있다는 사실을 정직하게 남긴다(991 결정 사항, 이번 STEP에서 처방하지 않음).
