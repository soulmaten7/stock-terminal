"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import { createAnonClient } from "@/lib/supabase/anon-client";
import type { HoverStock } from "@/components/market/MarketClient";

type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };
type Post = { id: string; nickname: string; tier: string | null; content: string; created_at: string };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function CandleChart({ candles }: { candles: Candle[] }) {
  if (candles.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const data = candles.slice(-60);
  const w = 280;
  const priceH = 96;
  const gap = 6;
  const volH = 22;
  const labelH = 14;
  const h = priceH + gap + volH + labelH;
  const pad = 4;
  const max = Math.max(...data.map((c) => c.high));
  const min = Math.min(...data.map((c) => c.low));
  const range = max - min || 1;
  const maxVol = Math.max(...data.map((c) => c.volume), 1);
  const cw = w / data.length;
  const py = (v: number) => pad + (priceH - 2 * pad) * (1 - (v - min) / range);
  const volBase = priceH + gap + volH;
  const bw = Math.max(1.2, cw * 0.6);

  const labels: { x: number; text: string }[] = [];
  let prevMonth = "";
  data.forEach((c, i) => {
    const ym = c.time.slice(0, 7);
    if (ym !== prevMonth) {
      prevMonth = ym;
      const x = i * cw + cw / 2;
      if (labels.length === 0 || x - labels[labels.length - 1].x > 34) {
        labels.push({ x, text: `${c.time.slice(2, 4)}.${parseInt(c.time.slice(5, 7), 10)}` });
      }
    }
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" aria-hidden="true">
      {/* 캔들 */}
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const color = up ? "#1AC267" : "#F04452";
        const top = py(Math.max(c.open, c.close));
        const bot = py(Math.min(c.open, c.close));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={py(c.high)} y2={py(c.low)} stroke={color} strokeWidth={0.8} />
            <rect x={x - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={color} />
          </g>
        );
      })}
      {/* 거래량 막대 */}
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const vh = (c.volume / maxVol) * volH;
        return (
          <rect
            key={`v${i}`}
            x={x - bw / 2}
            y={volBase - vh}
            width={bw}
            height={Math.max(0.5, vh)}
            fill={up ? "#1AC267" : "#F04452"}
            opacity={0.45}
          />
        );
      })}
      {/* 월 축 라벨 (양 끝 잘림 방지: 왼쪽=start, 오른쪽=end) */}
      {labels.map((l, i) => {
        const anchor = l.x < 16 ? "start" : l.x > w - 16 ? "end" : "middle";
        const lx = l.x < 1 ? 1 : l.x > w - 1 ? w - 1 : l.x;
        return (
          <text key={`l${i}`} x={lx} y={h - 3} fontSize={8} fill="#94a3b8" textAnchor={anchor}>
            {l.text}
          </text>
        );
      })}
    </svg>
  );
}

export default function HomeStockDetail({ stock }: { stock: HoverStock | null }) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // 차트 (국내 6자리, debounce)
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
        const cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
        if (!cancelled) setCandles(cs);
      } catch {
        if (!cancelled) setCandles([]);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol]);

  // 커뮤니티 (종목 토론, debounce)
  useEffect(() => {
    if (!stock) { setPosts([]); return; }
    const code = stock.symbol;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("discussions")
          .select("id, nickname, tier, content, created_at")
          .eq("symbol", code)
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(3);
        if (!cancelled) setPosts((data as Post[]) ?? []);
      } catch {
        if (!cancelled) setPosts([]);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
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

            {/* 캔들차트 */}
            <div className="border-b border-unjong-border px-2 py-3">
              <p className="px-2 pb-1 text-xs text-unjong-muted">일봉</p>
              <CandleChart candles={candles} />
            </div>

            {/* 커뮤니티 */}
            <div className="border-b border-unjong-border p-4">
              <p className="mb-2 text-xs font-semibold text-unjong-muted">커뮤니티</p>
              {posts.length === 0 ? (
                <p className="text-xs text-unjong-muted">아직 토론이 없어요. 첫 의견을 남겨보세요.</p>
              ) : (
                <ul className="space-y-2.5">
                  {posts.map((p) => (
                    <li key={p.id} className="text-xs">
                      <p className="mb-0.5 text-unjong-muted">
                        {p.nickname}
                        {p.tier ? <span className="ml-1 rounded bg-unjong-background px-1 py-0.5 text-[10px]">{p.tier}</span> : null}
                        <span className="ml-1">· {timeAgo(p.created_at)}</span>
                      </p>
                      <p className="line-clamp-2 text-unjong-primary">{p.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* CTA */}
            <div className="p-4">
              <Link href={`/stock/${stock.symbol}`} className="block w-full rounded-lg bg-unjong-primary py-2 text-center text-sm font-semibold text-white hover:opacity-90">
                종목 상세 · 토론 보기 →
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
