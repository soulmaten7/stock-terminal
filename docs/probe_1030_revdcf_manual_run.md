<!-- STEP 1030 — revdcf를 지금 1회 실행해 stage를 확정한다 (🔴 DB 쓰기 발생 · 장은태 승인 완료) -->
# probe_1030 — `revdcf` 프로덕션 수동 1회 실행 관측

## ⓪-4 판정 (표에 없는 조합 — 맨 위에 명시)

**`stage = "valuation_done"`.** 그러나 이는 명령서 ⓪-4가 전제한 "stage=X → X까지만 진행됐다"는 이분법에 들어맞지 않는다. **DB 직접 대조 결과, 다음 단계(`computeAndSaveSectorRelative()`)의 실제 작업 — `us_sector_wide` 증분 확인 + `us_sector_relative` 4,000행 upsert — 은 전부 완료됐다.** 죽은 지점은 그 작업 자체가 아니라, 작업 완료를 기록하는 **다음 heartbeat 호출**(`stageHeartbeat("sector_relative_done", ...)`, `route.ts:409`) 한 번이었다. 표에 없는 조합이므로 여기 그대로 보고한다 — 강제로 기존 칸에 끼워 넣지 않았다.

---

## §1-1 전(前) 스냅샷 (실행 전, Supabase MCP)

```sql
select
  (select max(as_of) from revdcf_results) as revdcf_max_asof,
  (select count(*) from revdcf_results where as_of=(select max(as_of) from revdcf_results)) as revdcf_rows,
  (select max(as_of) from us_valuation) as valuation_max_asof,
  (select count(*) from us_valuation where as_of=(select max(as_of) from us_valuation)) as valuation_rows,
  (select max(as_of) from us_sector_relative) as sector_relative_max_asof,
  (select count(*) from us_sector_relative where as_of=(select max(as_of) from us_sector_relative)) as sector_relative_rows,
  (select count(*) filter (where sector is null) from us_sector_relative where as_of=(select max(as_of) from us_sector_relative)) as sector_relative_null_sector,
  (select max(as_of) from us_sector_wide) as sector_wide_max_asof,
  (select count(*) from us_sector_wide where as_of=(select max(as_of) from us_sector_wide)) as sector_wide_rows,
  (select count(*) from us_fundamentals) as fundamentals_rows,
  (select count(*) from cron_heartbeats where job='revdcf') as revdcf_heartbeat_rows;
```

| 테이블 | as_of | 행수 | 비고 |
|---|---|---|---|
| `revdcf_results` | 2026-08-13 | 604 | md5(symbol\|verdict\|gap_years\|wacc) = `eed86c91e70827ed482fa45e5f2ad967` |
| `us_valuation` | 2026-08-13 | 5,820 | |
| `us_sector_relative` | 2026-08-10 | 1,247 | `sector IS NULL` = 1,247 (100%) — 6일째 정지 |
| `us_sector_wide` | 2026-08-08 | 5,820 | |
| `us_fundamentals` | (전체) | 5,820 | |
| `cron_heartbeats(job='revdcf')` | — | **0** | 892 배선 이후 한 번도 행이 생긴 적 없음 |

실행 시각 확인: `2026-08-14T10:36:45Z` — 크론 윈도우(22:45 UTC)와 충분히 떨어짐.

## §1-2 수동 호출 — 클라이언트 관측(실패)

`scripts/probe_1030_revdcf_manual_run.ts`(CRON_SECRET VALUE 무출력, `secretLength`만 로그) 실행:

```
{"url":"https://onetrillion.app/api/cron/revdcf","secretLength":32,"startedAt":"2026-08-14T10:37:19.835Z"}
{"error":"TypeError: fetch failed","elapsedMs":301299}
```

HTTP 상태 코드 없음(응답을 못 받음). `elapsedMs=301,299`는 `maxDuration=300s`를 1.3초 넘긴 시점 — Vercel 플랫폼이 함수를 강제 종료하며 TCP 연결을 끊었다는 해석과 부합하나, 플랫폼 내부 로그 접근 채널이 없어(`docs/KNOWN_ANSWERS.md` Q1) **직접 증명은 불가**로 남긴다.

