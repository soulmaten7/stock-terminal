-- 017: 토론 게시판 + 종목별 채팅
-- STEP 115 — 운종 V5 핵심 (종목 페이지).
-- ⚠️ 이 마이그레이션은 Cowork 가 Supabase MCP 로 별도 적용 (Claude Code 직접 적용 X).

-- ============================================================
-- 1) discussions — 토론 게시글
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  tier SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  title TEXT,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussions_symbol_created
  ON public.discussions (symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_symbol_hot
  ON public.discussions (symbol, like_count DESC, created_at DESC);

-- ============================================================
-- 2) discussion_likes — 좋아요
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_likes (
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, user_id)
);

-- ============================================================
-- 3) discussion_reports — 신고
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discussion_id, reporter_id)
);

-- ============================================================
-- 4) chat_messages 에 symbol 컬럼 추가 (종목별 채팅)
-- ============================================================
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS symbol TEXT DEFAULT NULL;

-- NULL = 전체 채팅 (general), 값 = 종목별 채팅
CREATE INDEX IF NOT EXISTS idx_chat_messages_symbol_created
  ON public.chat_messages (symbol, created_at DESC) WHERE symbol IS NOT NULL;

-- ============================================================
-- 5) like_count 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_discussion_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussions SET like_count = like_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussions SET like_count = like_count - 1 WHERE id = OLD.discussion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_discussion_likes_count ON public.discussion_likes;
CREATE TRIGGER trigger_discussion_likes_count
  AFTER INSERT OR DELETE ON public.discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_like_count();

-- ============================================================
-- 6) report_count + auto-hide (5건 이상 자동 숨김)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_discussion_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.discussions
  SET report_count = report_count + 1,
      hidden = (report_count + 1) >= 5
  WHERE id = NEW.discussion_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_discussion_reports_count ON public.discussion_reports;
CREATE TRIGGER trigger_discussion_reports_count
  AFTER INSERT ON public.discussion_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_report_count();

-- ============================================================
-- 7) RLS
-- ============================================================
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reports ENABLE ROW LEVEL SECURITY;

-- 토론 글: 모두 읽기 (hidden=false), 로그인한 사람만 작성
DROP POLICY IF EXISTS "discussions public read" ON public.discussions;
CREATE POLICY "discussions public read" ON public.discussions
  FOR SELECT USING (hidden = false);
DROP POLICY IF EXISTS "discussions auth insert" ON public.discussions;
CREATE POLICY "discussions auth insert" ON public.discussions
  FOR INSERT WITH CHECK (auth.uid() = user_id AND char_length(content) BETWEEN 1 AND 5000);

-- 좋아요: 로그인한 사람만
DROP POLICY IF EXISTS "likes auth read" ON public.discussion_likes;
CREATE POLICY "likes auth read" ON public.discussion_likes
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "likes self insert" ON public.discussion_likes;
CREATE POLICY "likes self insert" ON public.discussion_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "likes self delete" ON public.discussion_likes;
CREATE POLICY "likes self delete" ON public.discussion_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 신고: 로그인한 사람만 INSERT
DROP POLICY IF EXISTS "reports auth insert" ON public.discussion_reports;
CREATE POLICY "reports auth insert" ON public.discussion_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- 8) Realtime — 토론 publication 추가
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions;
-- chat_messages 는 이미 005 에서 추가됨
