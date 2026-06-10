"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type NewsItem = { title: string; link: string; publisher: string; publishedAt: string };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Row({ n }: { n: NewsItem }) {
  return (
    <li>
      <a
        href={n.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-baseline gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-unjong-background"
      >
        <span className="min-w-0 flex-1 truncate text-sm text-unjong-primary">{n.title}</span>
        <span className="shrink-0 text-[11px] text-unjong-muted">{n.publisher} · {timeAgo(n.publishedAt)}</span>
      </a>
    </li>
  );
}

export default function HomeBreakingNews() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/news/market");
        const j = await r.json();
        if (!cancelled) setItems((j.items as NewsItem[]) || []);
      } catch {
        /* 무시 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const left = items.slice(0, 6);
  const right = items.slice(6, 12);

  return (
    <section className="rounded-2xl border border-unjong-border bg-unjong-surface p-5 shadow-soft">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-unjong-primary">
          🔴 실시간 속보 <span className="text-xs font-normal text-unjong-muted">시장 헤드라인</span>
        </h2>
        <span className="flex items-center gap-1 text-xs text-unjong-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F04452]" /> 실시간
        </span>
      </div>

      {loading ? (
        <LoadingState className="py-8" />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-unjong-muted">속보를 불러오는 중이에요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
          <ul className="space-y-0.5">{left.map((n, i) => <Row key={`l${i}`} n={n} />)}</ul>
          <ul className="space-y-0.5">{right.map((n, i) => <Row key={`r${i}`} n={n} />)}</ul>
        </div>
      )}
    </section>
  );
}
