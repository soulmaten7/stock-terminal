-- spinoff/unused-tables-2026-08-16/schema.sql
-- STEP1051 — 미사용 7개 테이블 원본 DDL 백업 (2026-08-16)
--
-- information_schema/pg_catalog 직접 조회로 재구성한 실제 DDL(추정 아님). 대상은
-- probe_1049가 「미사용(코드 참조 0)」으로 판정하고 STEP1051이 두 방법(정방향+역방향)
-- 재확인·DB오브젝트(FK·인덱스·트리거·RLS) 대조까지 마친 뒤에도 참조 0으로 남은 7개.
--
-- 🔴 damodaran_capex·damodaran_working_capital은 같은 probe_1049 "미사용 8건"에
--   속했지만 이번 STEP1051 재확인에서 "실제로 쓰인다"(STEP846 정책상 대조용 참고자료로
--   설계상 read 코드가 없을 뿐, ingest_damodaran.ts가 매년 능동적으로 write함)로 판정돼
--   처분 대상에서 제외됐다 — 반증 조건(⓪-4)이 실제로 걸린 사례. 이 파일에 없다.

-- ============================================
-- 1. ai_view_cache (0행) — 마이그레이션 파일에 없음(MCP 직접 생성 추정, advisor_directory와 같은 패턴)
-- ============================================
CREATE TABLE ai_view_cache (
  symbol TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ai_view_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_view_cache public read" ON ai_view_cache FOR SELECT USING (true);

-- ============================================
-- 2. banned_words (0행) — 001_initial_schema.sql, seed INSERT 있었으나 필터링 로직 코드 자체가 없음
-- ============================================
CREATE TABLE banned_words (
  id BIGSERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read banned_words" ON banned_words FOR SELECT USING (true);

-- ============================================
-- 3. macro_indicators (0행) — 001_initial_schema.sql, SYSTEM_MAP.md가 2026-08-07부터 "죽은 테이블"로 기록
-- ============================================
CREATE TABLE macro_indicators (
  id BIGSERIAL PRIMARY KEY,
  indicator_name TEXT NOT NULL,
  country TEXT NOT NULL,
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_rate NUMERIC,
  unit TEXT,
  measured_at DATE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (indicator_name, country, measured_at)
);
ALTER TABLE macro_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read macro" ON macro_indicators FOR SELECT USING (true);

-- ============================================
-- 4. discussion_reports (0행) — 017_discussions.sql. discussions(유지 대상)의 자식.
--    discussions·discussion_comments·discussion_likes는 회원탈퇴 클린업 코드(app/api/account/delete/route.ts)가
--    참조해 "구축됐으나 미노출"로 유지됐지만, discussion_reports는 그 클린업 배열에도 없어 참조가 완전히 0이었다.
-- ============================================
CREATE TABLE discussion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (discussion_id, reporter_id)
);
ALTER TABLE discussion_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports auth insert" ON discussion_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- 원본 트리거(테이블과 함께 자동 소멸): trigger_discussion_reports_count AFTER INSERT →
--   update_discussion_report_count(). 🔴 이 함수 자체는 이번 STEP에서 안 지웠다(범위=테이블 처분,
--   함수는 트리거 소멸로 vestigial해질 뿐 해가 없음 — "못 한 것"에 기록).

-- ============================================
-- 5. platform_discussion_reports (0행) — 019_platform_directory.sql. platform_discussions(유지 대상)의 자식.
--    discussion_reports와 완전히 같은 처지(클린업 배열에도 없어 참조 0).
-- ============================================
CREATE TABLE platform_discussion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES platform_discussions(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (discussion_id, reporter_id)
);
ALTER TABLE platform_discussion_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_reports auth insert" ON platform_discussion_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- 원본 트리거(테이블과 함께 자동 소멸): trigger_platform_reports_count AFTER INSERT →
--   update_platform_discussion_report_count(). 함수 자체는 미삭제(위와 동일 사유).

-- ============================================
-- 6. products (10행) — 019_platform_directory.sql. 🔴 A-2 귀속 판정: 내용 기준 KR
--    (KODEX/TIGER 등 10개 전부 한국 ETF, created_at 전부 2026-06-24T06:29:00.498616 단일
--    타임스탬프 — spinoff/kr-pilot-2026-06-25/의 stocks·dividends와 같은 시딩 패턴, 하루 전).
--    코드 참조는 0(이전 조사의 "products" 매치는 SPDR URL 경로 문자열 "library-content/products/"의
--    우연한 부분일치였음 — 재확인 완료).
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('etf','fund','wrap','els','bond','reits','other')),
  ticker TEXT,
  name TEXT NOT NULL,
  issuer TEXT,
  description TEXT,
  external_url TEXT,
  fee_pct NUMERIC,
  inception_date DATE,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  discussion_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_category ON products (category) WHERE (hidden = false);
CREATE INDEX idx_products_ticker ON products (ticker) WHERE (ticker IS NOT NULL);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON products FOR SELECT USING (true);

-- ============================================
-- 7. us_sector_relative_snapshot (2,294행) — MCP 직접 생성 추정(마이그레이션 파일에 없음).
--    STEP980 이전(pre_step980) 감사·비교용 1회 스냅샷. 쓰기 코드 0·읽기 코드 0(둘 다 확인).
-- ============================================
CREATE TABLE us_sector_relative_snapshot (
  snapshot_tag TEXT NOT NULL,
  as_of DATE NOT NULL,
  symbol TEXT NOT NULL,
  sector TEXT,
  per_pct NUMERIC,
  pbr_pct NUMERIC,
  psr_pct NUMERIC,
  ev_ebitda_pct NUMERIC,
  per_n INTEGER,
  pbr_n INTEGER,
  psr_n INTEGER,
  ev_ebitda_n INTEGER,
  unavailable JSONB,
  min_sample INTEGER,
  sector_as_of DATE,
  per_rel NUMERIC,
  pbr_rel NUMERIC,
  psr_rel NUMERIC,
  ev_ebitda_rel NUMERIC,
  per_med NUMERIC,
  pbr_med NUMERIC,
  psr_med NUMERIC,
  ev_ebitda_med NUMERIC,
  updated_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (snapshot_tag, as_of, symbol)
);
-- RLS 정책 없음(오늘 재확인 결과 pg_policies에 행 없음) — 이 테이블은 원래도 anon 접근 통제가 안 걸려 있었다.
