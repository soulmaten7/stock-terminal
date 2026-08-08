-- STEP 944 — Q0 ⑤ 준비: sector_cuts에 적용/제외 표기 추가(기존 행 삭제·수정 없음, 컬럼만 추가) +
-- resolveSector 결과 영속화 테이블(캐시 — resolveSector가 정본, 이 테이블은 갱신 스크립트로 언제든 재생성 가능).

-- ── 1. sector_cuts: 적용/제외 표기 컬럼 추가 ──────────────────────────────
alter table public.sector_cuts add column if not exists applied boolean;
alter table public.sector_cuts add column if not exists exclude_reason text;
alter table public.sector_cuts add column if not exists width_over_iqr double precision;

-- ── 2. us_sector_resolved: resolveSector 결과 캐시 ────────────────────────
-- 🔴 이 테이블은 진실의 원천이 아니다 — lib/sector.ts의 resolveSector가 정본. 갱신은 scripts/refresh_sector.ts.
create table if not exists public.us_sector_resolved (
  as_of        date not null,
  symbol       text not null,
  sector       text,
  source       text,
  cross_nasdaq text,
  cross_sic    text,
  cross_yahoo  text,
  disagree     boolean,
  updated_at   timestamptz not null default now(),
  primary key (as_of, symbol)
);

alter table public.us_sector_resolved enable row level security;
revoke all on public.us_sector_resolved from anon, authenticated;
