'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import WidgetCard from '@/components/home/WidgetCard';

interface ChatMsg {
  id: string;
  user_id: string | null;
  content: string;
  stock_tags: string[];
  created_at: string;
  nickname?: string;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function nickFrom(uid: string | null): string {
  const NICKS = ['주식고수', '투자왕', '차트맨', '배당러버', '스윙왕', '퀀트맨', '바이더딥', '가치투자자', 'ETF부자', '인덱스투자'];
  if (!uid) return '익명';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) & 0x7fffffff;
  return NICKS[hash % NICKS.length];
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }: { data: { user: unknown } }) => {
      if (!cancelled) setLoggedIn(!!data.user);
    });
    const { data: authSub } = supabase.auth.onAuthStateChange((_evt: AuthChangeEvent, session: Session | null) => {
      if (!cancelled) setLoggedIn(!!session?.user);
    });

    supabase
      .from('chat_messages')
      .select('id,user_id,content,stock_tags,created_at')
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }: { data: ChatMsg[] | null }) => {
        if (cancelled || !data) return;
        setMessages(data.reverse());
      });

    const channel = supabase
      .channel('chat-sidebar')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: { new: unknown }) => {
          const row = payload.new as ChatMsg;
          if (row.user_id) {
            setMessages((prev) => [...prev.slice(-99), row]);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    setErr(null);
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `status ${res.status}`);
      }
      setInput('');
    } catch (ex) {
      setErr(String(ex instanceof Error ? ex.message : ex));
    } finally {
      setSending(false);
    }
  };

  return (
    <WidgetCard
      title="마켓 채팅"
      subtitle="Supabase Realtime"
      action={
        <div className="flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
          <span className="text-[10px] text-[#FF3B30] font-bold">Live</span>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-[11px] text-[#999] text-center py-4">
              아직 메시지가 없습니다. 첫 메시지를 남겨보세요.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-bold text-[#0ABAB5]">
                  {m.nickname || nickFrom(m.user_id)}
                </span>
                <span className="text-xs text-[#BBBBBB]">{fmtTime(m.created_at)}</span>
              </div>
              <p className="text-sm text-[#333] leading-snug break-all">{m.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="sticky bottom-0 border-t border-[#F0F0F0] bg-white px-3 py-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={loggedIn ? '메시지 입력… ($종목명 태그 지원)' : '로그인 후 채팅 참여'}
            disabled={!loggedIn || sending}
            maxLength={500}
            className={`w-full text-sm border border-[#E5E7EB] rounded px-2.5 py-2 ${
              loggedIn
                ? 'bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]'
                : 'bg-[#F8F9FA] text-[#999] cursor-not-allowed'
            }`}
          />
          {err && <p className="text-[10px] text-[#C33] mt-1">⚠ {err}</p>}
        </form>
      </div>
    </WidgetCard>
  );
}
