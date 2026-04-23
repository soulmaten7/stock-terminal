'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, X } from 'lucide-react';
import Link from 'next/link';
import { useChatStore } from '@/stores/chatStore';
import ChatParticipantsModal, { type Participant } from '@/components/widgets/ChatParticipantsModal';

type ChatState = 'open' | 'closed';
type Position = 'left' | 'right';

const STATE_KEY = 'floating-chat-state';
const POS_KEY = 'floating-chat-position';

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

function renderWithTags(content: string) {
  const regex = /\$([A-Za-z0-9가-힣]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) parts.push(content.slice(lastIndex, match.index));
    const symbol = match[1];
    parts.push(
      <Link key={`tag-${key++}`} href={`/chart?symbol=${encodeURIComponent(symbol)}`}
        className="text-[#0ABAB5] font-bold hover:underline">
        ${symbol}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) parts.push(content.slice(lastIndex));
  return parts;
}

function nickFrom(uid: string | null): string {
  const NICKS = ['주식고수', '투자왕', '차트맨', '배당러버', '스윙왕', '퀀트맨', '바이더딥', '가치투자자', 'ETF부자', '인덱스투자'];
  if (!uid) return '익명';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = (hash * 31 + uid.charCodeAt(i)) & 0x7fffffff;
  return NICKS[hash % NICKS.length];
}

export default function FloatingChat() {
  const [mounted, setMounted] = useState(false);
  const [chatState, setChatState] = useState<ChatState>('open');
  const [position, setPosition] = useState<Position>('left');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const unreadCount = useChatStore((s) => s.unreadCount);
  const setPanelOpen = useChatStore((s) => s.setPanelOpen);
  const markAsRead = useChatStore((s) => s.markAsRead);
  const addMessage = useChatStore((s) => s.addMessage);

  // 초기화 — localStorage 복원
  useEffect(() => {
    setMounted(true);
    try {
      const s = localStorage.getItem(STATE_KEY);
      if (s === 'open' || s === 'closed') setChatState(s);
      const p = localStorage.getItem(POS_KEY);
      if (p === 'left' || p === 'right') setPosition(p);
    } catch {}
  }, []);

  // 상태 저장 + 스토어 동기화
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STATE_KEY, chatState);
      localStorage.setItem(POS_KEY, position);
    } catch {}
    const isOpen = chatState === 'open';
    setPanelOpen(isOpen);
    if (isOpen) markAsRead();
  }, [chatState, position, mounted, setPanelOpen, markAsRead]);

  // Supabase 인증 + 메시지 + Realtime
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (cancelled) return;
      setLoggedIn(!!data.user);
      setUserId(data.user?.id ?? null);
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_evt: AuthChangeEvent, session: Session | null) => {
      if (cancelled) return;
      setLoggedIn(!!session?.user);
      setUserId(session?.user?.id ?? null);
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
      .channel('floating-chat')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: { new: unknown }) => {
          const row = payload.new as ChatMsg;
          if (row.user_id) {
            setMessages((prev) => [...prev.slice(-99), row]);
            addMessage(row as Parameters<typeof addMessage>[0]);
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [addMessage]);

  // Presence
  useEffect(() => {
    if (!userId) { setParticipants([]); return; }
    const supabase = createClient();
    const nickname = nickFrom(userId);
    const presenceChannel = supabase.channel('chat-presence-float', {
      config: { presence: { key: userId } },
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const list: Participant[] = [];
        Object.values(state).forEach((metas: unknown) => {
          (metas as Participant[]).forEach((meta) => list.push(meta));
        });
        setParticipants(list);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: userId, nickname, online_at: new Date().toISOString() });
        }
      });
    return () => { supabase.removeChannel(presenceChannel); };
  }, [userId]);

  // 새 메시지 오면 스크롤 하단
  useEffect(() => {
    if (chatState === 'open' && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, chatState]);

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
        throw new Error((j as { error?: string }).error || `status ${res.status}`);
      }
      setInput('');
    } catch (ex) {
      setErr(String(ex instanceof Error ? ex.message : ex));
    } finally {
      setSending(false);
    }
  };

  if (!mounted) return null;

  const sideClass = position === 'left' ? 'left-0' : 'right-0';

  return (
    <div className="sticky bottom-0 left-0 right-0 pointer-events-none z-40 h-0">
      <div className={`absolute bottom-2 ${sideClass} pointer-events-auto`}>
        {chatState === 'closed' ? (
          <button
            onClick={() => setChatState('open')}
            aria-label="채팅 열기"
            className="w-14 h-14 rounded-full bg-[#0ABAB5] text-white shadow-lg flex items-center justify-center hover:bg-[#089693] transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#FF4D4D] text-white text-xs flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ) : (
          <div className="w-[320px] h-[440px] rounded-lg bg-white border border-[#E5E7EB] shadow-xl flex flex-col">
            {/* 헤더 */}
            <div className="h-10 border-b border-[#E5E7EB] flex items-center justify-between px-3 shrink-0 bg-[#FAFAFA] rounded-t-lg">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPosition('left')}
                  disabled={position === 'left'}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                    position === 'left'
                      ? 'bg-[#F3F4F6] text-[#999] cursor-default'
                      : 'text-[#0ABAB5] hover:bg-[#F0FDFC]'
                  }`}
                >
                  ◀ 좌측
                </button>
                <button
                  onClick={() => setPosition('right')}
                  disabled={position === 'right'}
                  className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                    position === 'right'
                      ? 'bg-[#F3F4F6] text-[#999] cursor-default'
                      : 'text-[#0ABAB5] hover:bg-[#F0FDFC]'
                  }`}
                >
                  우측 ▶
                </button>
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1 ml-1"
                  title="참여자 목록"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
                  <span className="text-[10px] text-[#999]">{participants.length}명</span>
                </button>
              </div>
              <button
                onClick={() => setChatState('closed')}
                aria-label="닫기"
                className="w-7 h-7 flex items-center justify-center text-[#666] hover:text-black hover:bg-[#F3F4F6] rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 메시지 목록 */}
            <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="text-[11px] text-[#999] text-center py-4">
                  아직 메시지가 없습니다. 첫 메시지를 남겨보세요.
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-bold text-[#0ABAB5]">{m.nickname || nickFrom(m.user_id)}</span>
                    <span className="text-[10px] text-[#BBB]">{fmtTime(m.created_at)}</span>
                  </div>
                  <p className="text-xs text-[#333] leading-snug break-all">{renderWithTags(m.content)}</p>
                </div>
              ))}
            </div>

            {/* 입력창 */}
            <form onSubmit={handleSend} className="border-t border-[#F0F0F0] bg-white px-3 py-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={loggedIn ? '메시지 입력… ($종목명 태그 지원)' : '로그인 후 채팅 참여'}
                disabled={!loggedIn || sending}
                maxLength={500}
                className={`w-full text-sm border border-[#E5E7EB] rounded px-2.5 py-1.5 ${
                  loggedIn
                    ? 'bg-white text-black focus:outline-none focus:ring-1 focus:ring-[#0ABAB5]'
                    : 'bg-[#F8F9FA] text-[#999] cursor-not-allowed'
                }`}
              />
              {err && <p className="text-[10px] text-[#C33] mt-1">⚠ {err}</p>}
            </form>
          </div>
        )}
      </div>
      <ChatParticipantsModal open={modalOpen} onClose={() => setModalOpen(false)} participants={participants} />
    </div>
  );
}
