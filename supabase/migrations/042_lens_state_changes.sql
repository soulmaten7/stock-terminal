create table if not exists lens_state_changes (
  id bigint generated always as identity primary key,
  change_date date not null,
  market text not null,             -- 'KR' | 'US'
  symbol text not null,
  name text,                        -- 표시용(스냅샷 시점)
  lens_key text not null,           -- 렌즈 식별자(momentum 등 · lenses.ts stable key)
  from_state text,
  to_state text not null,
  from_tone text,                   -- pos|warn|flat (lensTones 매핑)
  to_tone text not null,
  trade_amount numeric,             -- 정렬용(당일 거래대금·스냅샷 join 시점 값)
  created_at timestamptz default now()
);
create unique index if not exists lens_state_changes_uniq on lens_state_changes(change_date, market, symbol, lens_key);
create index if not exists lens_state_changes_date_market on lens_state_changes(change_date, market);
alter table lens_state_changes enable row level security;
-- 읽기는 서버(service-role)만 — anon 정책 없음(기존 스냅샷 테이블과 동일 방침)
