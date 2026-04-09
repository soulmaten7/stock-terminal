import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatRoom } from '@/types/chat';

export function subscribeToChatRoom(
  supabase: SupabaseClient,
  room: ChatRoom,
  onMessage: (message: Record<string, unknown>) => void
) {
  return supabase
    .channel(`chat:${room}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room=eq.${room}`,
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe();
}

export function unsubscribeFromChat(supabase: SupabaseClient, room: ChatRoom) {
  supabase.removeChannel(supabase.channel(`chat:${room}`));
}
