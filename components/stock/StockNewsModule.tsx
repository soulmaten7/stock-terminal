"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};

type Props = { symbol: string };

export default function StockNewsModule({ symbol }: Props) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stockName, setStockName] = useState<string>(symbol);
  const [source, setSource] = useState<"yahoo" | "rss" | "">("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/news/stock?symbol=${symbol}`);
        const json = await r.json();
        if (cancelled) return;
        setItems(json.items || []);
        setSource(json.source || "");
        if (json.stockName) setStockName(json.stockName);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10 * 60 * 1000); // 10분 갱신
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  return (
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-4 mb-4">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-unjong-primary">
          📰 {stockName} 뉴스
        </h2>
        <span className="text-xs text-unjong-muted italic">
          {source === "yahoo" ? "Yahoo Finance" : source === "rss" ? "RSS 매칭" : ""}
        </span>
      </header>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState icon="📰" title="관련 최근 뉴스가 없습니다" description={`${stockName} 관련 최근 뉴스가 없습니다.`} />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item, i) => (
            <li key={i}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-unjong-background rounded p-2 transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-unjong-muted">
                    {item.publisher}
                  </span>
                  <span className="text-xs text-unjong-muted">
                    {new Date(item.publishedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-unjong-primary leading-normal flex items-start gap-1">
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
