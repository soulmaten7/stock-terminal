'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { createClient } from '@/lib/supabase/client';
import { checkMessage } from '@/lib/chat/moderation';
import { formatTime } from '@/lib/utils/format';
import type { ChatMessage } from '@/types/chat';
import Link from 'next/link';

export default function SidebarChat() {
  const { user } = useAuthStore();
  const { messages, currentRoom, onlineCount, setMessages, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current && typeof window !== 'undefined') { supabaseRef.current = createClient(); }
  const supabase = supabaseRef.current;

  useEffect(() => {
    if (!supabase) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const loadMessages = async () => {
      try {
        const { data } = await supabase.from('chat_messages').select('*').eq('room', currentRoom).eq('is_deleted', false).order('created_at', { ascending: true }).limit(50);
        if (data) setMessages(data);
      } catch {}
    };
    loadMessages();
    try {
      const channelName = `sidebar-chat-${currentRoom}-${Date.now()}`;
      channel = supabase.channel(channelName)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room=eq.${currentRoom}` },
          (payload: { new: ChatMessage }) => { addMessage(payload.new as ChatMessage); });
      channel.subscribe();
    } catch {}
    return () => { if (channel) { try { supabase.removeChannel(channel); } catch {} } };
  }, [currentRoom, supabase, setMessages, addMessage]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user || !supabase) return;
    if (input.trim().length > 200) { setError('메시지는 200자 이내로 입력해주세요'); setTimeout(() => setError(''), 3000); return; }
    const result = checkMessage(input.trim());
    if (!result.allowed) { setError(result.reason || '전송할 수 없는 메시지입니다'); setTimeout(() => setError(''), 3000); return; }
    const { error: insertError } = await supabase.from('chat_messages').insert({ user_id: user.id, nickname: user.nickname, room: currentRoom, content: input.trim() });
    if (!insertError) { setInput(''); setError(''); }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border-[3px] border-[#0ABAB5] overflow-hidden">
      <div className="flex items-center justify-between px-4 h-11 bg-white border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-3.5 h-3.5 text-black" />
          <span className="font-bold text-sm text-black">실시간 채팅</span>
        </div>
        <div className="flex items-center gap-1 text-black">
          <Users className="w-3 h-3" />
          <span className="text-xs font-bold">{onlineCount || 0}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-6 h-6 text-[#999999] mb-2" />
            <p className="text-[#999999] text-xs font-medium">아직 메시지가 없습니다</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm leading-relaxed">
            <span className="font-bold text-[#0ABAB5]">{msg.nickname}</span>
            <span className="text-[#999999] ml-1.5 text-xs">{formatTime(msg.created_at)}</span>
            <p className="text-black font-medium mt-0.5 break-words">{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[#E5E7EB] p-2.5 shrink-0 bg-white">
        {error && <p className="text-[#FF4D4D] text-xs mb-1.5 font-bold">{error}</p>}
        {!user ? (
          <div className="text-center py-2">
            <p className="text-black text-xs font-bold mb-1.5">로그인 후 참여하세요</p>
            <Link href="/auth/login" className="text-[#0ABAB5] text-xs hover:underline font-bold">로그인</Link>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="메시지 입력"
              className="flex-1 px-2.5 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-sm text-black font-medium placeholder:text-[#999999] focus:outline-none focus:border-[#0ABAB5]" />
            <button onClick={handleSend} className="px-2.5 py-1.5 bg-[#0ABAB5] hover:bg-[#088F8C] shrink-0">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
