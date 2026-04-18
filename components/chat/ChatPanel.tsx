'use client';

/**
 * ChatPanel — 재사용 가능한 채팅 UI.
 * ChatSidebar (1400px+) / FloatingChat (1400px-) 양쪽에서 렌더.
 * 데이터·구독은 ChatProvider 가 전담. 여기는 순수 UI + 메시지 전송만.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Send, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useWatchlistStore } from '@/stores/watchlistStore';
import { useTagMapStore } from '@/stores/tagMapStore';

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

interface ChatPanelProps {
  /** 상단 닫기 버튼 렌더 여부 (FloatingChat 에서만 true) */
  onClose?: () => void;
}

export default function ChatPanel({ onClose }: ChatPanelProps = {}) {
  const { user } = useAuthStore();
  const { messages, filter, hotStocks, isConnected, setFilter } = useChatStore();
  const { items: watchlist } = useWatchlistStore();
  const { tagMap } = useTagMapStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지 들어오면 맨 아래로 스크롤
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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#E5E7EB] bg-[#F5F5F5] shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm text-black">실시간 채팅</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px]">
              {isConnected ? (
                <><Wifi className="w-3 h-3 text-[#0ABAB5]" /><span className="text-[#0ABAB5]">연결됨</span></>
              ) : (
                <><WifiOff className="w-3 h-3 text-[#999999]" /><span className="text-[#999999]">연결 중...</span></>
              )}
            </div>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="채팅 닫기"
                className="text-[#999999] hover:text-black text-lg leading-none w-5 h-5 flex items-center justify-center"
              >
                ×
              </button>
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
    </div>
  );
}
