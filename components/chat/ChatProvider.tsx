'use client';

/**
 * ChatProvider — 루트 레이아웃에 단 한 번 마운트.
 * 역할:
 *   1) 초기 메시지 로드 (최근 100개)
 *   2) Realtime Broadcast 구독 (chat-v3-global 토픽)
 *   3) Hot stocks 60초 폴링
 *   4) tagMap 1회 로드
 * UI 는 ChatSidebar / FloatingChat 이 chatStore 구독만으로 렌더.
 * 1400px 전후 viewport 변화에도 구독이 한 번만 유지돼서
 *   이중 WebSocket·초기 로드·깜빡임 방지.
 */

import { useEffect, useRef } from 'react';
import { useChatStore, type ChatMessage } from '@/stores/chatStore';
import { useTagMapStore } from '@/stores/tagMapStore';
import { createClient } from '@/lib/supabase/client';

export default function ChatProvider() {
  const { setMessages, addMessage, setHotStocks, setConnected } = useChatStore();
  const { loadTagMap } = useTagMapStore();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!supabaseRef.current && typeof window !== 'undefined') {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  // Initial load + Realtime Broadcast subscription
  useEffect(() => {
    if (!supabase) return;

    let active = true;

    supabase
      .from('chat_messages')
      .select('*')
      .eq('hidden', false)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }: { data: ChatMessage[] | null }) => {
        if (active && data) setMessages(data);
      });

    supabase.realtime.setAuth();

    const channel = supabase
      .channel('chat-v3-global', { config: { private: true } })
      .on(
        'broadcast',
        { event: 'INSERT' },
        (payload: { payload: { record?: ChatMessage } }) => {
          const msg = payload.payload?.record;
          if (msg && !msg.hidden) addMessage(msg);
        }
      )
      .subscribe((status: string) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [supabase, setMessages, addMessage, setConnected]);

  // Hot stocks polling (60s)
  useEffect(() => {
    const fetchHot = () => {
      fetch('/api/chat/hot-stocks')
        .then((r) => r.json())
        .then((d) => {
          if (d.hotStocks) setHotStocks(d.hotStocks);
        })
        .catch(() => {});
    };
    fetchHot();
    const t = setInterval(fetchHot, 60_000);
    return () => clearInterval(t);
  }, [setHotStocks]);

  // tagMap load (1회)
  useEffect(() => {
    loadTagMap();
  }, [loadTagMap]);

  return null;
}
