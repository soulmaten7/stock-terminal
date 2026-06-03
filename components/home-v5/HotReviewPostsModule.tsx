"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type ReviewPost = {
  id: string;
  target_type: "product" | "room";
  target_id: string;
  nickname: string;
  tier: number;
  content: string;
  outcome: "positive" | "neutral" | "negative" | null;
  like_count: number;
  dislike_count: number;
  created_at: string;
};

const OUTCOME = {
  positive: { label: "수익", cls: "bg-[#1AC267]/10 text-[#1AC267]" },
  negative: { label: "손실", cls: "bg-[#F04452]/10 text-[#F04452]" },
  neutral:  { label: "중립", cls: "bg-slate-100 text-unjong-muted" },
} as const;

export default function HotReviewPostsModule() {
  const [items, setItems] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const sb = createAnonClient();
        const { data } = await sb
          .from("platform_discussions")
          .select("id, target_type, target_id, nickname, tier, content, outcome, like_count, dislike_count, created_at")
          .eq("hidden", false)
          .order("like_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(6);
        if (!cancelled) setItems((data || []) as ReviewPost[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-unjong-primary flex items-center gap-1.5">
          ⭐ HOT 평가 글 <span className="text-xs text-unjong-muted font-normal">추천 순</span>
        </h2>
      </header>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState icon="⭐" title="첫 평가를 남겨보세요" description="상품·리딩방 페이지에서 작성 가능." />
      ) : (
        <ul className="space-y-2">
          {items.map((p) => {
            const href = p.target_type === "room" ? `/room/${p.target_id}` : `/product/${p.target_id}`;
            const typeLabel = p.target_type === "room" ? "리딩방" : "상품";
            const tierEmoji = p.tier === 3 ? "🏆" : p.tier === 2 ? "✓" : "";
            const oc = p.outcome ? OUTCOME[p.outcome] : null;
            return (
              <li key={p.id}>
                <Link href={href} className="block bg-unjong-background rounded-lg p-4 hover:border-unjong-accent border border-transparent transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{typeLabel}</span>
                    {oc && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${oc.cls}`}>{oc.label}</span>}
                    <span className="text-sm font-medium text-unjong-primary">{tierEmoji} {p.nickname}</span>
                  </div>
                  <p className="text-sm text-unjong-primary truncate">{p.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-unjong-muted">
                    <span className="flex items-center gap-1"><ThumbsUp size={11} /> {p.like_count}</span>
                    <span className="flex items-center gap-1"><ThumbsDown size={11} /> {p.dislike_count}</span>
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
