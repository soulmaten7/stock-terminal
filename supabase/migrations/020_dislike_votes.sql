-- 020: 플랫폼 평가 토론 추천/비추천 투표 (PRODUCT SPEC V6 결정 ①)
-- 별점 ❌ → 추천(+1)/비추천(-1) 투표 + 신고. 사용자당 1표(추천 또는 비추천), 토글·전환 가능.
-- ⚠️ 이 마이그레이션은 Cowork 가 Supabase MCP 로 별도 적용 (Claude Code 직접 적용 X). 운종 전용 Supabase 프로젝트만 사용.

-- 1) 투표 방향 컬럼 — 기존 likes 행은 모두 추천(+1)
ALTER TABLE public.platform_discussion_likes
  ADD COLUMN IF NOT EXISTS vote SMALLINT NOT NULL DEFAULT 1 CHECK (vote IN (-1, 1));

-- 2) 비추천 집계 컬럼
ALTER TABLE public.platform_discussions
  ADD COLUMN IF NOT EXISTS dislike_count INTEGER NOT NULL DEFAULT 0;

-- 3) like_count / dislike_count 동시 갱신 트리거 (INSERT / DELETE / UPDATE(전환))
CREATE OR REPLACE FUNCTION public.update_platform_discussion_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 1 THEN
      UPDATE public.platform_discussions SET like_count = like_count + 1 WHERE id = NEW.discussion_id;
    ELSE
      UPDATE public.platform_discussions SET dislike_count = dislike_count + 1 WHERE id = NEW.discussion_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 1 THEN
      UPDATE public.platform_discussions SET like_count = like_count - 1 WHERE id = OLD.discussion_id;
    ELSE
      UPDATE public.platform_discussions SET dislike_count = dislike_count - 1 WHERE id = OLD.discussion_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.vote <> NEW.vote THEN
    IF NEW.vote = 1 THEN
      UPDATE public.platform_discussions
        SET like_count = like_count + 1, dislike_count = GREATEST(dislike_count - 1, 0)
        WHERE id = NEW.discussion_id;
    ELSE
      UPDATE public.platform_discussions
        SET dislike_count = dislike_count + 1, like_count = GREATEST(like_count - 1, 0)
        WHERE id = NEW.discussion_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_platform_likes_count ON public.platform_discussion_likes;
CREATE TRIGGER trigger_platform_likes_count
  AFTER INSERT OR DELETE OR UPDATE ON public.platform_discussion_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_discussion_like_count();
