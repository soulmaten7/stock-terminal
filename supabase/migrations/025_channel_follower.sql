-- 025_channel_follower.sql
-- 주식 관련 채널 팔로워수 — leading_rooms 에 follower_count + 동기화 시각.
-- 유튜브=자동수집(주1회 크론, 후속), 인스타/페북=등록 기반(주인 제출). ⚠️ 운종 DB(ref qxkmwlkchyxfzxbonhtj)에만.

ALTER TABLE public.leading_rooms
  ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS follower_synced_at TIMESTAMPTZ;
