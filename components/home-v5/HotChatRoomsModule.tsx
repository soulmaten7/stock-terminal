"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { MessageCircle } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type ChatRoom = {
  symbol: string;
  message_count: number;
};

export default function HotChatRoomsModule() {
  const [items, setItems] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createAnonClient();
        // 24시간 안에 메시지가 가장 많은 종목 TOP 5
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from("chat_messages")
          .select("symbol")
          .not("symbol", "is", null)
          .gte("created_at", since);
        // 클라이언트에서 집계
        const counts: Record<string, number> = {};
        (data || []).forEach((r: { symbol: string | null }) => {
          if (r.symbol) counts[r.symbol] = (counts[r.symbol] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .map(([symbol, message_count]) => ({ symbol, message_count }))
          .sort((a, b) => b.message_count - a.message_count)
          .slice(0, 5);
        if (!cancelled) setItems(sorted);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
      <h3 className="text-sm font-semibold text-unjong-primary mb-2">💬 활발한 채팅방</h3>
      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState title="아직 종목별 채팅이 없습니다" />
      ) : (
        <ul className="space-y-1">
          {items.map((room) => (
            <li key={room.symbol}>
              <Link
                href={`/stock/${room.symbol}`}
                className="flex items-center justify-between text-sm py-1 px-2 hover:bg-unjong-background rounded"
              >
                <span className="font-mono text-unjong-primary">{room.symbol}</span>
                <span className="flex items-center gap-1 text-xs text-unjong-muted">
                  <MessageCircle size={10} /> {room.message_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
