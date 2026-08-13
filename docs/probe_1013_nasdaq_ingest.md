<!-- STEP 1013 — 나스닥 시총 매일 갱신 배선. 폴백 배선·게이트 변경은 이 STEP에서 하지 않는다. -->
# STEP 1013 — 나스닥 시총 재수집을 매일 갱신으로 배선

> 장은태 판정(2026-08-13): **"재수집 배선 먼저."** 이 STEP은 나스닥 스크리너 `marketCap`을 매일 새 `as_of`로 쌓는 파이프라인만 만든다. `us_market_cap`(야후)·`capOf`·`freshSet`·게이트 어디에도 안 섞는다.

## 배선 위치와 이유

**채택: `us-perf`(22:00 UTC)에 `computeUsPerf()` 이후 추가.**

Vercel Hobby 크론 9개가 이미 상한(`us-perf`·`kr-perf`·`kr-etp`·`kr-lens-scores`·`lens-scores`·`health`·`daily-brief`·`email-brief`·`revdcf`) — **새 크론을 만들 수 없다.**

| 후보 | 판정 | 이유 |
|---|---|---|
| `lens-scores`(21:30) | 🔴 금지 | 게이트·컷 로직과 같은 실행 안에 들어간다. 사고 시 컷을 오염시킨다. |
| `revdcf`(22:45) | 🔴 금지 | `finally` 블록이 이미 잘리고 있다(`us_sector_relative` 3일째 0행, STEP1007~1011에서도 원인 미규명). 여기에 일을 더하면 안 된다. |
| `us-perf`(22:00) | ✅ 채택 | 라우트가 `computeUsPerf()` 한 줄뿐이라 얇고, 가격 취득과 성격이 같다(둘 다 야후 계열 시세 파이프라인). |

## 🔴 D-1 지연 (반드시 기억할 것)

`lens-scores`는 **21:30 UTC**, `us-perf`는 **22:00 UTC** — `us-perf`가 그날 `lens-scores`보다 **뒤에** 돈다. 즉 나스닥 값을 나중에 폴백으로 쓰더라도, **그날 `lens-scores` 실행 시점 기준으로는 항상 하루 전(D-1) 나스닥 값**이다. 🔴 나중에 "왜 하루 늦지?"로 다시 조사하지 않도록 여기 명시해 둔다.

## 구현

- **`supabase/migrations/20260813_us_market_cap_nasdaq.sql`** — `us_market_cap_nasdaq(as_of, symbol, market_cap, updated_at)`, PK `(as_of, symbol)`. `us_market_cap`과 완전 별도 테이블(808 부분컬럼 NULL덮기 회피). `us_sector_nasdaq`은 손대지 않음. 라이브 적용 완료(MCP `apply_migration`), 적용 직후 `count(*)=0` 확인(빈 테이블, 데이터는 첫 크론 실행에서 채워짐).
- **`lib/nasdaqMarketCap.ts`** — `fetchNasdaqMarketCap()`. 좌표는 `lib/revdcf/registry.ts:91-100`(STEP939/940이 이미 확정한 것) 그대로 재사용 — 새 엔드포인트 발명 안 함. `https://api.nasdaq.com/api/screener/stocks?tableonly=false&limit=25000&download=true`를 **라이브로** 호출(무키), User-Agent 명시, 타임아웃 20초. 응답 `data.rows`가 배열이 아니면 예외(형식 변경을 조용히 넘기지 않음, 833 원칙). `totalRows`(원본 행수)·`savedRows`(심볼 있는 적재대상)·`emptyCap`(marketCap 없거나 파싱불가)을 각각 센다. `data/sources/nasdaq/*.json` 스냅샷 파일은 읽지도 쓰지도 않는다 — 완전히 별도 경로.
- **`app/api/cron/us-perf/route.ts`** — `computeUsPerf()` 완료 **후**에 나스닥 취득 호출. 🔴 **try/catch 완전 격리**: 나스닥 취득·적재가 실패해도 `nasdaqError`에만 기록되고 라우트의 원래 응답(`r`)·상태코드는 그대로다. 실패 사유를 `rate_limited_or_timeout`/`http_or_format_error`/`other_error` 3종으로 분류(936 원칙, 빈 catch 금지). `us_market_cap_nasdaq` upsert는 `onConflict: "as_of,symbol"`로 하루 안 재실행에도 안전.
- **heartbeat** — `us-perf`에 heartbeat가 없었다(신설). `recordHeartbeat(sb, "us-perf", true, {...})` — `perfMs`·`nasdaqMs`·`routeMs`·`nasdaqRows`·`nasdaqSaved`·`nasdaqEmptyCap`·`nasdaqError`·`budgetLeftMs`(=300,000 − routeMs) 9개 필드. `ok=true` 고정(나스닥 실패가 `us-perf` 헬스를 오염시키지 않도록 — `nasdaqError` 필드가 별도로 진단 신호를 담는다, 완전 격리 원칙의 heartbeat 버전). `recordHeartbeat` 자체는 내부 try/catch로 격리돼 계측 실패가 크론을 안 죽인다(917 §2, 기존 함수 재사용·무변경).

