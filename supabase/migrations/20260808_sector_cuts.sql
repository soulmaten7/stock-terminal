-- STEP 943 — Q0 ④단계: 섹터 내 컷(p30/p70) 저장. lens_cuts(시장 전체 컷)는 읽기만 — 절대 덮어쓰지 않는다.
-- RLS 패턴 = lens_cuts와 동일(읽기·쓰기 전부 service-role).
create table if not exists public.sector_cuts (
  market      text not null,
  sector      text not null,
  metric_key  text not null,   -- lens: momentum·technical·valuation·lowvol·quality·assetgrowth·fscore / revdcf: gap_years
  lo          double precision, -- 섹터 내 하위 30%
  hi          double precision, -- 섹터 내 상위 70%
  n           integer not null, -- 그 섹터에서 값이 있는 종목 수
  method      text not null,    -- 예: 'p30/p70 · sector-scoped · missing-excluded'
  as_of       date not null,
  updated_at  timestamptz not null default now(),
  primary key (market, sector, metric_key, as_of)
);

alter table public.sector_cuts enable row level security;
revoke all on public.sector_cuts from anon, authenticated;
