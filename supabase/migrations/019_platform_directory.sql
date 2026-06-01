-- 019: MVP 2.0 — 상품·리딩방 디렉토리 + 평가 시스템
-- STEP 128 — 운종 = Trustpilot 한국 금융 버전 (진짜 차별화)
-- ⚠️ 이 마이그레이션은 Cowork 가 Supabase MCP 로 별도 적용 (Claude Code 직접 적용 X).

-- ============================================================
-- 1) products — 금융 상품 (ETF, 펀드, 랩, ELS 등)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('etf', 'fund', 'wrap', 'els', 'bond', 'reits', 'other')),
  ticker TEXT,
  name TEXT NOT NULL,
  issuer TEXT,
  description TEXT,
  external_url TEXT,
  fee_pct NUMERIC(5, 4),
  inception_date DATE,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  discussion_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category) WHERE hidden = false;
CREATE INDEX IF NOT EXISTS idx_products_ticker ON public.products (ticker) WHERE ticker IS NOT NULL;

-- ============================================================
-- 2) leading_rooms — 리딩방 (텔레그램·카톡방·디스코드 등)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leading_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'kakao', 'discord', 'naver_band', 'naver_cafe', 'youtube', 'other')),
  name TEXT NOT NULL,
  operator TEXT,
  description TEXT,
  external_url TEXT,
  pricing TEXT,
  category TEXT[],
  is_certified BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  discussion_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leading_rooms_platform ON public.leading_rooms (platform) WHERE hidden = false;

-- ============================================================
-- 3) platform_discussions — 상품·리딩방 평가 토론 (다형 참조)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'room')),
  target_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  tier SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  duration TEXT,
  outcome TEXT CHECK (outcome IS NULL OR outcome IN ('positive', 'neutral', 'negative')),
  like_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_discussions_target_created
  ON public.platform_discussions (target_type, target_id, created_at DESC) WHERE hidden = false;
CREATE INDEX IF NOT EXISTS idx_platform_discussions_target_hot
  ON public.platform_discussions (target_type, target_id, like_count DESC) WHERE hidden = false;

-- ============================================================
-- 4) platform_discussion_likes / reports
-- ============================================================
CREATE TABLE IF NOT EXISTS public.platform_discussion_likes (
  discussion_id UUID NOT NULL REFERENCES public.platform_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.platform_discussion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.platform_discussions(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discussion_id, reporter_id)
);

-- ============================================================
-- 5) 트리거 — like_count, discussion_count, 자동 hidden
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_platform_discussion_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.platform_discussions SET like_count = like_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.platform_discussions SET like_count = like_count - 1 WHERE id = OLD.discussion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_platform_likes_count ON public.platform_discussion_likes;
CREATE TRIGGER trigger_platform_likes_count
  AFTER INSERT OR DELETE ON public.platform_discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_discussion_like_count();

CREATE OR REPLACE FUNCTION public.update_platform_discussion_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.platform_discussions
  SET report_count = report_count + 1,
      hidden = (report_count + 1) >= 5
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_platform_reports_count ON public.platform_discussion_reports;
CREATE TRIGGER trigger_platform_reports_count
  AFTER INSERT ON public.platform_discussion_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_discussion_report_count();

CREATE OR REPLACE FUNCTION public.update_target_discussion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'product' THEN
      UPDATE public.products SET discussion_count = discussion_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'room' THEN
      UPDATE public.leading_rooms SET discussion_count = discussion_count + 1 WHERE id = NEW.target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'product' THEN
      UPDATE public.products SET discussion_count = discussion_count - 1 WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'room' THEN
      UPDATE public.leading_rooms SET discussion_count = discussion_count - 1 WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_target_discussion_count ON public.platform_discussions;
CREATE TRIGGER trigger_target_discussion_count
  AFTER INSERT OR DELETE ON public.platform_discussions
  FOR EACH ROW EXECUTE FUNCTION public.update_target_discussion_count();

-- ============================================================
-- 6) RLS
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leading_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussion_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products public read" ON public.products;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (hidden = false);
DROP POLICY IF EXISTS "leading_rooms public read" ON public.leading_rooms;
CREATE POLICY "leading_rooms public read" ON public.leading_rooms FOR SELECT USING (hidden = false);

