"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import type { HoverStock } from "@/components/market/MarketClient";

function fmtAmount(won?: number): string {
  if (!won || won <= 0) return "—";
  if (won >= 1e12) return `${(won / 1e12).toFixed(1)}조`;
  if (won >= 1e8) return `${Math.round(won / 1e8).toLocaleString()}억`;
  return won.toLocaleString();
}

function MiniChart({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const w = 280;
  const h = 128;
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
  const stroke = up ? "#1AC267" : "#F04452";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-32 w-full">
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={stroke} opacity="0.07" />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function HomeStockDetail({ stock }: { stock: HoverStock | null }) {
  const [candles, setCandles] = useState<number[]>([]);

  // 국내(6자리)만 일봉 차트. hover debounce 350ms 로 KIS 호출 최소화.
  useEffect(() => {
    if (!stock || !/^\d{6}$/.test(stock.symbol)) {
      setCandles([]);
      return;
    }
    const code = stock.symbol;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const j = await (await fetch(`/api/kis/chart?symbol=${code}&period=D`)).json();
        const closes = (j.candles ?? [])
          .map((c: { close: number }) => c.close)
          .filter((n: number) => n > 0);
        if (!cancelled) setCandles(closes.slice(-60));
      } catch {
        if (!cancelled) setCandles([]);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [stock?.symbol]);

  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-5 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
        {!stock ? (
          <div className="p-5 text-sm text-unjong-muted">종목에 마우스를 올리면 상세가 표시됩니다.</div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="flex items-center gap-2.5 border-b border-unjong-border p-4">
              <StockLogo code={stock.symbol} name={stock.name} size={36} />
              <div className="min-w-0">
                <p className="truncate font-bold text-unjong-primary">{stock.name}</p>
                <p className={`text-sm font-semibold tabular-nums ${stock.changePercent >= 0 ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                  {stock.priceText}
                  <span className="ml-1 text-xs">({stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%)</span>
                </p>
              </div>
            </div>

            {/* 미니 차트 (국내 일봉) */}
            <div className="border-b border-unjong-border px-2 py-3">
              <MiniChart points={candles} up={stock.changePercent >= 0} />
            </div>

            {/* 핵심 지표 (실데이터) */}
            <div className="grid grid-cols-2 gap-px bg-unjong-border text-xs">
              <div className="bg-unjong-surface p-3">
                <p className="mb-0.5 text-unjong-muted">거래량</p>
                <p className="font-semibold text-unjong-primary tabular-nums">{stock.volume ? stock.volume.toLocaleString() : "—"}</p>
              </div>
              <div className="bg-unjong-surface p-3">
                <p className="mb-0.5 text-unjong-muted">거래대금</p>
                <p className="font-semibold text-unjong-primary tabular-nums">{fmtAmount(stock.tradeAmount)}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="p-4">
              <Link
                href={`/stock/${stock.symbol}`}
                className="block w-full rounded-lg bg-unjong-primary py-2 text-center text-sm font-semibold text-white hover:opacity-90"
              >
                종목 상세 · 토론 보기 →
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
