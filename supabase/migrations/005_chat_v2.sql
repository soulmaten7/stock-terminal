-- ============================================================
-- V3 Chat: stock_tags 기반 단일 채팅 (기존 room 기반 테이블 교체)
-- ============================================================

-- 기존 room 기반 테이블 제거 (개발 환경 only)
DROP TABLE IF EXISTS public.chat_reports CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_penalties CASCADE;

-- 신규 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  stock_tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  hidden boolean DEFAULT false,
  report_count int DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON public.chat_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_stock_tags
  ON public.chat_messages USING gin (stock_tags);

-- 신고 테이블
CREATE TABLE IF NOT EXISTS public.chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, reporter_id)
);

-- RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read visible chat messages"
  ON public.chat_messages FOR SELECT
  USING (hidden = false);

CREATE POLICY "insert own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
