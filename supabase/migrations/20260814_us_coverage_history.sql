-- STEP 1025 — 커버리지 이력 테이블(새 게이트 산식의 "전일 대비 낙폭" 판정 재료).
-- 🔴 이 STEP은 적재만 한다 — 실제 게이트 판정(cutGateOk)은 이 테이블 값을 아직 쓰지 않는다(관측 필드로만 옆에 기록).
-- as_of별로 쌓는다(누적 이력 — us_market_cap처럼 symbol 단일 PK로 덮어쓰지 않는다). market 컬럼으로 US/KR 구분.
create table if not exists public.us_coverage_history (
  as_of          date not null,
  market         text not null,
  fresh_coverage numeric,
  comp_ratio     numeric,
  total          int,
  fresh_count    int,
  updated_at     timestamptz not null default now(),
  primary key (as_of, market)
);
create index if not exists idx_us_coverage_history_market_asof on public.us_coverage_history (market, as_of desc);

alter table public.us_coverage_history enable row level security;
revoke all on public.us_coverage_history from anon, authenticated;
