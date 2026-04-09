'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MessageCircle, X, Minus, Send } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { createClient } from '@/lib/supabase/client';
import { checkMessage } from '@/lib/chat/moderation';
import { formatTime } from '@/lib/utils/format';
import type { ChatRoom, ChatMessage } from '@/types/chat';
import Link from 'next/link';

const ROOMS: { key: ChatRoom; label: string }[] = [
  { key: 'general', label: '전체' },
  { key: 'kospi', label: '코스피' },
  { key: 'nasdaq', label: '나스닥' },
  { key: 'free', label: '자유' },
];

export default function FloatingChat() {
  const { user } = useAuthStore();
  const { messages, currentRoom, isOpen, onlineCount, setMessages, addMessage, setRoom, setOpen, setOnlineCount } = useChatStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current && typeof window !== 'undefined') {
    supabaseRef.current = createClient();
  }
  const supabase = supabaseRef.current;

  // 메시지 로드 및 실시간 구독
  useEffect(() => {
    if (!isOpen || !supabase) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room', currentRoom)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };

    loadMessages();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`float-chat-${currentRoom}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${currentRoom}` },
          (payload: { new: ChatMessage }) => {
            addMessage(payload.new as ChatMessage);
          }
        );
      channel.subscribe();
    } catch {}

    return () => {
      if (channel) { try { supabase.removeChannel(channel); } catch {} }
    };
  }, [isOpen, currentRoom, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !supabase) return;

    const result = checkMessage(input.trim());
    if (!result.allowed) {
      setError(result.reason || '전송할 수 없는 메시지입니다');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const { error: insertError } = await supabase.from('chat_messages').insert({
      user_id: user.id,
      nickname: user.nickname,
      room: currentRoom,
      content: input.trim(),
    });

    if (!insertError) {
      setInput('');
      setError('');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-50 w-14 h-14 bg-accent rounded-full flex items-center justify-center shadow-lg hover:bg-accent/90 transition-colors group"
        title="실시간 채팅"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {onlineCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-up rounded-full text-white text-xs flex items-center justify-center font-bold">
            {onlineCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[400px] bg-white  border border-border shadow-2xl flex flex-col overflow-hidden"
      style={{ height: minimized ? '48px' : '500px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 bg-[#F0F2F5] border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-accent" />
          <span className="font-medium text-sm">실시간 채팅</span>
          <span className="text-xs text-text-secondary">{onlineCount}명 접속</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(!minimized)} className="p-1 hover:bg-dark-600 rounded">
            <Minus className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-dark-600 rounded">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Room Tabs */}
          <div className="flex border-b border-border shrink-0">
            {ROOMS.map((room) => (
              <button
                key={room.key}
                onClick={() => setRoom(room.key)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  currentRoom === room.key
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {room.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-text-secondary text-xs py-8">아직 메시지가 없습니다</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="font-semibold text-accent/80">{msg.nickname}</span>
                <span className="text-text-secondary text-xs ml-2">{formatTime(msg.created_at)}</span>
                <p className="text-text-primary/90 mt-0.5">{msg.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 shrink-0">
            {error && <p className="text-up text-xs mb-2">{error}</p>}
            {!user ? (
              <div className="text-center">
                <p className="text-text-secondary text-xs mb-2">채팅에 참여하려면 로그인하세요</p>
                <Link href="/auth/login" className="text-accent text-sm hover:underline">
                  로그인
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="메시지를 입력하세요"
                  className="flex-1 px-3 py-2 bg-dark-800 border border-border  text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleSend}
                  className="px-3 py-2 bg-accent  hover:bg-accent/90"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
