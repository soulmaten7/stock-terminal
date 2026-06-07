"use client";

import { useEffect, useState } from "react";

type Item = { name: string; value: string; changeText?: string; changePct: number; isUp: boolean };

export default function HomeIndexStrip() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const j = await (await fetch("/api/yahoo/indices")).json();
        if (!cancelled) setItems(j.items || []);
      } catch {
        /* 무시 */
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (items.length === 0) return null;
  const loop = [...items, ...items]; // 끊김 없는 루프용 2배 복제

  return (
    <div className="sticky top-0 z-30 -mx-6 -mt-5 mb-4 flex h-9 items-center border-b border-unjong-border bg-unjong-surface/95 backdrop-blur">
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track flex h-full items-center whitespace-nowrap">
          {loop.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs">
              <span className="text-unjong-muted">{it.name}</span>
              <span className="font-semibold tabular-nums text-unjong-primary">{it.value}</span>
              <span className={`tabular-nums ${it.isUp ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                {it.changeText ? `${it.changeText} ` : ""}({it.isUp ? "+" : ""}{it.changePct.toFixed(2)}%)
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
