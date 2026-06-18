"use client";
import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { isKrxCode } from "@/lib/code";

type Level = { price: number; volume: number };
type Book = { asks: Level[]; bids: Level[]; totalAskVolume: number; totalBidVolume: number };

export default function StockOrderbookCard({ symbol }: { symbol: string }) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isKrxCode(symbol)) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/orderbook?symbol=${symbol}`);
        const j = await r.json();
        if (!cancelled && !j.error) setBook(j);
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    const t = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, [symbol]);

  if (!isKrxCode(symbol)) return null;
  const maxVol = book ? Math.max(1, ...book.asks.map((a) => a.volume), ...book.bids.map((b) => b.volume)) : 1;

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <h3 className="text-base font-bold text-unjong-primary mb-3">호가 10단</h3>
      {loading ? <LoadingState /> : !book ? <EmptyState title="호가 정보 없음" /> : (
        <div className="space-y-0.5 text-sm">
          {book.asks.map((a, i) => (
            <div key={`a${i}`} className="grid grid-cols-[1fr_auto] items-center gap-2">
              <div className="relative h-6 rounded bg-[#3182F6]/5">
                <div className="absolute right-0 top-0 h-full rounded bg-[#3182F6]/15" style={{ width: `${(a.volume / maxVol) * 100}%` }} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-unjong-muted">{a.volume.toLocaleString()}</span>
              </div>
              <span className="w-20 text-right font-mono text-[#3182F6]">{a.price.toLocaleString()}</span>
            </div>
          ))}
          {book.bids.map((b, i) => (
            <div key={`b${i}`} className="grid grid-cols-[auto_1fr] items-center gap-2">
              <span className="w-20 text-left font-mono text-[#F04452]">{b.price.toLocaleString()}</span>
              <div className="relative h-6 rounded bg-[#F04452]/5">
                <div className="absolute left-0 top-0 h-full rounded bg-[#F04452]/15" style={{ width: `${(b.volume / maxVol) * 100}%` }} />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-unjong-muted">{b.volume.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
