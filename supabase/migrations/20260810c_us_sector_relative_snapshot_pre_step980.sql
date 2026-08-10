-- STEP 980 §4-1 — 백필 전 us_sector_relative 전체 스냅샷(tag=pre_step980).
-- 969의 백필 사고(191종목 오염)를 반복하지 않기 위한 필수 절차. 영구 테이블 아님 — 비교가 끝나면 지운다(STATE.md에 명시).
create table if not exists public.us_sector_relative_snapshot (
  snapshot_tag   text not null,
  as_of          date not null,
  symbol         text not null,
  sector         text,
  per_pct        numeric,
  pbr_pct        numeric,
  psr_pct        numeric,
  ev_ebitda_pct  numeric,
  per_n          int,
  pbr_n          int,
  psr_n          int,
  ev_ebitda_n    int,
  unavailable    jsonb,
  min_sample     int,
  sector_as_of   date,
  per_rel        numeric,
  pbr_rel        numeric,
  psr_rel        numeric,
  ev_ebitda_rel  numeric,
  per_med        numeric,
  pbr_med        numeric,
  psr_med        numeric,
  ev_ebitda_med  numeric,
  updated_at     timestamptz,
  captured_at    timestamptz not null default now(),
  primary key (snapshot_tag, as_of, symbol)
);
alter table public.us_sector_relative_snapshot enable row level security;
revoke all on public.us_sector_relative_snapshot from anon, authenticated;

insert into public.us_sector_relative_snapshot (
  snapshot_tag, as_of, symbol, sector, per_pct, pbr_pct, psr_pct, ev_ebitda_pct,
  per_n, pbr_n, psr_n, ev_ebitda_n, unavailable, min_sample, sector_as_of,
  per_rel, pbr_rel, psr_rel, ev_ebitda_rel, per_med, pbr_med, psr_med, ev_ebitda_med, updated_at
)
select 'pre_step980', as_of, symbol, sector, per_pct, pbr_pct, psr_pct, ev_ebitda_pct,
  per_n, pbr_n, psr_n, ev_ebitda_n, unavailable, min_sample, sector_as_of,
  per_rel, pbr_rel, psr_rel, ev_ebitda_rel, per_med, pbr_med, psr_med, ev_ebitda_med, updated_at
from public.us_sector_relative
on conflict (snapshot_tag, as_of, symbol) do nothing;
