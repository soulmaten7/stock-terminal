-- 036_vn_stock_perf — VN 종목 1주~6개월 수익률 미리계산 스냅샷. 크론(/api/cron/vn-perf)이 야후 .VN chart로 하루 1회 채움.
-- vn-list가 조인해 즉시 서빙(라이브 fetch 제거). cn_stock_perf와 동일 규칙.
create table if not exists public.vn_stock_perf (
  symbol text primary key,
  r1d double precision,  -- 1일 변동(%): 야후 VN quote가 price=prevClose로 0을 줘서, 차트 마지막 2일 종가로 계산해 보드 '1일전'에 사용.
  r1w double precision,
  r1m double precision,
  r3m double precision,
  r6m double precision,
  updated_at timestamptz default now()
);
alter table public.vn_stock_perf add column if not exists r1d double precision;
alter table public.vn_stock_perf enable row level security;
drop policy if exists "vn_stock_perf public read" on public.vn_stock_perf;
create policy "vn_stock_perf public read" on public.vn_stock_perf for select using (true);
