-- 038_gb_stock_perf — GB 종목 1주~6개월 수익률 미리계산 스냅샷. 크론(/api/cron/gb-perf)이 야후 .L chart로 하루 1회.
-- gb-list가 조인해 즉시 서빙. jp/cn/vn_stock_perf와 동일 규칙.
create table if not exists public.gb_stock_perf (
  symbol text primary key,
  r1w double precision, r1m double precision, r3m double precision, r6m double precision,
  updated_at timestamptz default now()
);
alter table public.gb_stock_perf enable row level security;
drop policy if exists "gb_stock_perf public read" on public.gb_stock_perf;
create policy "gb_stock_perf public read" on public.gb_stock_perf for select using (true);
