"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { LoadingState } from "@/components/ui/State";
import { StockLogo } from "@/components/ui/StockLogo";

type Discussion = {
  id: string;
  symbol: string;
  nickname: string;
  tier: number;
  content: string;
  like_count: number;
  dislike_count: number;
  comment_count: number;
  created_at: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Row({ d, rank }: { d: Discussion; rank: number }) {
  const tierEmoji = d.tier === 3 ? "🏆" : d.tier === 2 ? "✓" : "";
  return (
    <li>
      <Link href={`/stock/${d.symbol}`} className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-unjong-background">
        <span className="w-4 shrink-0 text-center text-sm font-bold tabular-nums text-unjong-muted">{rank}</span>
        <StockLogo code={d.symbol} name={d.symbol} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-xs text-unjong-muted">{tierEmoji} {d.nickname}</span>
            <span className="shrink-0 text-[11px] text-unjong-muted">{timeAgo(d.created_at)}</span>
          </div>
          <p className="truncate text-sm font-medium text-unjong-primary">{d.content}</p>
          <div className="mt-1 flex items-center gap-3 text-[11px] text-unjong-muted">
            <span className="flex items-center gap-0.5"><ThumbsUp size={11} /> {d.like_count}</span>
            <span className="flex items-center gap-0.5"><ThumbsDown size={11} /> {d.dislike_count}</span>
            <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {d.comment_count}</span>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default function HomePopularDiscussions() {
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("discussions")
          .select("id, symbol, nickname, tier, content, like_count, dislike_count, comment_count, created_at")
          .eq("hidden", false)
          .order("like_count", { ascending: false })
          .order("comment_count", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10);
        if (!cancelled) setItems((data as Discussion[]) || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const left = items.slice(0, 5);
  const right = items.slice(5, 10);

  return (
    <section className="rounded-2xl border border-unjong-border bg-unjong-surface p-5 shadow-soft">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-unjong-primary">
          🔥 인기 토론 <span className="text-xs font-normal text-unjong-muted">좋아요 순</span>
        </h2>
        <span className="flex items-center gap-1 text-xs text-unjong-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F04452]" /> 실시간
        </span>
      </div>

      {loading ? (
        <LoadingState className="py-8" />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
          <span className="mb-2 text-2xl">💬</span>
          <p className="text-sm font-medium text-unjong-primary">아직 인기 토론이 없어요</p>
          <p className="mt-1 text-xs text-unjong-muted">첫 의견을 남기면 여기 1등으로 올라가요.</p>
          <Link href="/discussion" className="mt-3 inline-block rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            토론 보러 가기 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <ul className="space-y-0.5">
            {left.map((d, i) => <Row key={d.id} d={d} rank={i + 1} />)}
          </ul>
          <ul className="space-y-0.5">
            {right.map((d, i) => <Row key={d.id} d={d} rank={i + 6} />)}
          </ul>
        </div>
      )}
    </section>
  );
}
