"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useNickname } from "@/stores/nicknameStore";
import { LoadingState, EmptyState } from "@/components/ui/State";

type ChatMessage = { id: string; nickname: string; content: string; created_at: string };

const ROOM = "HOME";

export default function HomeLiveChat() {
  const nickname = useNickname((s) => s.nickname);
  const ensureNickname = useNickname((s) => s.ensureNickname);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); ensureNickname(); }, [ensureNickname]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createAnonClient();
        const { data, error } = await supabase
          .from("chat_messages")
          .select("id, nickname, content, created_at")
          .eq("symbol", ROOM)
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(100);
        if (alive && !error && data) setMessages([...data].reverse() as ChatMessage[]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const supabase = createAnonClient();
    const channel = supabase
      .channel(`chat-${ROOM}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `symbol=eq.${ROOM}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const msg = payload.new as ChatMessage;
          if (!msg?.id) return;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const supabase = createAnonClient();
    const { error } = await supabase.from("chat_messages").insert({
      symbol: ROOM,
      room: "general",
      nickname: nickname || "익명",
      content: trimmed,
    });
    if (!error) setInput("");
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-[46vh] flex-col overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <header className="flex shrink-0 items-center justify-between border-b border-unjong-border bg-unjong-background px-4 py-3">
        <span className="text-sm font-semibold text-unjong-primary">⚡ 실시간채팅</span>
        <span className="ml-2 truncate text-xs text-unjong-muted" suppressHydrationWarning>{mounted ? nickname : ""}</span>
      </header>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {loading ? (
          <LoadingState />
        ) : messages.length === 0 ? (
          <EmptyState icon="💬" title="첫 메시지를 남겨보세요" description="장 보면서 편하게 얘기해요." />
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-unjong-primary">{msg.nickname}</span>
                <span className="text-xs text-unjong-muted">
                  {new Date(msg.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
              <p className="pl-1 text-sm text-unjong-primary">{msg.content}</p>
            </div>
          ))
        )}
      </div>
      <div className="shrink-0 border-t border-unjong-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-unjong-border bg-unjong-background px-3 py-2 transition-colors focus-within:border-unjong-accent">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="실시간채팅 메시지 입력..."
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled={sending}
          />
          <button type="button" onClick={sendMessage} disabled={sending || !input.trim()} className="shrink-0 text-unjong-muted hover:text-unjong-accent disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
