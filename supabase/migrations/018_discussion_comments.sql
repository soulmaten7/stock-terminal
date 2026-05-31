-- 018: 토론 댓글
-- STEP 124 — 운종 V5 대화 본질 강화
-- ⚠️ 이 마이그레이션은 Cowork 가 Supabase MCP 로 별도 적용 (Claude Code 직접 적용 X).

-- ============================================================
-- 1) discussion_comments — 댓글
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL,
  tier SMALLINT NOT NULL DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  like_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_created
  ON public.discussion_comments (discussion_id, created_at ASC);

-- ============================================================
-- 2) 댓글 작성·삭제 시 discussions.comment_count 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_discussion_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discussions SET comment_count = comment_count + 1 WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discussions SET comment_count = comment_count - 1 WHERE id = OLD.discussion_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_discussion_comments_count ON public.discussion_comments;
CREATE TRIGGER trigger_discussion_comments_count
  AFTER INSERT OR DELETE ON public.discussion_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_comment_count();

-- ============================================================
-- 3) RLS — 모두 읽기 (hidden=false), 인증만 작성
-- ============================================================
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments public read" ON public.discussion_comments;
CREATE POLICY "comments public read" ON public.discussion_comments
  FOR SELECT USING (hidden = false);

DROP POLICY IF EXISTS "comments auth insert" ON public.discussion_comments;
CREATE POLICY "comments auth insert" ON public.discussion_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND char_length(content) BETWEEN 1 AND 2000);

-- 본인 댓글 삭제 가능
DROP POLICY IF EXISTS "comments self delete" ON public.discussion_comments;
CREATE POLICY "comments self delete" ON public.discussion_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4) Realtime publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_comments;