## §5 값 불변 증명 (배포 전 스냅샷)

배포 **전** 라이브 실측(코드 변경이 아직 반영 안 된 상태 — 마이그레이션은 스키마만, 신규 빈 테이블이라 값 영향 없음):

| 항목 | 값 |
|---|---|
| `us_market_cap` 행수 | 5,911 |
| `us_market_cap` 최신 `as_of` | 2026-08-12 |
| `us_market_cap` `as_of='2026-07-30'` 건수 | 296 |
| `us_sector_nasdaq` 행수 | 7,127 |
| `us_sector_nasdaq` `as_of` | 2026-08-08(단일) |
| `us_stock_perf` 행수 | 6,383 |
| `lens_scores` US | 1,035 |
| `lens_scores` KR | 978 |
| `lens_cuts` US 행수 | 5 |
| `lens_cuts` US `as_of` | 2026-07-30 |
| `revdcf_results`(최신 `as_of`=2026-08-12) 604건 md5 | `471fae4393a033a635061090da94bf6c` |
| `us_market_cap_nasdaq`(신규) 행수 | 0(마이그레이션 직후, 예상대로) |

🔴 배포 후 즉시(다음 정규 크론이 돌기 전) 이 표를 다시 재보고 **하나라도 달라지면 배선이 격리되지 않은 것**이다 — 아래 "배포 후 재확인"에 결과를 남긴다.

## 첫 실행 확인 목록 (다음 `us-perf` 크론 = 22:00 UTC 이후, 🔴 크론을 부르지 않는다)

이 STEP 작업 시각(2026-08-13 13:xx UTC)은 22:00 UTC보다 이르다 — **미도래.** 다음 확인은 다음 세션 이후로 남긴다:
- `us_market_cap_nasdaq` 행수·`as_of`(오늘 날짜로 새 행이 쌓였는가)
- `cron_heartbeats.job='us-perf'`의 `nasdaqRows`·`nasdaqSaved`·`nasdaqEmptyCap`·`nasdaqError`·`budgetLeftMs`
- 🔴 `us_stock_perf` 행수·`updated_at`이 평소와 같은가(나스닥 배선이 본체를 밀어내지 않았는지)
- ⓪-4 네 갈래 중 어느 것인지(아래 그대로 인용, 판정은 며칠 쌓인 뒤):

| 관측(첫 실행 후 며칠) | 결론 | 다음 축 |
|---|---|---|
| 매일 208건 근처를 안정적으로 덮는다 | 08-08 커버리지가 재현된다 — 폴백 후보로 유효 | 계열 혼합 비용 판정 |
| 날마다 커버 건수가 크게 흔들린다 | 08-08 208건은 단일 스냅샷의 우연이었다 — 1012 결론이 흔들린다 | 나스닥도 불안정 소스 — 후보 재검토 |
| 라이브 API가 로컬과 다른 응답을 준다 | 나스닥에도 환경 차이가 있다 | 야후와 같은 축의 문제 |
| 라이브 API가 프로덕션에서 실패한다 | 야후 결측과 같은 환경 문제 — **매우 큰 정보** | 소스 문제가 아니라 Vercel egress 문제 |

🔴 **네 번째가 관측되면 즉시 크게 보고한다.**

## `revdcf` heartbeat (1007 W1)

이 STEP 작업 시각은 `revdcf` 크론 예정 시각(22:45 UTC)보다 이르다. `cron_heartbeats` 읽기 전용 확인(크론 미호출) — 여전히 4행(`email-brief`·`jp-disclosures`·`kr-lens-scores`·`lens-scores`)뿐, `revdcf` 없음. **다음 정규 크론(22:45 UTC) 이후 확인**으로 남긴다.

## 카탈로그 반영

`docs/DATA_SOURCE_CATALOG.md`·`docs/data_source_catalog.xlsx` §3-3 후보1 서술에 "매일 갱신 배선됨(1013, `us_market_cap_nasdaq`, `us-perf` 22:00 UTC 부속, D-1 지연)" 추가. 두 파일 동시 갱신.

## 못 한 것 / 철회·정정한 것 / 미측정으로 남은 것

**못 한 것**
- 첫 실행 확인(§4) — 22:00 UTC 크론이 아직 안 지나 미도래. 크론 수동 호출 금지 원칙대로 기다린다.
- `revdcf` heartbeat 실측값 — 22:45 UTC 미도래.
- 배포 후 재확인(§5 후반) — 배포 직후 즉시 재실측 예정이나 이 문서 작성 시점엔 아직 배포 전.

**철회·정정한 것**
- 없음.

**미측정으로 남은 것**
- ⓪-4 네 갈래 중 어느 것으로 판정될지 — 며칠 쌓인 뒤에만 판단 가능.
- 나스닥 라이브 API가 실제로 로컬 실측(1012)과 같은 응답을 주는지 — 첫 실행 이후 확인.
- 폴백 배선·게이트 변경 — 이 STEP 범위 밖, 장은태 판정 이후.
