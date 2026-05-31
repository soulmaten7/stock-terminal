"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};

export default function MarketNewsModule() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/news/market");
        const json = await r.json();
        if (!cancelled) setItems((json.items || []).slice(0, 10));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // 5분 갱신
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-unjong-primary">
          📰 시장 헤드라인
        </h2>
        <span className="text-[10px] text-unjong-muted italic">한경·매경·머니투데이·이데일리·연합</span>
      </header>

      {loading ? (
        <div className="text-center text-xs text-unjong-muted py-4">⏳ 로딩 중...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-xs text-unjong-muted py-4">뉴스 로딩 실패</div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-unjong-background rounded p-2 hover:border-unjong-accent border border-transparent transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 flex-shrink-0">
                    {item.publisher}
                  </span>
                  <span className="text-[10px] text-unjong-muted">
                    {new Date(item.publishedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-unjong-primary leading-snug flex items-start gap-1">
                  <span className="flex-1">{item.title}</span>
                  <ExternalLink size={10} className="flex-shrink-0 mt-0.5 text-unjong-muted" />
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
