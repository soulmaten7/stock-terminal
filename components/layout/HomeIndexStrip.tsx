"use client";

import { Fragment, useEffect, useState } from "react";

type Item = { name: string; value: string; changeText?: string; changePct: number; isUp: boolean; group: string };

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
    <div className="sticky top-0 z-30 flex h-9 items-center border-b border-white/10 bg-[#0E1116]">
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track flex h-full items-center whitespace-nowrap">
          {loop.map((it, i) => {
            const showDiv = i > 0 && loop[i - 1].group !== it.group;
            return (
              <Fragment key={i}>
                {showDiv && <span className="mx-1 h-3 w-px shrink-0 bg-white/15" />}
                <span className="inline-flex items-center gap-1.5 px-4 text-xs">
                  <span className="text-white/45">{it.name}</span>
                  <span className="font-semibold tabular-nums text-white">{it.value}</span>
                  <span className={`tabular-nums ${it.isUp ? "text-unjong-up" : "text-unjong-down"}`}>
                    {it.changeText ? `${it.changeText} ` : ""}({it.isUp ? "+" : ""}{it.changePct.toFixed(2)}%)
                  </span>
                </span>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
