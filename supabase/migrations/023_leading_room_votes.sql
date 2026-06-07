-- 023_leading_room_votes.sql
-- 리딩방 좋아요/싫어요(엄지척/엄지내리기) — leading_rooms 카운트 + 투표 테이블 + 동기화 트리거
-- 기존 017(discussions)·020/022(dislike) 패턴 그대로 미러. ⚠️ 운종 전용 Supabase(ref qxkmwlkchyxfzxbonhtj)에만 적용.

-- 1) leading_rooms 에 like/dislike 카운트 컬럼
ALTER TABLE public.leading_rooms
  ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dislike_count INTEGER NOT NULL DEFAULT 0;

-- 2) 투표 테이블 (유저당 방당 1표, like|dislike)
CREATE TABLE IF NOT EXISTS public.leading_room_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.leading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_leading_room_votes_room ON public.leading_room_votes (room_id);

-- 3) 카운트 동기화 트리거 (INSERT / DELETE / UPDATE(전환))
CREATE OR REPLACE FUNCTION public.update_leading_room_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE public.leading_rooms SET like_count = like_count + 1 WHERE id = NEW.room_id;
    ELSE
      UPDATE public.leading_rooms SET dislike_count = dislike_count + 1 WHERE id = NEW.room_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE public.leading_rooms SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.room_id;
    ELSE
      UPDATE public.leading_rooms SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = OLD.room_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.vote_type <> OLD.vote_type THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE public.leading_rooms SET like_count = like_count + 1, dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = NEW.room_id;
    ELSE
      UPDATE public.leading_rooms SET dislike_count = dislike_count + 1, like_count = GREATEST(like_count - 1, 0) WHERE id = NEW.room_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leading_room_vote_count ON public.leading_room_votes;
CREATE TRIGGER trg_leading_room_vote_count
  AFTER INSERT OR DELETE OR UPDATE ON public.leading_room_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_leading_room_vote_count();

-- 4) RLS — 공개 읽기, 본인 표만 쓰기/수정/삭제
ALTER TABLE public.leading_room_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room votes read" ON public.leading_room_votes;
CREATE POLICY "room votes read" ON public.leading_room_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "room votes insert own" ON public.leading_room_votes;
CREATE POLICY "room votes insert own" ON public.leading_room_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "room votes update own" ON public.leading_room_votes;
CREATE POLICY "room votes update own" ON public.leading_room_votes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "room votes delete own" ON public.leading_room_votes;
CREATE POLICY "room votes delete own" ON public.leading_room_votes FOR DELETE USING (auth.uid() = user_id);
