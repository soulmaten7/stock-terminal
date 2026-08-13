-- STEP 1013 — 나스닥 스크리너 marketCap 매일 적재(us_market_cap과 별도 테이블, 808 부분컬럼 NULL덮기 회피).
-- 🔴 이 STEP은 재수집 배선만 한다 — us_market_cap·capOf·freshSet 어디에도 안 섞는다(1012 §3-3 실측: 겹치는 208건 중
--   13.5~20.2%가 야후값과 20% 초과 차이, $0.3B~$2B 22~31% — 계열 혼합 위험이 아직 안 걷힘).
-- as_of별로 쌓는다(누적 이력 — us_market_cap처럼 symbol 단일 PK로 덮어쓰지 않는다, 며칠치를 모아 ⓪-4 반증조건을 판정하려면 이력이 필요).
create table if not exists public.us_market_cap_nasdaq (
  as_of      date not null,
  symbol     text not null,
  market_cap numeric,
  updated_at timestamptz not null default now(),
  primary key (as_of, symbol)
);
create index if not exists idx_us_market_cap_nasdaq_asof on public.us_market_cap_nasdaq (as_of);

alter table public.us_market_cap_nasdaq enable row level security;
revoke all on public.us_market_cap_nasdaq from anon, authenticated;
