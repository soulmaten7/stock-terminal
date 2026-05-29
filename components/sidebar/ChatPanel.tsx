"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useNickname } from "@/stores/nicknameStore";

type ChatMessage = {
  id: string;
  room: string;
  nickname: string;
  content: string;
  created_at: string;
};

const ROOM_META: Record<string, { window: string; emoji: string }> = {
  scalper:  { window: "단타창",      emoji: "⚡" },
  longterm: { window: "장타창",      emoji: "🌳" },
  us:       { window: "미국주식창",  emoji: "🌙" },
};

function getRoomKey(pathname: string | null): "scalper" | "longterm" | "us" {
  if (pathname?.startsWith("/longterm")) return "longterm";
  if (pathname?.startsWith("/us")) return "us";
  return "scalper";
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

export function ChatPanel() {
  const pathname = usePathname();
  const room = getRoomKey(pathname);
  const ctx = ROOM_META[room];

  const nickname = useNickname((s) => s.nickname);
  const ensureNickname = useNickname((s) => s.ensureNickname);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 0. Hydration 안전 — 클라이언트 마운트 후 닉네임 보장 (SSR 시 nickname="" 유지)
  useEffect(() => {
    setMounted(true);
    ensureNickname();
  }, [ensureNickname]);

  // 1. 과거 메시지 로드 (room 변경 시 재실행)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMessages([]);

    const load = async () => {
      try {
        let supabase;
        try {
          supabase = createClient();
        } catch (err) {
          console.error("[chat] createClient failed", err);
          if (mounted) setLoading(false);
          return;
        }

        console.log("[chat] loading messages for room:", room);
        const { data, error } = await supabase
          .from("chat_messages")
          .select("id, room, nickname, content, created_at")
          .eq("room", room)
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(100);

        if (!mounted) return;

        if (error) {
          console.error("[chat] supabase select error", error);
        } else if (data) {
          console.log("[chat] loaded", data.length, "messages");
          setMessages([...data].reverse() as ChatMessage[]);
        }
        setLoading(false);
      } catch (err) {
        console.error("[chat] unexpected error during load", err);
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [room]);

  // 2. Realtime subscribe — postgres_changes (supabase_realtime publication)
  useEffect(() => {
    let supabase;
    try { supabase = createClient(); } catch { return; }

    const channel = supabase
      .channel(`chat-room-${room}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room=eq.${room}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const msg = payload.new as ChatMessage;
          if (!msg?.id) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room]);

  // 3. 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 4. 메시지 전송
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    let supabase;
    try { supabase = createClient(); } catch { return; }

    setSending(true);
    const safeNickname = nickname || "익명";
    const { error } = await supabase.from("chat_messages").insert({
      room,
      nickname: safeNickname,
      content: trimmed,
    });

    if (!error) {
      setInput("");
    } else {
      console.warn("[chat] send failed", error.message);
    }
    setSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col min-h-0 bg-unjong-surface">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>{ctx.emoji}</span>
          <span className="text-sm font-semibold text-unjong-primary">
            {ctx.window} 채팅
          </span>
        </div>
        <span
          className="text-[10px] text-unjong-muted truncate ml-2"
          title={mounted ? nickname : ""}
          suppressHydrationWarning
        >
          {mounted ? nickname : ""}
        </span>
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {loading ? (
          <div className="text-center text-[10px] text-unjong-muted italic py-4">
            ⏳ 채팅 로딩 중...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[10px] text-unjong-muted italic py-4">
            첫 메시지를 남겨보세요. {ctx.window} 트레이더와 대화 시작.
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs font-semibold text-unjong-primary">
                  {msg.nickname ?? "익명"}
                </span>
                <span className="text-[10px] text-unjong-muted">
                  {formatTime(msg.created_at)}
                </span>
              </div>
              <p className="text-xs text-unjong-primary leading-snug pl-1">
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 입력창 */}
      <div className="border-t border-unjong-border bg-unjong-background p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 rounded-md border border-unjong-border bg-unjong-surface px-2 py-1.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`${ctx.window}에 메시지...`}
            maxLength={500}
            className="flex-1 bg-transparent text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            aria-label="채팅 입력"
            disabled={sending}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
