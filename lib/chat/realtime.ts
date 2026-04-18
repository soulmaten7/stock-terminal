import type { SupabaseClient } from '@supabase/supabase-js';

// V3: stock_tags 기반 단일 채널 구독
export function subscribeToChatGlobal(
  supabase: SupabaseClient,
  onMessage: (message: Record<string, unknown>) => void
) {
  return supabase
    .channel('chat-v3-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages' },
      (payload) => onMessage(payload.new)
    )
    .subscribe();
}

export function unsubscribeFromChat(supabase: SupabaseClient, channelName: string) {
  supabase.removeChannel(supabase.channel(channelName));
}
