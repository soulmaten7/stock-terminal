"use client";
import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { isKrxCode } from "@/lib/code";

type Exec = { time: string; price: number; change: number; changeSign: string; volume: number };

export default function StockExecutionCard({ symbol }: { symbol: string }) {
  const [items, setItems] = useState<Exec[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isKrxCode(symbol)) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/execution?symbol=${symbol}`);
        const j = await r.json();
        if (!cancelled && j.executions) setItems(j.executions.slice(0, 15));
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    const t = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(t); };
  }, [symbol]);

  if (!isKrxCode(symbol)) return null;
  const fmtTime = (s: string) => (s?.length === 6 ? `${s.slice(0, 2)}:${s.slice(2, 4)}:${s.slice(4, 6)}` : s);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <h3 className="text-base font-bold text-unjong-primary mb-3">실시간 체결</h3>
      {loading ? <LoadingState /> : items.length === 0 ? <EmptyState title="체결 정보 없음" /> : (
        <table className="w-full text-sm">
          <thead><tr className="text-xs text-unjong-muted border-b border-unjong-border">
            <th className="text-left py-1">체결시각</th><th className="text-right">체결가</th><th className="text-right">체결량</th>
          </tr></thead>
          <tbody>
            {items.map((e, i) => {
              const up = e.changeSign === "1" || e.changeSign === "2";
              return (
                <tr key={i} className="border-b border-unjong-border/50">
                  <td className="py-1 text-unjong-muted font-mono text-xs">{fmtTime(e.time)}</td>
                  <td className={`text-right font-mono ${up ? "text-[#3182F6]" : "text-[#F04452]"}`}>{e.price.toLocaleString()}</td>
                  <td className="text-right text-unjong-muted">{e.volume.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
