-- 021: FSS 유사투자자문업자 인증 (V6 Phase 2-①)
-- 금감원 파인(FINE) 유사투자자문업자 신고현황 원장 캐시 + 리딩방 인증 컬럼.
-- ⚠️ 이 마이그레이션은 Cowork 가 Supabase MCP 로 적용. Claude Code 는 파일 생성만 (직접 apply ❌). 운종 전용 Supabase 프로젝트만 사용.

-- 1) 파인 원장 캐시 테이블
CREATE TABLE IF NOT EXISTS public.fss_advisors (
  biz_no        TEXT PRIMARY KEY,            -- 사업자번호 (자연키)
  company_name  TEXT NOT NULL,               -- 상호
  info_name     TEXT,                        -- 정보명칭
  representative TEXT,                        -- 대표자
  valid_from    DATE,
  valid_to      DATE,                         -- 유효기간 끝
  address       TEXT,
  phone         TEXT,
  homepage      TEXT,
  email         TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  source        TEXT NOT NULL DEFAULT 'fss_fine',
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fss_advisors_company ON public.fss_advisors (company_name);
CREATE INDEX IF NOT EXISTS idx_fss_advisors_homepage ON public.fss_advisors (homepage) WHERE homepage IS NOT NULL;

-- 2) leading_rooms 인증 컬럼 추가
ALTER TABLE public.leading_rooms
  ADD COLUMN IF NOT EXISTS biz_no           TEXT,
  ADD COLUMN IF NOT EXISTS cert_type        TEXT CHECK (cert_type IS NULL OR cert_type IN ('similar_advisory', 'advisory', 'securities')),
  ADD COLUMN IF NOT EXISTS cert_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fss_biz_no       TEXT REFERENCES public.fss_advisors(biz_no) ON DELETE SET NULL;

-- 3) RLS — fss_advisors 공개 읽기 (검증 표시용). 쓰기는 service_role(임포트 잡)만.
ALTER TABLE public.fss_advisors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fss_advisors public read" ON public.fss_advisors;
CREATE POLICY "fss_advisors public read" ON public.fss_advisors FOR SELECT USING (true);
