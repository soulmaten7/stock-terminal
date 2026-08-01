-- STEP 850 — 역DCF 전 종목 산출 결과 (매일 as_of로 쌓음·덮어쓰기 금지·재현성).
-- RLS on + anon/authenticated REVOKE (읽기 service-role만·20260712 패턴).
create table if not exists public.revdcf_results (
  as_of date not null,
  cik bigint not null,
  symbol text,
  verdict text not null,          -- years | below_one | over_cap | value_destroying | invalid | skipped
  gap_years int,                  -- verdict=years 일 때
  gap_wacc_minus1 int,
  gap_wacc_plus1 int,
  explained_pct numeric,          -- over_cap: 25년가치/주가
  threshold_margin numeric,
  monotonic text,                 -- up | down | mixed
  -- 입력 스냅샷 (재현성)
  sales_growth numeric, operating_margin numeric, starting_margin numeric,
  tax_rate numeric, fixed_capital_rate numeric, working_capital_rate numeric,
  wacc numeric, beta_unlevered numeric, de_ratio numeric,
  debt numeric, non_operating_assets numeric, shares numeric, share_price numeric,
  flags jsonb not null default '{}'::jsonb,  -- {revenueTag, revenueBasis, ebitSource, industryMatched, growthIsHistorical, damodaranAsOf, ...}
  skip_reason text,                          -- INSUFFICIENT_HISTORY | MISSING_TAG | NO_INDUSTRY | ...
  primary key (as_of, cik)
);
alter table public.revdcf_results enable row level security;
revoke all on public.revdcf_results from anon, authenticated;
