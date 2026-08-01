-- STEP 847 §6 — 다모다란 등급별 회사채 스프레드(부채비용 산출용) + 세율 Total Market 폴백 행.
-- credit_spread = wacc.xls "Cost of Debt Lookup Table (based on std dev in stock prices)" — 주가변동성 밴드→basis spread.
-- (Total Market 세율 폴백 행은 기존 damodaran_tax_rate에 upsert로 추가 — 별도 테이블 아님.)
create table if not exists public.damodaran_credit_spread (
  as_of      date not null,
  std_dev_lo numeric not null,  -- 밴드 하한(주가 표준편차)
  std_dev_hi numeric,           -- 밴드 상한
  spread     numeric,           -- basis spread (부채비용에 가산)
  unique (as_of, std_dev_lo)
);
alter table public.damodaran_credit_spread enable row level security;
revoke all on public.damodaran_credit_spread from anon, authenticated;