DROP POLICY IF EXISTS "platform_discussions public read" ON public.platform_discussions;
CREATE POLICY "platform_discussions public read" ON public.platform_discussions
  FOR SELECT USING (hidden = false);
DROP POLICY IF EXISTS "platform_discussions auth insert" ON public.platform_discussions;
CREATE POLICY "platform_discussions auth insert" ON public.platform_discussions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND char_length(content) BETWEEN 1 AND 5000);

DROP POLICY IF EXISTS "platform_likes auth read" ON public.platform_discussion_likes;
CREATE POLICY "platform_likes auth read" ON public.platform_discussion_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "platform_likes self insert" ON public.platform_discussion_likes;
CREATE POLICY "platform_likes self insert" ON public.platform_discussion_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "platform_likes self delete" ON public.platform_discussion_likes;
CREATE POLICY "platform_likes self delete" ON public.platform_discussion_likes
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "platform_reports auth insert" ON public.platform_discussion_reports;
CREATE POLICY "platform_reports auth insert" ON public.platform_discussion_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- 7) 시드 데이터 — 주요 ETF + 리딩방 placeholder
-- ============================================================
INSERT INTO public.products (category, ticker, name, issuer, description, external_url, fee_pct) VALUES
  ('etf', '069500', 'KODEX 200', '삼성자산운용', 'KOSPI 200 추종', 'https://www.samsungfund.com', 0.0015),
  ('etf', '102110', 'TIGER 200', '미래에셋자산운용', 'KOSPI 200 추종', 'https://www.tigeretf.com', 0.0005),
  ('etf', '133690', 'TIGER 미국나스닥100', '미래에셋자산운용', '미국 나스닥100 추종', 'https://www.tigeretf.com', 0.0070),
  ('etf', '360750', 'TIGER 미국S&P500', '미래에셋자산운용', '미국 S&P500 추종', 'https://www.tigeretf.com', 0.0070),
  ('etf', '305720', 'KODEX 2차전지산업', '삼성자산운용', '국내 2차전지 산업', 'https://www.samsungfund.com', 0.0045),
  ('etf', '305540', 'TIGER 2차전지테마', '미래에셋자산운용', '국내 2차전지 테마', 'https://www.tigeretf.com', 0.0050),
  ('etf', '459580', 'KODEX 미국나스닥100(H)', '삼성자산운용', '환헤지 나스닥100', 'https://www.samsungfund.com', 0.0070),
  ('etf', '329200', 'TIGER 리츠부동산인프라', '미래에셋자산운용', '국내 리츠·인프라', 'https://www.tigeretf.com', 0.0050),
  ('etf', '278530', 'KODEX 200TR', '삼성자산운용', 'KOSPI 200 (배당재투자)', 'https://www.samsungfund.com', 0.0015),
  ('etf', '379780', 'KODEX 미국나스닥100TR', '삼성자산운용', '나스닥100 배당재투자', 'https://www.samsungfund.com', 0.0070)
ON CONFLICT DO NOTHING;

INSERT INTO public.leading_rooms (platform, name, operator, description, pricing, category, is_certified) VALUES
  ('telegram', '예시 리딩방 A', '익명 운영자 A', '단타 리딩 (시드 데이터)', '월 50만원', ARRAY['단타'], false),
  ('telegram', '예시 리딩방 B', '익명 운영자 B', '장타·가치투자 리딩 (시드 데이터)', '평생 100만원', ARRAY['장타', '가치투자'], false),
  ('kakao', '예시 카톡방 C', '익명 운영자 C', '미국주식 리딩 (시드 데이터)', '월 30만원', ARRAY['미국주식'], false),
  ('youtube', '예시 유튜브 D', '익명 운영자 D', '주식 분석 채널 (시드 데이터)', '무료', ARRAY['분석', '교육'], false),
  ('discord', '예시 디스코드 E', '익명 운영자 E', '코인·주식 통합 (시드 데이터)', '월 100만원', ARRAY['코인', '주식'], false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8) Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_discussions;
