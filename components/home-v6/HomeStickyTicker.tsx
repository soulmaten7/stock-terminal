"use client";

import { useEffect, useState, type RefObject } from "react";

type Item = {
  name: string;
  value: string;
  changePct: number;
  isUp: boolean;
};

export default function HomeStickyTicker({ observeRef }: { observeRef: RefObject<HTMLElement | null> }) {
  const [items, setItems] = useState<Item[]>([]);
  const [show, setShow] = useState(false);

  // 데이터: 주요지수 그리드와 동일 소스
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const j = await (await fetch("/api/yahoo/indices")).json();
        if (!cancelled) setItems(j.items || []);
      } catch { /* 무시 */ }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  // 주요지수 그리드가 화면 밖으로 나가면 표시
  useEffect(() => {
    const el = observeRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [observeRef]);

  if (items.length === 0) return null;

  const loop = [...items, ...items]; // 끊김 없는 루프용 2배 복제

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 h-9 overflow-hidden border-t border-unjong-border bg-unjong-surface/95 backdrop-blur transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="ticker-track flex h-full items-center whitespace-nowrap">
        {loop.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-4 text-xs">
            <span className="text-unjong-muted">{it.name}</span>
            <span className="font-semibold text-unjong-primary tabular-nums">{it.value}</span>
            <span className={`tabular-nums ${it.isUp ? "text-[#1AC267]" : "text-[#F04452]"}`}>
              {it.isUp ? "+" : ""}{it.changePct.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
