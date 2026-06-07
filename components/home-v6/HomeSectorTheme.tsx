"use client";

import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Item = { name: string; changePct: number };
type Tab = "국내" | "미국";

export default function HomeSectorTheme() {
  const [tab, setTab] = useState<Tab>("국내");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const market = tab === "미국" ? "US" : "KR";
        const j = await (await fetch(`/api/home/sectors?market=${market}`)).json();
        const rows = (j.sectors || []).map((s: { sector: string; change: number }) => ({
          name: s.sector,
          changePct: Number(s.change ?? 0),
        }));
        if (!cancelled) setItems(rows);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab]);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold text-unjong-primary mr-2">인기 업종·테마</h2>
        {(["국내", "미국"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
              tab === t ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState title="업종·테마 데이터 없음" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.slice(0, 8).map((s, i) => {
            const up = s.changePct >= 0;
            return (
              <div key={`${s.name}-${i}`} className="rounded-xl bg-unjong-background px-3 py-3">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-sm font-bold text-unjong-muted tabular-nums">{i + 1}</span>
                  <span className="text-sm font-semibold text-unjong-primary truncate">{s.name}</span>
                </div>
                <p className={`text-sm font-bold tabular-nums ${up ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                  {up ? "+" : ""}{s.changePct.toFixed(1)}%
                </p>
                <div className="mt-1.5 h-1.5 rounded-full bg-unjong-surface overflow-hidden">
                  <div
                    className={`h-full ${up ? "bg-[#F04452]" : "bg-[#3182F6]"}`}
                    style={{ width: `${Math.min(Math.abs(s.changePct) * 12, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