명령서 지시대로 **즉시 재시도하지 않고**, 먼저 DB를 조회해 서버 측 실제 진행 상태를 확인했다(아래 §1-3~§1-4).

## §1-3 heartbeat 관측 — `revdcf` 첫 행

```sql
select job, last_run_at, ok, note from cron_heartbeats where job='revdcf';
```

```json
{
  "job": "revdcf",
  "last_run_at": "2026-08-14 10:42:08.675+00",
  "ok": false,
  "note": {
    "stage": "valuation_done",
    "elapsedMsAtStage": 286187,
    "maxDurationRemainingMs": 13813,
    "heartbeatCallMs": {"loop_done": 682},
    "processed": 1311,
    "finished": false,
    "loopMs": 253850,
    "budgetExhausted": true,
    "valuationSaved": 5820,
    "fundamentalsStalest": "2026-08-10T23:42:17.521+00:00"
  }
}
```

🔴 **없는 필드가 정보다.** `finallyMs`·`finallyTotalMs`·`routeMs`·`sectorRelativeError`(모두 :409 이후 `stage:"complete"` 블록에서만 채워지는 필드, `route.ts:413-425`)는 이 note에 **없다** — 죽기 전에 그 지점까지 못 갔다는 뜻이며, 침묵이 아니라 명시적으로 기록한다.

## §1-4 `us_sector_relative` 08-14 배치 — 실제로는 완료돼 있었다

```sql
select
  count(*) as total,
  count(*) filter (where sector is null) as null_sector,
  count(*) filter (where sector is not null) as has_sector,
  count(per_rel) as per_rel_nonnull,
  min(updated_at) as min_updated_at,
  max(updated_at) as max_updated_at
from us_sector_relative where as_of='2026-08-14';
```

| 지표 | 값 |
|---|---|
| `total` | 4,000 |
| `null_sector` | 788 (19.7%) |
| `has_sector` | **3,212 (80.3%)** — 08-10 배치(100% null)보다 극적으로 개선 |
| `per_rel` non-null | 1,386 |
| `updated_at` 범위 | `10:42:16.136` ~ `10:42:16.149` (13ms, 단일 배치 upsert) |

`valuation_done` heartbeat(`10:42:08.675`)보다 **7.46초 뒤**에 기록됐다 — 즉 `computeAndSaveSectorRelative()`가 그 시점 이후 실행돼 끝까지 완료했다는 직접 증거.

## §1-5 전후 대조 (§1-1 대비)

| 테이블 | 전(08-13/08-10/08-08) | 후(관측) | 판정 |
|---|---|---|---|
| `revdcf_results` | 08-13, 604행 | **08-14, 604행** | 갱신됨(재계산·저장 완료) |
| `us_valuation` | 08-13, 5,820행 | **08-14, 5,820행** | 갱신됨(순증 0 — 기존 유니버스 재저장) |
| `us_sector_relative` | 08-10, 1,247행(100% null) | **08-14, 4,000행(80.3% has_sector)** | 6일 만에 갱신 + 품질 개선(§1-4) |
| `us_sector_wide` | 08-08, 5,820행 | **08-08, 5,820행(불변)** | 신규 편입 없음 → `sectorWideAdded`≈0 추정(heartbeat에 값 자체는 안 남음) |
| `us_fundamentals` | 5,820행 | **5,820행(불변)** | `processed:1311`이 보고됐으나 순증행 0 — 기존 레코드 재조회/미변경으로 해석 |
| `cron_heartbeats(revdcf)` | 0행 | **1행(신규, stage=valuation_done)** | 첫 관측 |

## 코드 대조 — 왜 이 조합이 나오는가 (`app/api/cron/revdcf/route.ts`)

`computeAndSaveSectorRelative()`(:103-184):
1. `us_sector_wide` 증분 append 단계(:121-152) — missing 심볼이 있으면 upsert(:141), 없으면 스킵. 이번 실행은 §1-5에서 확인했듯 `us_sector_wide` 행수 불변 → missing 0건 → upsert 자체가 안 돎(정상 경로, 결함 아님).
2. `us_sector_relative` 배치 조립·upsert(:166-182) — **§1-4에서 확인한 4,000행 기록의 실체.**
3. 함수 정상 반환(:183) — `{ saved, sectorWideAdded, sectorWideError }`.

