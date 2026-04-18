-- ============================================================
-- 009: chat_messages → Realtime Broadcast (2026-03 신 패턴)
-- ============================================================
--
-- 배경:
-- 2026-03-26 Supabase Realtime 업데이트 이후 postgres_changes 는 deprecated.
-- 권장 방식은 "Broadcast from Database" — 트리거가 realtime.broadcast_changes()
-- 를 호출 → realtime.messages 로 insert → 클라이언트는 private 채널로 수신.
-- 기존 ALTER PUBLICATION supabase_realtime ADD TABLE (mig 005) 은 호환을 위해 둠.
--
-- 토픽: 'chat-v3-global' (전역 단일 채팅)
-- 이벤트: INSERT / UPDATE / DELETE — payload.record / payload.old_record 로 접근
-- ============================================================

-- 1) 트리거 함수 — INSERT/UPDATE/DELETE 발생 시 chat-v3-global 토픽으로 브로드캐스트
create or replace function public.chat_messages_broadcast()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'chat-v3-global'::text,  -- topic
    TG_OP,                    -- event (INSERT/UPDATE/DELETE)
    TG_OP,                    -- operation
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  return null;
end;
$$;

-- 2) 트리거 연결 — after insert or update or delete, row level
drop trigger if exists on_chat_messages_broadcast on public.chat_messages;

create trigger on_chat_messages_broadcast
after insert or update or delete
on public.chat_messages
for each row
execute function public.chat_messages_broadcast();

-- 3) realtime.messages RLS — anon/authenticated 가 chat-v3-global 토픽 수신 허용
--    실시간 채팅은 모두에게 공개 (V3 스펙: 무료 + 로그인 없이 읽기 가능)
drop policy if exists "anon read chat-v3-global broadcast" on realtime.messages;

create policy "anon read chat-v3-global broadcast"
on realtime.messages
for select
to anon, authenticated
using (
  (select realtime.topic()) = 'chat-v3-global'
  and realtime.messages.extension = 'broadcast'
);
