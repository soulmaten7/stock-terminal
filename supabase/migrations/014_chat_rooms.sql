-- ============================================================
-- 014: chat_messages — room + nickname 컬럼 추가 (Layer 1-B 운종 채팅)
-- ============================================================
--
-- 기존 chat_messages 테이블 (005_chat_v2.sql) 에:
--   room TEXT CHECK ('scalper' | 'longterm' | 'us')
--   nickname TEXT (익명 트레이더 이름)
-- 컬럼 추가. 운종 3창 채팅방 분리.
--
-- INSERT RLS: 기존 auth.uid() = user_id → 누구나 삽입 허용 (Layer 4 에서 강화)
-- ============================================================

-- 1. room 컬럼 추가
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS room TEXT
  DEFAULT 'scalper'
  CHECK (room IN ('scalper', 'longterm', 'us'));

-- 2. nickname 컬럼 추가
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS nickname TEXT
  DEFAULT '익명'
  CHECK (char_length(nickname) BETWEEN 1 AND 30);

-- 3. room + created_at 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created
  ON public.chat_messages (room, created_at DESC);

-- 4. INSERT RLS 업데이트 — 익명 허용 (Layer 4 에서 인증 강화)
DROP POLICY IF EXISTS "insert own messages" ON public.chat_messages;
CREATE POLICY "anyone can insert messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    char_length(content) BETWEEN 1 AND 500
  );

-- 5. Broadcast 트리거 업데이트 — 방별 토픽 (chat-scalper / chat-longterm / chat-us)
CREATE OR REPLACE FUNCTION public.chat_messages_broadcast()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'chat-' || COALESCE(NEW.room, 'scalper'),
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$;

-- 6. realtime.messages RLS — 방별 채널 수신 허용
DROP POLICY IF EXISTS "anon read chat-v3-global broadcast" ON realtime.messages;
DROP POLICY IF EXISTS "anon read chat broadcast" ON realtime.messages;

CREATE POLICY "anon read chat broadcast" ON realtime.messages
  FOR SELECT TO anon, authenticated
  USING (
    (SELECT realtime.topic()) IN ('chat-scalper', 'chat-longterm', 'chat-us')
    AND realtime.messages.extension = 'broadcast'
  );