호출부(:361-427):
- :403 `computeAndSaveSectorRelative()` 호출 → :404-406 반환값 대입 → **:409 `stageHeartbeat("sector_relative_done", ...)`** — 새 DB 왕복 1회.
- 관측된 `cron_heartbeats` 행은 `stage:"valuation_done"`(:398에서 기록)까지만 — :409가 실행되지 못했거나 완료 전에 죽었다.

🔑 **`stage` 필드는 "마지막으로 성공한 단계"의 하한이지 정확한 종료 지점이 아니다.** 이번 관측에서는 비용이 큰 실제 데이터 작업(4,000행 upsert)까지 전부 끝났는데, 그걸 기록하는 진단용 heartbeat 호출 한 번이 못 붙어 `stage`가 한 단계 뒤처져 보였다. `maxDurationRemainingMs:13813`(valuation_done 시점 잔여 13.8초) 중 약 7.5초를 sector_relative 작업에 쓰고, 남은 ~6.3초 안에서 함수 반환 + 변수 대입(:404-406, 사실상 즉시) + heartbeat DB 왕복(:409) 를 마쳐야 했는데 그 마지막 DB 왕복이 300초 하드 컷에 걸린 것으로 추정된다(직접 증명 불가 — Vercel 플랫폼 로그 접근 불가, §1-2 동일 제약).

## 재시도 판단

명령서의 "최대 2회, 실패해도 즉시 재시도 금지, 사유 먼저 기록" 규칙과 STEP1030 자신의 문구("오늘 밤 22:45 UTC 정규 크론이 두 번째 관측")를 근거로 **두 번째 수동 호출은 하지 않았다.** 1회 관측만으로 핵심 질문(`stage`가 어디서 멈추는가, 그 지점이 heartbeat 계측의 한계인지 실제 종료 지점인지)에 이미 명확한 답이 나왔고(위 §), 정규 크론이 이미 예정된 "두 번째 관측"을 겸한다.

---

## 3중 점검

- **못 한 축**: 클라이언트 `fetch failed`가 정확히 Vercel `maxDuration` 강제종료 때문인지는 플랫폼 로그로 직접 확인하지 못했다(추정). `sectorWideAdded`의 실제 숫자값도 heartbeat에 안 남아 `us_sector_wide` 행수 불변으로부터의 **추론**(≈0)이지 직접 관측이 아니다.
- **철회·정정**: 없음(이번 STEP은 새 관측이며 이전 발언을 뒤집지 않음). 단 `docs/KNOWN_ANSWERS.md`의 "revdcf heartbeat 0행"·"us_sector_relative 6일째 정지" 두 항목은 이번 관측으로 **갱신**했다(정정이 아니라 최신화).
- **미측정**: 정규 크론(22:45 UTC)에서 같은 지점 재현 여부. `BUDGET_MS` 상향·게이트 전환·프루닝 분리·D축 조회 버그 수정 — 넷 다 근거만 있고 선택은 장은태 몫.

## 판정 요청 (근거만 첨부, 선택 안 함)

| 항목 | 근거 |
|---|---|
| `BUDGET_MS`(270s) 조정 여부 | `valuation_done` 시점에 이미 286.2s 경과(잔여 13.8s) — sector_relative 작업엔 그 잔여로 충분했으나 heartbeat 호출 하나가 못 붙을 만큼 빠듯했다 |
| 게이트 전환(§10-J STEP1025 "급락 탐지") 실행 여부 | 드라이런 배선만 완료, 실제 전환은 미실행 |
| 프루닝 분리 실행 여부 | STEP1025 `pruneImpact()`가 관측만 하고 실제 삭제는 안 함 — 그대로 |
| D축(업종 대비) `NO_SECTOR` 전량 표시 버그 수정 여부 | `docs/KNOWN_ANSWERS.md` "us_sector_relative가 정지하면…" 항목 — 08-14 갱신으로 완화됐으나 정규 크론에서 매일 재현되는지는 미확인 |
