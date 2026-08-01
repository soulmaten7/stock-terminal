-- STEP 846 — 다모다란 참조 데이터 8종 → Postgres (역DCF·이후 모든 모델 공용 재료)
-- 규칙: 모든 테이블 as_of DATE NOT NULL + (as_of, 키) 유니크. 덮어쓰지 말고 새 as_of로 쌓는다(연 1회 갱신).
-- RLS: 전부 enable + anon/authenticated REVOKE (읽기는 service-role만). 패턴 = 20260712_enable_rls_public_data_tables.sql.
-- 원본 xls = Supabase Storage 버킷 sources/damodaran/{as_of}/. 좌표·갱신주기 = lib/revdcf/registry.ts · data/sources/README.md.

-- ── 1. 회사→업종 매핑 (indname.xls "By company name") ────────────────────────
create table if not exists public.damodaran_industry (
  as_of          date not null,
  exchange       text,
  ticker         text,
  company_name   text,
  industry_group text,
  primary_sector text,
  sic_code       text,
  country        text,
  -- §5 매칭 키를 DB에 고정: 구두점 정규화 + 미국 상장 여부(Country 매칭 오분류 방지)
  ticker_norm    text generated always as (upper(regexp_replace(coalesce(ticker,''),'[^A-Za-z0-9]','','g'))) stored,
  is_us_listed   boolean generated always as (exchange in ('NYSE','NasdaqGS','NasdaqCM','NasdaqGM','NYSEAM','AMEX','BATS','OTCPK')) stored,
  unique (as_of, exchange, ticker)
);
create index if not exists idx_damo_industry_us on public.damodaran_industry (as_of, is_us_listed, ticker_norm);

-- ── 2. 업종별 실효세율 (taxrate.xls "Industry Averages" header=8) ──────────────
create table if not exists public.damodaran_tax_rate (
  as_of      date not null,
  industry   text not null,
  n_firms    integer,
  eff_all    numeric,  -- Average across all companies
  eff_money  numeric,  -- Average across only money-making companies
  eff_agg    numeric,  -- Aggregate tax rate
  cash_money numeric,  -- Cash: money-making avg
  cash_agg   numeric,  -- Cash: aggregate
  unique (as_of, industry)
);

-- ── 3. 국가별 한계세율 (countrytaxrates.xls) ─────────────────────────────────
create table if not exists public.damodaran_country_tax (
  as_of         date not null,
  country       text not null,
  marginal_rate numeric,
  unique (as_of, country)
);

-- ── 4. 업종별 WACC 재료 (wacc.xls "Industry Averages" header=18) ──────────────
create table if not exists public.damodaran_wacc (
  as_of           date not null,
  industry        text not null,
  n_firms         integer,
  beta            numeric,
  cost_of_equity  numeric,
  e_over_de       numeric,
  cost_of_debt    numeric,
  tax_rate        numeric,
  after_tax_cod   numeric,
  d_over_de       numeric,
  cost_of_capital numeric,  -- 🔴 대조·검증용만 (§12: 입력으로 쓰지 않는다)
  unique (as_of, industry)
);

-- ── 5. 업종별 베타 (betas.xls "Industry Averages" header=9) ───────────────────
create table if not exists public.damodaran_beta (
  as_of                    date not null,
  industry                 text not null,
  n_firms                  integer,
  beta                     numeric,
  de_ratio                 numeric,
  eff_tax                  numeric,
  unlevered_beta           numeric,
  cash_over_firm           numeric,
  unlevered_beta_cash_adj  numeric,  -- 현금조정 무차입베타 = driver 6 하향식 베타
  std_dev_equity           numeric,
  unique (as_of, industry)
);

-- ── 6. 업종별 CapEx (capex.xls "Industry Averages" header=7) ──────────────────
create table if not exists public.damodaran_capex (
  as_of                    date not null,
  industry                 text not null,
  n_firms                  integer,
  capex                    numeric,
  depreciation             numeric,
  capex_over_dep           numeric,
  acquisitions             numeric,
  net_rnd                  numeric,
  net_capex_over_sales     numeric,
  net_capex_over_ebit_at   numeric,
  sales_over_invcap        numeric,
  unique (as_of, industry)
);

-- ── 7. 업종별 운전자본 (wcdata.xls "Industry Averages" header=7) ──────────────
create table if not exists public.damodaran_working_capital (
  as_of                 date not null,
  industry              text not null,
  n_firms               integer,
  ar_over_sales         numeric,
  inv_over_sales        numeric,
  ap_over_sales         numeric,
  noncash_wc_over_sales numeric,
  unique (as_of, industry)
);

-- ── 8. 글로벌 스칼라 입력 (wacc.xls 상단 셀) ─────────────────────────────────
create table if not exists public.damodaran_global_inputs (
  as_of                  date not null primary key,
  riskfree_rate          numeric,  -- Long Term Treasury bond rate
  erp                    numeric,  -- Risk Premium to Use for Equity
  global_default_spread  numeric,  -- Global Default Spread to add to cost of debt
  marginal_tax_rate_used numeric,  -- 시트에 입력된 한계세율(없으면 null)
  expected_inflation     numeric   -- Expected inflation rate (US$)
);

-- ── RLS: enable + anon/authenticated REVOKE (읽기는 service-role만) ───────────
alter table public.damodaran_industry        enable row level security;
alter table public.damodaran_tax_rate         enable row level security;
alter table public.damodaran_country_tax      enable row level security;
alter table public.damodaran_wacc             enable row level security;
alter table public.damodaran_beta             enable row level security;
alter table public.damodaran_capex            enable row level security;
alter table public.damodaran_working_capital  enable row level security;
alter table public.damodaran_global_inputs    enable row level security;

revoke all on public.damodaran_industry        from anon, authenticated;
revoke all on public.damodaran_tax_rate         from anon, authenticated;
revoke all on public.damodaran_country_tax      from anon, authenticated;
revoke all on public.damodaran_wacc             from anon, authenticated;
revoke all on public.damodaran_beta             from anon, authenticated;
revoke all on public.damodaran_capex            from anon, authenticated;
revoke all on public.damodaran_working_capital  from anon, authenticated;
revoke all on public.damodaran_global_inputs    from anon, authenticated;
