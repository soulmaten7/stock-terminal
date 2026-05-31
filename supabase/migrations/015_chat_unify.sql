-- 015: 채팅 room 통합 (scalper/longterm/us → general)
-- STEP 114 — 운종 V5 1차 리뉴얼. 단타/장타/미장 3채널을 운종 전체 채팅 1채널로 통합.
-- ⚠️ 이 마이그레이션은 Cowork 가 Supabase MCP 로 별도 적용 (Claude Code 직접 적용 X).

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_room_check;

UPDATE public.chat_messages
  SET room = 'general'
  WHERE room IN ('scalper', 'longterm', 'us');

ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_room_check
  CHECK (room IN ('general'));

-- 디폴트 변경
ALTER TABLE public.chat_messages
  ALTER COLUMN room SET DEFAULT 'general';
