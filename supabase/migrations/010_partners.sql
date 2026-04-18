-- =============== partners: 파트너 기본 정보 ===============
CREATE TABLE IF NOT EXISTS public.partners (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  hero_image_url TEXT,
  description TEXT,
  category TEXT,
  cta_text TEXT DEFAULT '자세히 보기',
  cta_url TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_slug_active ON public.partners(slug) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_partners_country_active ON public.partners(country) WHERE is_active;

-- =============== partner_slots: 슬롯 키 → 파트너 매핑 ===============
CREATE TABLE IF NOT EXISTS public.partner_slots (
  id BIGSERIAL PRIMARY KEY,
  slot_key TEXT NOT NULL,
  partner_id BIGINT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slot_key, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_slots_key_active ON public.partner_slots(slot_key, position) WHERE is_active;

-- =============== partner_leads: 리드 수집 ===============
CREATE TABLE IF NOT EXISTS public.partner_leads (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT REFERENCES public.partners(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT,
  source_slug TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  consent_marketing BOOLEAN DEFAULT false,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_leads_partner_created ON public.partner_leads(partner_id, created_at DESC);

-- =============== partner_clicks: 클릭 추적 ===============
CREATE TABLE IF NOT EXISTS public.partner_clicks (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  slot_key TEXT,
  source_page TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_clicks_partner_time ON public.partner_clicks(partner_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_slot_time ON public.partner_clicks(slot_key, clicked_at DESC);

-- =============== RLS ===============
ALTER TABLE public.partners        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_leads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_clicks  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partners_read_active"  ON public.partners;
CREATE POLICY "partners_read_active"   ON public.partners      FOR SELECT USING (is_active);
DROP POLICY IF EXISTS "partners_service_all"  ON public.partners;
CREATE POLICY "partners_service_all"   ON public.partners      FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "slots_read_active"     ON public.partner_slots;
CREATE POLICY "slots_read_active"      ON public.partner_slots FOR SELECT USING (is_active);
DROP POLICY IF EXISTS "slots_service_all"     ON public.partner_slots;
CREATE POLICY "slots_service_all"      ON public.partner_slots FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "leads_insert_any"      ON public.partner_leads;
CREATE POLICY "leads_insert_any"       ON public.partner_leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "leads_service_select"  ON public.partner_leads;
CREATE POLICY "leads_service_select"   ON public.partner_leads FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS "clicks_insert_any"     ON public.partner_clicks;
CREATE POLICY "clicks_insert_any"      ON public.partner_clicks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clicks_service_select" ON public.partner_clicks;
CREATE POLICY "clicks_service_select"  ON public.partner_clicks FOR SELECT TO service_role USING (true);

-- =============== Test 파트너 seed ===============
INSERT INTO public.partners (slug, name, logo_url, description, category, cta_text, features, is_active, priority, country) VALUES
('test', '테스트 증권', 'https://placehold.co/240x80/0ABAB5/white?text=TEST+Securities',
 '국내 주식 수수료 업계 최저 + AI 기반 실시간 리서치 무료 제공',
 '증권사', '계좌 개설 문의하기',
 '[
    {"title":"수수료 0.015%","description":"국내 주식 거래 수수료 업계 최저 수준"},
    {"title":"AI 리서치 무료","description":"AI가 종목 분석 리포트를 매일 발행"},
    {"title":"24시간 상담","description":"카카오톡 · 전화 · 이메일 채널 지원"}
  ]'::jsonb,
 true, 100, 'KR')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  priority = EXCLUDED.priority,
  updated_at = now();

-- 슬롯: home-row3-left (홈 우측 사이드바 첫 번째 슬롯)
WITH p AS (SELECT id FROM public.partners WHERE slug='test')
INSERT INTO public.partner_slots (slot_key, partner_id, position, is_active)
SELECT 'home-row3-left', p.id, 1, true FROM p
ON CONFLICT (slot_key, partner_id) DO NOTHING;

-- 슬롯: toolbox-category-exchange (link_hub에 exchange 카테고리 존재, brokers 없음)
WITH p AS (SELECT id FROM public.partners WHERE slug='test')
INSERT INTO public.partner_slots (slot_key, partner_id, position, is_active)
SELECT 'toolbox-category-exchange', p.id, 1, true FROM p
ON CONFLICT (slot_key, partner_id) DO NOTHING;
