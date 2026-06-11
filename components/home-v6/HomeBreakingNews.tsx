"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type NewsItem = { title: string; link: string; publisher: string; publishedAt: string; image?: string };

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
        className="flex items-baseline gap-2 rounded-lg px-1 py-1.5 transition-colors hover:bg-unjong-background"
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

  const featured = items.find((it) => it.image) ?? items[0];
  const rest = items.filter((it) => it !== featured);
  const leftRest = rest.slice(0, 2);     // 왼쪽 열: 대표 밑 헤드라인 2개
  const rightRest = rest.slice(2, 16);   // 오른쪽 열: 헤드라인 (박스 채움)

  return (
    <section className="flex h-[46vh] flex-col overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex shrink-0 items-baseline justify-between px-5 pb-3 pt-5">
        <h2 className="flex items-center gap-1.5 text-base font-bold text-unjong-primary">
          🔴 실시간 속보 <span className="text-xs font-normal text-unjong-muted">시장 헤드라인</span>
        </h2>
        <span className="flex items-center gap-1 text-xs text-unjong-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F04452]" /> 실시간
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-5 pb-5">
        {loading ? (
          <LoadingState className="py-8" />
        ) : !featured ? (
          <p className="py-8 text-center text-sm text-unjong-muted">속보를 불러오는 중이에요.</p>
        ) : (
          <div className="grid h-full grid-cols-1 gap-x-6 md:grid-cols-2">
            {/* 왼쪽 열: 대표(이미지 크게, 공간 채움) + 헤드라인 2개 */}
            <div className="flex min-h-0 flex-col">
              <a
                href={featured.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                {featured.image && (
                  <div className="mb-2 min-h-0 flex-1 overflow-hidden rounded-lg border border-unjong-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featured.image}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => { const el = e.currentTarget.parentElement; if (el) el.style.display = "none"; }}
                    />
                  </div>
                )}
                <p className="line-clamp-2 shrink-0 text-sm font-bold text-unjong-primary group-hover:text-unjong-accent">{featured.title}</p>
                <p className="mt-0.5 shrink-0 text-[11px] text-unjong-muted">{featured.publisher} · {timeAgo(featured.publishedAt)}</p>
              </a>
              <ul className="mt-2 shrink-0 space-y-0.5">{leftRest.map((n, i) => <Row key={`l${i}`} n={n} />)}</ul>
            </div>

            {/* 오른쪽 열: 헤드라인 (넘치면 스크롤) */}
            <ul className="min-h-0 space-y-0.5 overflow-y-auto">{rightRest.map((n, i) => <Row key={`r${i}`} n={n} />)}</ul>
          </div>
        )}
      </div>
    </section>
  );
}
