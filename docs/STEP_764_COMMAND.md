# STEP 764 — 렌즈 상태 변화 파이프 (lens_state_changes · "오늘" 홈의 원료)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `1e35abd`(STEP 763d) · 트리 클린

**배경(07-19 전략 확정 · CHANGELOG (4))**: 새 홈 "오늘"의 원료 = **어제→오늘 렌즈 상태 변화**. `lens_scores`는 매일 덮어쓰기라 히스토리가 없음 → 선계산 크론이 upsert 직전에 기존 행과 diff를 떠서 변화만 기록한다. **결정론·LLM 무사용.**

---

## 수정 1 — 테이블 (Cowork이 MCP로 선적용 예정 · Claude Code는 마이그 파일만 아카이브)

`supabase/migrations/042_lens_state_changes.sql`:
```sql
create table if not exists lens_state_changes (
  id bigint generated always as identity primary key,
  change_date date not null,
  market text not null,             -- 'KR' | 'US'
  symbol text not null,
  name text,                        -- 표시용(스냅샷 시점)
  lens_key text not null,           -- 렌즈 식별자(momentum 등 · lenses.ts stable key)
  from_state text,
  to_state text not null,
  from_tone text,                   -- pos|warn|flat (lensTones 매핑)
  to_tone text not null,
  trade_amount numeric,             -- 정렬용(당일 거래대금·스냅샷 join 시점 값)
  created_at timestamptz default now()
);
create unique index if not exists lens_state_changes_uniq on lens_state_changes(change_date, market, symbol, lens_key);
create index if not exists lens_state_changes_date_market on lens_state_changes(change_date, market);
alter table lens_state_changes enable row level security;
-- 읽기는 서버(service-role)만 — anon 정책 없음(기존 스냅샷 테이블과 동일 방침)
```

## 수정 2 — `lib/lensPrecompute.ts` (diff 기록)

- `computeLensScoresFor(universe, market)` 흐름에서 **upsert 전에** 기존 `lens_scores`(해당 market·심볼들)를 배치 조회(`.in()` 1,000 청크 — SYSTEM_MAP §10) → 렌즈별 state 비교 → **tone이 바뀐 것만**(`from_tone !== to_tone`) `lens_state_changes`에 upsert(onConflict: 위 uniq — 크론 재실행 멱등).
- `change_date` = 실행일(UTC 기준 date — KR/US 모두 "그 크론 실행일"로 통일·표시는 읽기 쪽에서 로케일 처리).
- `trade_amount`·`name`은 계산 시 이미 손에 있는 값 사용(추가 조회 최소화).
- 첫 실행 = 기존 행이 어제 값이므로 자연히 diff 발생. 기존 행 없는 신규 심볼은 변화 기록 안 함(from 없음 = 변화 아님).
- 실패해도 선계산 저장을 막지 않게 try/catch 비차단(+Sentry 캡처).

## 수정 3 — 신규 `app/api/today/changes/route.ts`

- GET · 파라미터: `market`(KR|US) · `date`(기본 = 해당 market의 최신 change_date) · `limit`(기본 20) · `watchlist`(true면 로그인 사용자의 관심 심볼만).
- 응답: `{ date, items: [{symbol, name, lensKey, fromState, toState, fromTone, toTone, tradeAmount}] }` — `trade_amount` 내림차순. 관심 필터는 서버에서 세션 확인 후 `watchlist` 조인.
- **최신 date 폴백**: 요청일에 행이 없으면(주말·휴장) 가장 최근 change_date 반환 — 응답에 그 날짜 명시(화면이 "금요일 기준" 표기 가능).
- 캐시: 인메모리 5분(무거운 계산 아님·과설계 금지).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. push·배포 후 **KR 크론 수동 실행**(`kr-lens-scores` · CRON_SECRET) → `lens_state_changes`에 KR 행 생성 확인(Cowork이 MCP로 건수·샘플 검증). US는 다음 새벽 크론이 자연 생성(또는 `lens-scores` 수동).
3. `/api/today/changes?market=KR&limit=5` 라이브 200 + 정렬·필드 확인. `watchlist=true`는 로그인 쿠키 필요 — 코드 리뷰로 확인하고 화면 단계(765)에서 실검증.
4. 커밋:
   ```bash
   git add lib/lensPrecompute.ts app/api/today/ supabase/migrations/042_lens_state_changes.sql docs/STEP_764_COMMAND.md
   git commit -m "STEP 764: lens state change pipeline (daily diff table + today/changes API) for morning-digest home"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/build · 수동 크론 후 변화 행 수·샘플 JSON · 커밋 해시.
