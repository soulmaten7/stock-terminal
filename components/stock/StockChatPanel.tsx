"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useNickname } from "@/stores/nicknameStore";
import { LoadingState, EmptyState } from "@/components/ui/State";

type ChatMessage = {
  id: string;
  symbol: string | null;
  nickname: string;
  content: string;
  created_at: string;
};

type Props = { symbol: string; stockName?: string };

export default function StockChatPanel({ symbol, stockName }: Props) {
  const nickname = useNickname((s) => s.nickname);
  const ensureNickname = useNickname((s) => s.ensureNickname);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    ensureNickname();
  }, [ensureNickname]);

  useEffect(() => {
    let mounted2 = true;
    setLoading(true);
    setMessages([]);

    const load = async () => {
      try {
        const supabase = createAnonClient();
        const queryPromise = supabase
          .from("chat_messages")
          .select("id, symbol, nickname, content, created_at")
          .eq("symbol", symbol)
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(100);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        );
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>;
        if (!mounted2) return;
        if (!error && data) setMessages([...data].reverse() as ChatMessage[]);
      } catch {
        /* 무시 */
      } finally {
        if (mounted2) setLoading(false);
      }
    };
    load();
    return () => { mounted2 = false; };
  }, [symbol]);

  useEffect(() => {
    const supabase = createAnonClient();
    const channel = supabase
      .channel(`chat-stock-${symbol}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `symbol=eq.${symbol}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const msg = payload.new as ChatMessage;
          if (!msg?.id) return;
          setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [symbol]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const supabase = createAnonClient();
    const safeNickname = nickname || "익명";
    const { error } = await supabase.from("chat_messages").insert({
      symbol,
      room: "general",  // backward compat
      nickname: safeNickname,
      content: trimmed,
    });
    if (!error) setInput("");
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col bg-unjong-surface rounded-lg border border-unjong-border h-[calc(100vh-2rem)] overflow-hidden">
      <header className="flex items-center justify-between border-b border-unjong-border px-4 py-3 bg-unjong-background flex-shrink-0">
        <span className="text-sm font-semibold text-unjong-primary">⚡ {stockName || symbol} 실시간 채팅</span>
        <span className="text-xs text-unjong-muted truncate ml-2" suppressHydrationWarning>
          {mounted ? nickname : ""}
        </span>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        {loading ? (
          <LoadingState />
        ) : messages.length === 0 ? (
          <EmptyState icon="💬" title="첫 메시지를 남겨보세요" description={`${stockName || symbol} 트레이더와 실시간 대화.`} />
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-unjong-primary">{msg.nickname}</span>
                <span className="text-xs text-unjong-muted">
                  {new Date(msg.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
              <p className="text-sm text-unjong-primary pl-1">{msg.content}</p>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-unjong-border bg-unjong-background p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 rounded-md border border-unjong-border bg-unjong-surface px-2 py-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${stockName || symbol} 채팅...`}
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled={sending}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
