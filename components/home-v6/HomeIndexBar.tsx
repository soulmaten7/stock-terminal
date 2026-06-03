"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type IndexItem = { name: string; value: string; changePct: number; isUp: boolean };
type Tab = "미국" | "국내";

export default function HomeIndexBar() {
  const [tab, setTab] = useState<Tab>("미국");
  const [items, setItems] = useState<IndexItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/yahoo/indices");
        const j = await r.json();
        if (!cancelled) setItems(j.items || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const t = setInterval(async () => {
      try {
        const j = await (await fetch("/api/yahoo/indices")).json();
        setItems(j.items || []);
      } catch { /* 무시 */ }
    }, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <section className="mt-5 bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-bold text-unjong-primary mr-2">주요 지수</h2>
        {(["미국", "국내"] as Tab[]).map((t) => (
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

      {tab === "국내" ? (
        <p className="text-sm text-unjong-muted py-2">국내 지수(코스피·코스닥) — 준비 중</p>
      ) : loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map((idx) => (
            <div key={idx.name} className="rounded-xl bg-unjong-background px-3 py-2.5">
              <p className="text-xs text-unjong-muted truncate">{idx.name}</p>
              <p className="text-base font-bold text-unjong-primary tabular-nums mt-0.5">{idx.value}</p>
              <p className={`text-xs font-semibold ${idx.isUp ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                {idx.isUp ? "+" : ""}{idx.changePct.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
