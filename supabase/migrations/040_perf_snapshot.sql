-- STEP 668: {cc}_stock_perf에 스냅샷 필드 추가(가격·거래대금·1년수익률·1일수익률). 이미 있으면 무시.
-- vn_stock_perf: r1d는 이미 있음 → price·amount·r1y만 추가
alter table vn_stock_perf
  add column if not exists price numeric,
  add column if not exists amount numeric,
  add column if not exists r1y numeric;

-- us/cn/jp/gb: r1d도 없어서 함께 추가
alter table us_stock_perf
  add column if not exists r1d numeric,
  add column if not exists price numeric,
  add column if not exists amount numeric,
  add column if not exists r1y numeric;

alter table cn_stock_perf
  add column if not exists r1d numeric,
  add column if not exists price numeric,
  add column if not exists amount numeric,
  add column if not exists r1y numeric;

alter table jp_stock_perf
  add column if not exists r1d numeric,
  add column if not exists price numeric,
  add column if not exists amount numeric,
  add column if not exists r1y numeric;

alter table gb_stock_perf
  add column if not exists r1d numeric,
  add column if not exists price numeric,
  add column if not exists amount numeric,
  add column if not exists r1y numeric;
