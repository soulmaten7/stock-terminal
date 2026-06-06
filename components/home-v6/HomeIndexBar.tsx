"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/ui/State";

type IndexItem = {
  name: string;
  value: string;
  changeText?: string;
  changePct: number;
  isUp: boolean;
  spark?: number[];
};

// 느낌 태그 — 변동률 기준(토스식 급상승/조정/급락). 맥락 태그(금리·뉴스)는 추후 별도.
function moodTag(pct: number): string | null {
  if (pct >= 5) return "급등";
  if (pct >= 2) return "급상승";
  if (pct <= -5) return "급락";
  if (pct <= -2) return "조정";
  return null;
}

// 작은 추세선(스파크라인) — 외부 라이브러리 없이 inline SVG
function Sparkline({ points, up }: { points?: number[]; up: boolean }) {
  if (!points || points.length < 2) return null;
  const w = 100;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-5 mt-1.5" aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={up ? "#1AC267" : "#F04452"}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function HomeIndexBar() {
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
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="text-base font-bold text-unjong-primary">주요 지수</h2>
        <span className="text-xs text-unjong-muted">국내·해외·환율·원자재·코인</span>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {items.map((idx) => {
            const tag = moodTag(idx.changePct);
            return (
              <div
                key={idx.name}
                className="rounded-xl bg-unjong-background px-3 py-2.5 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-unjong-muted truncate">{idx.name}</p>
                  {tag && (
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        idx.isUp ? "bg-[#1AC267]/10 text-[#1AC267]" : "bg-[#F04452]/10 text-[#F04452]"
                      }`}
                    >
                      {tag}
                    </span>
                  )}
                </div>
                <p className="text-[15px] font-bold text-unjong-primary tabular-nums mt-0.5">{idx.value}</p>
                <p
                  className={`text-xs font-semibold tabular-nums ${
                    idx.isUp ? "text-[#1AC267]" : "text-[#F04452]"
                  }`}
                >
                  {idx.changeText ? `${idx.changeText} ` : ""}({idx.isUp ? "+" : ""}{idx.changePct.toFixed(2)}%)
                </p>
                <Sparkline points={idx.spark} up={idx.isUp} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
