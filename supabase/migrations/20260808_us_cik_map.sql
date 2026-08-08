-- STEP 947 §1 — Q1 밸류에이션 재료: 티커→CIK 매핑. 크론이 로컬 파일에 의존하지 않도록(route.ts:14 관행) DB에 올린다.
-- 원본 = data/sources/sec/company_tickers_exchange_20260802.json(적재 = scripts/load_cik_map.ts).
-- RLS 패턴 = us_market_cap(043)·us_sector_*(20260808) 동일(읽기·쓰기 전부 service-role).
create table if not exists public.us_cik_map (
  symbol     text primary key,
  cik        bigint not null,
  exchange   text,
  title      text,
  source     text not null,   -- 예: 'sec:company_tickers_exchange'
  as_of      date not null,   -- 원본 파일 취득일(파일 자체엔 기준일 필드 없음)
  updated_at timestamptz not null default now()
);
create index if not exists idx_us_cik_map_cik on public.us_cik_map (cik);

alter table public.us_cik_map enable row level security;
revoke all on public.us_cik_map from anon, authenticated;
