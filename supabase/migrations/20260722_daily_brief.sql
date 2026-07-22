-- 오늘 화면 "한 입 브리핑" 리드 문단(STEP 778) — 하루 1회 배치 생성, market='KR'|'US'.
-- Cowork이 MCP로 선적용 완료(archival 기록용 — 실제 적용은 이미 됨. 재실행 시 idempotent하도록 IF NOT EXISTS).
create table if not exists daily_brief (
  brief_date date not null,
  market text not null,
  text_ko text,
  text_en text,
  source_facts jsonb,
  created_at timestamptz not null default now(),
  primary key (brief_date, market)
);

alter table daily_brief enable row level security;
-- 읽기 전부 service-role(서버 프리페치·크론) — anon/authenticated 권한 없음, 기존 공개 데이터 테이블 관례와 동일.
revoke all on daily_brief from anon, authenticated;
