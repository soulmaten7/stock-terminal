-- STEP 940 — 나스닥 스크리너 + SPDR 섹터 ETF holdings 원본 → Postgres. Q0 「2-of-2 합의제」 3순위(nasdaq)·0순위(spdr) 재료.
-- RLS 패턴 = 20260801_damodaran_reference_data.sql과 동일(읽기는 service-role만).
-- 원본 = data/sources/nasdaq/·data/sources/spdr/ (939 보존). 좌표 = lib/revdcf/registry.ts · data/sources/README.md.

-- ── 1. 나스닥 스크리너 (미국 상장 전 종목) ──────────────────────────────────
-- 🔴 as_of = 취득일(나스닥 응답에 기준일 없음, 939 실측 data.asOf=null)
create table if not exists public.us_sector_nasdaq (
  as_of      date not null,
  symbol     text not null,
  sector     text,
  industry   text,
  country    text,
  ipo_year   text,
  market_cap numeric,
  unique (as_of, symbol)
);
create index if not exists idx_us_sector_nasdaq_symbol on public.us_sector_nasdaq (as_of, symbol);

-- ── 2. SPDR 섹터 ETF holdings (S&P 500 진짜 GICS 정답지) ────────────────────
-- 🔴 as_of = SPDR xlsx의 "As of" 값(취득일 아님, 939 §④)
create table if not exists public.us_sector_gics (
  as_of  date not null,
  symbol text not null,
  sector text not null,
  etf    text not null,
  unique (as_of, symbol)
);
create index if not exists idx_us_sector_gics_symbol on public.us_sector_gics (as_of, symbol);

-- ── RLS: enable + anon/authenticated REVOKE (읽기는 service-role만) ───────────
alter table public.us_sector_nasdaq enable row level security;
alter table public.us_sector_gics   enable row level security;

revoke all on public.us_sector_nasdaq from anon, authenticated;
revoke all on public.us_sector_gics   from anon, authenticated;
