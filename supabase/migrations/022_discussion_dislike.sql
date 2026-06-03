-- 022: 종목 토론 추천/비추천 (platform_discussions 020 패턴과 통일)
-- 기존 discussion_likes 행은 모두 추천(+1)으로 승계(vote DEFAULT 1).
-- ⚠️ Cowork 가 Supabase MCP 로 적용. Claude Code 는 파일 생성만 (직접 apply ❌). 운종 전용 Supabase 프로젝트만 사용.

-- 1) 투표 방향 컬럼
ALTER TABLE public.discussion_likes
  ADD COLUMN IF NOT EXISTS vote SMALLINT NOT NULL DEFAULT 1 CHECK (vote IN (-1, 1));

-- 2) 비추천 집계 컬럼
ALTER TABLE public.discussions
  ADD COLUMN IF NOT EXISTS dislike_count INTEGER NOT NULL DEFAULT 0;

-- 3) like_count / dislike_count 동시 갱신 (INSERT / DELETE / UPDATE 전환) — 기존 함수 교체
CREATE OR REPLACE FUNCTION public.update_discussion_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 1 THEN
      UPDATE public.discussions SET like_count = like_count + 1 WHERE id = NEW.discussion_id;
    ELSE
      UPDATE public.discussions SET dislike_count = dislike_count + 1 WHERE id = NEW.discussion_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 1 THEN
      UPDATE public.discussions SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.discussion_id;
    ELSE
      UPDATE public.discussions SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = OLD.discussion_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.vote <> NEW.vote THEN
    IF NEW.vote = 1 THEN
      UPDATE public.discussions
        SET like_count = like_count + 1, dislike_count = GREATEST(dislike_count - 1, 0)
        WHERE id = NEW.discussion_id;
    ELSE
      UPDATE public.discussions
        SET dislike_count = dislike_count + 1, like_count = GREATEST(like_count - 1, 0)
        WHERE id = NEW.discussion_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) 트리거 재생성 — UPDATE 까지 포함 (전환 반영)
DROP TRIGGER IF EXISTS trigger_discussion_likes_count ON public.discussion_likes;
CREATE TRIGGER trigger_discussion_likes_count
  AFTER INSERT OR DELETE OR UPDATE ON public.discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_discussion_like_count();
