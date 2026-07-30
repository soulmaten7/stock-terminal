-- STEP 833 §1-3: 시총 최근값 폴백 저장소(배치·개별 재시도 다 실패한 심볼용). us_stock_perf에 컬럼 붙이지 않음
--   (부분컬럼 upsert가 NULL로 덮는 808 함정 회피 — 전용 테이블). 매 실행 성공 cap 기록 → 다음날 폴백 재료.
-- (2026-07-30 MCP apply_migration으로 라이브 적용 완료 — 이 파일은 리포 기록/재현용.)
create table if not exists us_market_cap (
  symbol text primary key,
  market_cap numeric not null check (market_cap > 0),
  as_of date not null,
  updated_at timestamptz not null default now()
);
alter table us_market_cap enable row level security;
-- 내부(크론·service_role)만. anon/authenticated 정책 없음(service_role은 RLS 우회). 명시 revoke.
revoke all on us_market_cap from anon, authenticated;

-- STEP 833 §4: lens_distribution 실행 권한 anon/authenticated revoke — 서버(admin)만 호출하므로 동작 변화 0.
revoke execute on function lens_distribution(text, text) from anon, authenticated;
