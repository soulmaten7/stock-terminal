-- STEP 941 — 야후 assetProfile 섹터 → Postgres. Q0 「2-of-2 합의제」가 갈릴 때 깰 3번째 출처(조합 정확도 실측용).
-- RLS 패턴 = 20260808_us_sector_sources.sql(us_sector_nasdaq)과 동일(읽기는 service-role만).
-- 좌표 = lib/revdcf/registry.ts. 🔴 야후 의존 추가 — us_market_cap도 야후 계열이라 이미 구조적으로 있던 의존이 하나 더 늘어난 것.

create table if not exists public.us_sector_yahoo (
  as_of      date not null,  -- 취득일(API 응답에 기준일 없음, nasdaq과 동일 사정)
  symbol     text not null,
  sector_raw text,           -- 야후 원문(예: "Technology") — 11:1 매핑표 밖 값도 원문 그대로 보존
  sector     text,           -- GICS 매핑값(매핑표 밖이면 null)
  industry   text,
  country    text,
  unique (as_of, symbol)
);
create index if not exists idx_us_sector_yahoo_symbol on public.us_sector_yahoo (as_of, symbol);

alter table public.us_sector_yahoo enable row level security;
revoke all on public.us_sector_yahoo from anon, authenticated;
