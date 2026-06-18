"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import { isKrxCode } from "@/lib/code";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { useAuthStore } from "@/stores/authStore";
import { useChartRange } from "@/stores/chartRangeStore";
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

function CandleChart({ candles, count, intraday }: { candles: Candle[]; count: number; intraday: boolean }) {
  const data = candles.slice(-count);
  if (data.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const w = 280;
  const priceH = 84;
  const gap = 2;
  const volH = 38;
  const labelH = 14;
  const h = priceH + gap + volH + labelH;
  const pad = 4;
  const max = Math.max(...data.map((c) => c.high));
  const min = Math.min(...data.map((c) => c.low));
  const range = max - min || 1;
  const maxVol = Math.max(...data.map((c) => c.volume), 1);
  // 차트폭을 꽉 채우되(빈 여백 없음), 봉이 적어도 몸통이 너무 두꺼워지지 않게 너비 상한(6px).
  const cw = w / data.length;
  const py = (v: number) => pad + (priceH - 2 * pad) * (1 - (v - min) / range);
  const volBase = priceH + gap + volH;
  const bw = Math.max(1.2, Math.min(cw * 0.6, 6));

  const labels: { x: number; text: string }[] = [];
  let prevKey = "";
  data.forEach((c, i) => {
    const k = intraday ? c.time.slice(0, 10) : c.time.slice(0, 7);
    if (k !== prevKey) {
      prevKey = k;
      const x = i * cw + cw / 2;
      if (labels.length === 0 || x - labels[labels.length - 1].x > 34) {
        const text = intraday
          ? `${parseInt(c.time.slice(5, 7), 10)}.${parseInt(c.time.slice(8, 10), 10)}`
          : `${c.time.slice(2, 4)}.${parseInt(c.time.slice(5, 7), 10)}`;
        labels.push({ x, text });
      }
    }
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" aria-hidden="true">
      {/* 캔들 */}
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const color = up ? "#F04452" : "#3182F6";
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
            fill={up ? "#F04452" : "#3182F6"}
            opacity={0.55}
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

export default function HomeStockDetail({ stock, wide = false, noChart = false }: { stock: HoverStock | null; wide?: boolean; noChart?: boolean }) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const user = useAuthStore((s) => s.user);
  const [reloadN, setReloadN] = useState(0);
  const [showWrite, setShowWrite] = useState(false);
  const [writeContent, setWriteContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const range = useChartRange((s) => s.range);
  // 1일·1주일 = 분봉(빽빽), 1개월~ = 일봉. interval=yahoo 봉간격, count=표시 봉 개수
  const RANGE_CFG: Record<string, { interval: "5m" | "30m" | "1d"; count: number; label: string }> = {
    "1d": { interval: "5m", count: 78, label: "1일" },
    "1w": { interval: "30m", count: 65, label: "1주일" },
    "1m": { interval: "1d", count: 22, label: "1개월" },
    "3m": { interval: "1d", count: 66, label: "3개월" },
    "6m": { interval: "1d", count: 132, label: "6개월" },
    "1y": { interval: "1d", count: 252, label: "1년" },
  };
  const cfg = RANGE_CFG[range] ?? RANGE_CFG["3m"];
  const chartInterval = cfg.interval;
  const chartCount = cfg.count;
  const chartIntraday = chartInterval !== "1d";

  // 차트: yahoo (1개월~=일봉 / 1일·1주일=분봉). 일봉만 KIS 폴백. interval 바뀌면 재조회. debounce.
  useEffect(() => {
    if (!stock || noChart) { setCandles([]); return; }
    const code = stock.symbol;
    const isKr = isKrxCode(code);
    let cancelled = false;
    const t = setTimeout(async () => {
      let cs: Candle[] = [];
      try {
        const j = await (await fetch(`/api/yahoo/chart?symbol=${encodeURIComponent(code)}&interval=${chartInterval}`)).json();
        cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
      } catch {
        cs = [];
      }
      if (cs.length < 2 && isKr && chartInterval === "1d") {
        try {
          const j = await (await fetch(`/api/kis/chart?symbol=${code}&period=D`)).json();
          cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
        } catch {
          /* cs 유지 */
        }
      }
      if (!cancelled) setCandles(cs);
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol, noChart, chartInterval]);

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
  }, [stock?.symbol, reloadN]);

  const handleSubmit = async () => {
    if (!user || !stock) return;
    const trimmed = writeContent.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    const supabase = createAnonClient();
    const { error } = await supabase.from("discussions").insert({
      symbol: stock.symbol,
      user_id: user.id,
      nickname: user.nickname,
      tier: user.tier ?? 1,
      content: trimmed,
    });
    if (!error) {
      setWriteContent("");
      setShowWrite(false);
      setReloadN((n) => n + 1);
    }
    setSubmitting(false);
  };

  return (
    <aside className={`hidden xl:block ${wide ? "w-full min-w-0" : "w-80 shrink-0"}`}>
      <div className="sticky top-[74px] overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
        {!stock ? (
          <div className="p-5 text-sm text-unjong-muted">종목을 클릭하면 미리보기가 표시됩니다.</div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="flex items-center gap-2.5 border-b border-unjong-border p-4">
              <StockLogo code={stock.symbol} name={stock.name} size={36} />
              <div className="min-w-0">
                <p className="truncate font-bold text-unjong-primary">{stock.name}</p>
                <p className={`text-sm font-semibold tabular-nums ${stock.changePercent >= 0 ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                  {stock.priceText}
                  <span className="ml-1 text-xs">({stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%)</span>
                </p>
              </div>
            </div>

            {/* 캔들차트 — ETN 등 차트 미제공 종목은 블록 자체를 그리지 않음 */}
            {!noChart && (
              <div className="border-b border-unjong-border px-2 py-3">
                <p className="px-2 pb-1 text-xs text-unjong-muted">{chartIntraday ? "분봉" : "일봉"} · {cfg.label}</p>
                <CandleChart candles={candles} count={chartCount} intraday={chartIntraday} />
              </div>
            )}

            {/* 종목 토론 */}
            <div className="border-b border-unjong-border p-4">
              <p className="mb-2 text-xs font-semibold text-unjong-muted">종목 토론</p>

              {/* 글쓰기 — 로그인 후 작성 가능 */}
              {!user ? (
                <Link href="/auth/login" className="mb-2.5 block rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-center text-xs text-unjong-muted hover:text-unjong-primary">
                  토론 글쓰기 로그인후 가능
                </Link>
              ) : !showWrite ? (
                <button
                  type="button"
                  onClick={() => setShowWrite(true)}
                  className="mb-2.5 w-full rounded-lg border border-unjong-border bg-unjong-background px-3 py-2 text-left text-xs text-unjong-muted hover:text-unjong-primary"
                >
                  ✏️ 이 종목, 어떻게 생각하세요?
                </button>
              ) : (
                <div className="mb-2.5 rounded-lg border border-unjong-primary p-2">
                  <textarea
                    value={writeContent}
                    onChange={(e) => setWriteContent(e.target.value)}
                    placeholder="의견을 남겨보세요. 욕설·홍보는 제한됩니다."
                    maxLength={5000}
                    rows={3}
                    autoFocus
                    className="w-full resize-none text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
                  />
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <button type="button" onClick={() => { setShowWrite(false); setWriteContent(""); }} className="text-xs text-unjong-muted">
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || !writeContent.trim()}
                      className="rounded bg-unjong-primary px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {submitting ? "..." : "등록"}
                    </button>
                  </div>
                </div>
              )}

              {/* 목록 */}
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
