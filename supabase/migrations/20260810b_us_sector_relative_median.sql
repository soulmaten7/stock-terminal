-- STEP 980 — 업종 대비 정본을 중앙값 배율로 전환(백분위는 전환기 대조군으로 남긴다).
-- 기존 컬럼(per_pct 등) 무변경. 신규 8개 컬럼만 추가.
-- 마이그레이션 전 us_sector_relative 행수(기록): as_of=2026-08-09 1167행 · as_of=2026-08-08 1127행.
alter table public.us_sector_relative
  add column if not exists per_rel numeric,
  add column if not exists pbr_rel numeric,
  add column if not exists psr_rel numeric,
  add column if not exists ev_ebitda_rel numeric,
  add column if not exists per_med numeric,
  add column if not exists pbr_med numeric,
  add column if not exists psr_med numeric,
  add column if not exists ev_ebitda_med numeric;
-- RLS는 기존 테이블 정책을 그대로 상속(컬럼 추가는 RLS 정책에 영향 없음 — 별도 조치 불필요).
