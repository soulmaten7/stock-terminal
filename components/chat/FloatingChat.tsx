'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, Minus } from 'lucide-react';
import Link from 'next/link';
import { useChatStore } from '@/stores/chatStore';
import ChatParticipantsModal, { type Participant } from '@/components/widgets/ChatParticipantsModal';

type ChatState = 'open' | 'minimized';

const STATE_KEY = 'floating-chat-state';
const POS_KEY = 'floating-chat-pos';
const PANEL_W = 320;
const PANEL_H = 440;

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
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const unreadCount = useChatStore((s) => s.unreadCount);
  const setPanelOpen = useChatStore((s) => s.setPanelOpen);
  const markAsRead = useChatStore((s) => s.markAsRead);
  const addMessage = useChatStore((s) => s.addMessage);

  // 초기화 — localStorage 복원
  useEffect(() => {
    setMounted(true);
    try {
      const s = localStorage.getItem(STATE_KEY);
      if (s === 'open' || s === 'minimized') setChatState(s);
      const p = localStorage.getItem(POS_KEY);
      if (p) {
        const parsed = JSON.parse(p) as { x?: unknown; y?: unknown };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') setPos(parsed as { x: number; y: number });
      }
    } catch {}
  }, []);

  // 상태 저장 + 스토어 동기화
  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(STATE_KEY, chatState); } catch {}
    const isOpen = chatState === 'open';
    setPanelOpen(isOpen);
    if (isOpen) markAsRead();
  }, [chatState, mounted, setPanelOpen, markAsRead]);

  // 위치 저장
  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch {}
  }, [pos, mounted]);

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

  // 드래그 핸들러
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const maxX = window.innerWidth - PANEL_W;
      const maxY = window.innerHeight - PANEL_H;
      setPos({
        x: Math.max(0, Math.min(maxX, dragRef.current.origX - dx)),
        y: Math.max(0, Math.min(maxY, dragRef.current.origY - dy)),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!mounted) return null;

  // ── 접힘 — 하단 가로 바 ──────────────────────────────────────────────────
  if (chatState === 'minimized') {
    return (
      <div
        className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-[#E5E7EB] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] flex items-center justify-between px-4"
        style={{ height: 40 }}
      >
        <button
          onClick={() => setChatState('open')}
          className="flex items-center gap-2 text-sm text-[#222] hover:text-[#0ABAB5] transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-[#0ABAB5]" />
          <span className="font-medium">마켓 채팅</span>
          {unreadCount > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF4D4D] text-white text-[10px] flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="text-[11px] text-[#BBB]">클릭하여 펼치기</span>
        </button>
        <span className="text-[11px] text-[#999]">{participants.length}명 온라인</span>
      </div>
    );
  }

  // ── 열림 — 드래그 가능 패널 ───────────────────────────────────────────────
  return (
    <>
      <div
        className="fixed z-40 bg-white border border-[#E5E7EB] rounded-lg shadow-xl flex flex-col"
        style={{ right: pos.x, bottom: pos.y, width: PANEL_W, height: PANEL_H }}
      >
        {/* 드래그 핸들 = 헤더 */}
        <div
          onMouseDown={onMouseDown}
          className="h-10 border-b border-[#E5E7EB] flex items-center justify-between px-3 cursor-move select-none bg-[#FAFAFA] rounded-t-lg shrink-0"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#0ABAB5]" />
            <span className="text-sm font-semibold text-[#222]">마켓 채팅</span>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1 ml-1"
              title="참여자 목록"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3B30] animate-pulse" />
              <span className="text-[10px] text-[#999]">{participants.length}명</span>
            </button>
          </div>
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setChatState('minimized')}
            aria-label="하단으로 내리기"
            className="w-7 h-7 flex items-center justify-center text-[#666] hover:text-black hover:bg-[#F3F4F6] rounded"
          >
            <Minus className="w-4 h-4" />
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

      <ChatParticipantsModal open={modalOpen} onClose={() => setModalOpen(false)} participants={participants} />
    </>
  );
}
