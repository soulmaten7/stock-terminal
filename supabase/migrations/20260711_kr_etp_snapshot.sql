-- KR ETF·ETN 성과 스냅샷 (크론 kr-etp 미리계산 → etf/etn-performance 라우트가 SELECT)
-- 라이브 fetch(요청마다 36콜)의 부분실패·느림 회피. 종목보드(kr_stock_snapshot)와 동일 패턴.
create table if not exists public.kr_etp_snapshot (
  symbol text primary key,
  kind text not null,            -- 'etf' | 'etn'
  name text,
  price numeric,
  change_percent numeric,
  trade_amount numeric,
  r1w numeric, r1m numeric, r3m numeric, r6m numeric, r1y numeric,
  updated_at timestamptz default now()
);
create index if not exists kr_etp_snapshot_kind_amt_idx on public.kr_etp_snapshot (kind, trade_amount desc nulls last);
-- RLS on·정책 없음 → 직접 접근 차단, service-role(admin client)만 접근(라우트가 서버에서 서빙).
alter table public.kr_etp_snapshot enable row level security;
