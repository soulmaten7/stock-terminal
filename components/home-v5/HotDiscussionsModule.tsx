"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { Heart, MessageCircle } from "lucide-react";

type Discussion = {
  id: string;
  symbol: string;
  nickname: string;
  tier: number;
  content: string;
  like_count: number;
  comment_count: number;
  created_at: string;
};

export default function HotDiscussionsModule() {
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("discussions")
          .select("id, symbol, nickname, tier, content, like_count, comment_count, created_at")
          .eq("hidden", false)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order("like_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10);
        if (!cancelled) setItems(data || []);
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
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-unjong-primary flex items-center gap-1.5">
          🔥 HOT 토론 <span className="text-[10px] text-unjong-muted font-normal">24시간 좋아요 순</span>
        </h2>
        <span className="text-[10px] text-unjong-muted italic">실시간</span>
      </header>

      {loading ? (
        <div className="text-center text-xs text-unjong-muted py-4">⏳ 로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-xs text-unjong-muted py-4">
          첫 토론을 남겨보세요. 종목 페이지에서 작성 가능.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((d) => {
            const tierEmoji = d.tier === 3 ? "🏆" : d.tier === 2 ? "✓" : "";
            return (
              <li key={d.id}>
                <Link
                  href={`/stock/${d.symbol}`}
                  className="block bg-unjong-background rounded p-3 hover:border-unjong-accent border border-transparent transition-colors"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                        {d.symbol}
                      </span>
                      <span className="text-xs font-medium text-unjong-primary">
                        {tierEmoji} {d.nickname}
                      </span>
                    </div>
                    <span className="text-[10px] text-unjong-muted">
                      {new Date(d.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-unjong-primary truncate">{d.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-unjong-muted">
                      <Heart size={10} /> {d.like_count}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-unjong-muted">
                      <MessageCircle size={10} /> {d.comment_count}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
