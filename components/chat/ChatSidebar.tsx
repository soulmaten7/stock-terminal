'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Send, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore, type ChatMessage } from '@/stores/chatStore';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { useTagMapStore } from '@/stores/tagMapStore';
import { createClient } from '@/lib/supabase/client';

// $토큰 분리용 — 한글·영문·숫자. 예: $삼성전자, $005930, $NAVER
const CONTENT_SPLIT_REGEX = /(\$[가-힣A-Za-z0-9]+)/g;
const TOKEN_MATCH_REGEX = /^\$([가-힣A-Za-z0-9]+)$/;

function resolveSymbol(token: string, tagMap: Record<string, string>): string | null {
  if (/^\d{6}$/.test(token)) return token;
  return tagMap[token] ?? null;
}

function parseContent(content: string, tagMap: Record<string, string>) {
  const parts = content.split(CONTENT_SPLIT_REGEX);
  return parts.map((part, i) => {
    const match = part.match(TOKEN_MATCH_REGEX);
    if (match) {
      const symbol = resolveSymbol(match[1], tagMap);
      if (symbol) {
        return (
          <Link
            key={i}
            href={`/stocks/${symbol}`}
            className="text-[#0ABAB5] hover:underline font-bold"
          >
            {part}
          </Link>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatSidebar() {
  const { user } = useAuthStore();
  const { messages, filter, hotStocks, isConnected, setMessages, addMessage, setFilter, setHotStocks, setConnected } = useChatStore();
  const { items: watchlist } = useWatchlistStore();
  const { tagMap, loadTagMap } = useTagMapStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  if (!supabaseRef.current && typeof window !== 'undefined') {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  // Initial load + Realtime subscription (Broadcast-from-DB 패턴)
  // 2026-03 Supabase Realtime 업데이트 이후 postgres_changes → broadcast 전환.
  // DB 트리거 on_chat_messages_broadcast 가 realtime.broadcast_changes() 호출 →
  // 이 채널에서 'broadcast' 이벤트로 수신.
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

    // private 채널은 realtime.setAuth() 가 선행돼야 함. anon 세션도 정상 동작.
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
  }, [supabase]);

  // Hot stocks polling (60s)
  useEffect(() => {
    const fetchHot = () => {
      fetch('/api/chat/hot-stocks')
        .then((r) => r.json())
        .then((d) => { if (d.hotStocks) setHotStocks(d.hotStocks); })
        .catch(() => {});
    };
    fetchHot();
    const t = setInterval(fetchHot, 60_000);
    return () => clearInterval(t);
  }, []);

  // Tag map 로드 — 종목명 → symbol 매핑 (채팅 렌더링에 사용)
  useEffect(() => {
    loadTagMap();
  }, [loadTagMap]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    setError('');
    try {
      const r = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? '전송 실패');
        setTimeout(() => setError(''), 3000);
      } else {
        setInput('');
      }
    } catch {
      setError('네트워크 오류');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSending(false);
    }
  };

  // Filter messages
  const filtered = useMemo(() => {
    if (filter === 'all') return messages;
    if (filter === 'hot') {
      const hotSet = new Set(hotStocks.map((s) => s.symbol));
      return messages.filter((m) => m.stock_tags.some((t) => hotSet.has(t)));
    }
    if (filter === 'watchlist') {
      const wlSet = new Set(watchlist.map((s) => s.symbol));
      return messages.filter((m) => m.stock_tags.some((t) => wlSet.has(t)));
    }
    return messages;
  }, [messages, filter, hotStocks, watchlist]);

  return (
    <aside className="hidden min-[1400px]:flex w-[320px] shrink-0 flex-col bg-white border-r border-[#E5E7EB] sticky top-0 h-screen z-10">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#F5F5F5] shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm text-black">실시간 채팅</span>
          <div className="flex items-center gap-1 text-[10px]">
            {isConnected ? (
              <><Wifi className="w-3 h-3 text-[#0ABAB5]" /><span className="text-[#0ABAB5]">연결됨</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-[#999999]" /><span className="text-[#999999]">연결 중...</span></>
            )}
          </div>
        </div>
        {hotStocks.length > 0 && (
          <div className="flex gap-1 overflow-x-auto">
            {hotStocks.map((s) => (
              <Link
                key={s.symbol}
                href={`/stocks/${s.symbol}`}
                className="shrink-0 px-1.5 py-0.5 bg-[#FF3B30]/10 text-[#FF3B30] text-[10px] font-bold rounded hover:bg-[#FF3B30]/20"
              >
                🔥 ${s.symbol}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-[#E5E7EB] shrink-0">
        {(['all', 'watchlist', 'hot'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-bold transition-colors ${
              filter === f
                ? 'text-[#0ABAB5] border-b-2 border-[#0ABAB5] bg-white'
                : 'text-[#999999] hover:text-black'
            }`}
          >
            {f === 'all' ? '전체' : f === 'watchlist' ? '관심' : '인기'}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {filtered.length === 0 && (
          <p className="text-center text-[#999999] text-xs py-8">
            {filter === 'hot' ? '인기 종목 메시지가 없습니다' :
             filter === 'watchlist' ? '관심종목 메시지가 없습니다' :
             '아직 메시지가 없습니다'}
          </p>
        )}
        {filtered.map((msg) => (
          <div key={msg.id} className="text-xs border-b border-[#F5F5F5] pb-1.5">
            <span className="text-[#999999] text-[10px]">{formatTime(msg.created_at)}</span>
            <p className="text-black leading-relaxed mt-0.5 break-words">
              {parseContent(msg.content, tagMap)}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E5E7EB] p-2 shrink-0">
        {error && <p className="text-[#FF3B30] text-[10px] mb-1">{error}</p>}
        {!user ? (
          <div className="text-center py-2">
            <p className="text-[#999999] text-xs mb-1">로그인하면 채팅 가능</p>
            <Link href="/auth/login" className="text-[#0ABAB5] text-xs font-bold hover:underline">
              로그인 →
            </Link>
          </div>
        ) : (
          <div className="flex gap-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="$삼성전자 또는 $005930 으로 태그"
              maxLength={500}
              className="flex-1 px-2 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-xs focus:outline-none focus:border-[#0ABAB5]"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="px-2 py-1.5 bg-[#0ABAB5] text-white disabled:opacity-40 hover:bg-[#099b96]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
