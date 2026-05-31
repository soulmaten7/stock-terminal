"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { LoadingState } from "@/components/ui/State";

type Props = { symbol: string };

type StockData = {
  name: string;
  price: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  high52w: number;
  low52w: number;
  per: number;
  pbr: number;
  marketCap: number;
};

export default function StockInfoPanel({ symbol }: Props) {
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<HTMLDivElement>(null);

  const isKr = /^\d{6}$/.test(symbol);

  // ── 종목 정보 로드 (한국: KIS · 미국: Yahoo) ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (/^\d{6}$/.test(symbol)) {
          const r = await fetch(`/api/kis/price?symbol=${symbol}`);
          const json = await r.json();
          if (cancelled || json.error) return;
          setData({
            name: json.name,
            price: json.price,
            changePct: json.changePercent,
            open: json.open,
            high: json.high,
            low: json.low,
            volume: json.volume,
            high52w: json.high52w,
            low52w: json.low52w,
            per: json.per,
            pbr: json.pbr,
            marketCap: json.marketCap,
          });
        } else if (/^[A-Z.\-]+$/.test(symbol)) {
          // 미국 주식 — Yahoo quoteSummary (시고저·52주·PER·시총)
          const r = await fetch(`/api/yahoo/quote-detail?symbol=${symbol}`);
          const json = await r.json();
          if (cancelled || json.error) return;
          setData({
            name: json.name || symbol,
            price: json.price,
            changePct: json.changePct,
            open: json.open || 0,
            high: json.high || 0,
            low: json.low || 0,
            volume: json.volume || 0,
            high52w: json.high52w || 0,
            low52w: json.low52w || 0,
            per: json.per || 0,
            pbr: json.pbr || 0,
            marketCap: json.marketCap || 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  // ── 일봉 차트 (한국 주식만, lightweight-charts dynamic import) ───────────────
  useEffect(() => {
    if (!/^\d{6}$/.test(symbol) || !chartRef.current) return;

    let chart: ReturnType<typeof import("lightweight-charts").createChart> | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;

    const load = async () => {
      try {
        const [{ createChart, ColorType, LineStyle }, res] = await Promise.all([
          import("lightweight-charts"),
          fetch(`/api/kis/chart?symbol=${symbol}&period=D`).then((r) => r.json()),
        ]);
        if (cancelled || !chartRef.current) return;
        if (!res.candles || res.candles.length === 0) {
          console.warn("[chart] no candles for", symbol);
          return;
        }

        chartRef.current.innerHTML = "";
        const width = chartRef.current.clientWidth || 280;
        chart = createChart(chartRef.current, {
          width,
          height: 200,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#475569",
            fontFamily: "inherit",
            attributionLogo: false,
          },
          grid: {
            vertLines: { color: "#e2e8f0", style: LineStyle.Dotted },
            horzLines: { color: "#e2e8f0", style: LineStyle.Dotted },
          },
          rightPriceScale: { borderColor: "#cbd5e1" },
          timeScale: { borderColor: "#cbd5e1", timeVisible: false },
        });

        const series = chart.addCandlestickSeries({
          upColor: "#0E7C7B",
          downColor: "#C73E3A",
          borderUpColor: "#0E7C7B",
          borderDownColor: "#C73E3A",
          wickUpColor: "#0E7C7B",
          wickDownColor: "#C73E3A",
        });
        series.setData(
          (res.candles ?? [])
            .slice(-60)
            .map((c: { time: string; open: number; high: number; low: number; close: number }) => ({
              time: c.time as import("lightweight-charts").Time,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            }))
        );
        chart.timeScale().fitContent();

        ro = new ResizeObserver(() => {
          if (chart && chartRef.current) {
            chart.applyOptions({ width: chartRef.current.clientWidth });
          }
        });
        ro.observe(chartRef.current);
      } catch (err) {
        console.error("[chart] failed to load", err);
      }
    };
    load();

    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (chart) chart.remove();
    };
  }, [symbol]);

  if (loading) return <LoadingState className="p-4" />;
  if (!data) return (
    <div className="p-4 text-center text-xs text-unjong-muted">데이터 없음</div>
  );

  const isUp = data.changePct >= 0;
  const isUS = !isKr;

  return (
    <div className="space-y-3">
      {/* 뒤로 */}
      <Link href="/kr" className="inline-flex items-center gap-1 text-[10px] text-unjong-muted hover:text-unjong-primary">
        <ArrowLeft size={12} /> 한국주식
      </Link>

      {/* 종목 헤더 */}
      <div className="bg-unjong-surface rounded-lg border border-unjong-border p-3">
        <h2 className="text-base font-bold text-unjong-primary">{data.name}</h2>
        <p className="text-[10px] text-unjong-muted font-mono">{symbol}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-unjong-primary tabular-nums">
            {isUS ? `$${data.price.toFixed(2)}` : data.price.toLocaleString()}
          </span>
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? "+" : ""}{data.changePct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 차트 (한국 주식만) */}
      {isKr && (
        <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3">
          <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-2">일봉 (60일)</h3>
          <div ref={chartRef} className="relative w-full h-[200px] min-w-[260px]" />
        </section>
      )}

      {/* 시세·재무 (한국·미국 동일 구조, 통화·단위만 다름) */}
      {data.open > 0 && (
        <>
          <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
            <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">시세</h3>
            <Row label="시가" value={formatPrice(data.open, isUS)} />
            <Row label="고가" value={formatPrice(data.high, isUS)} />
            <Row label="저가" value={formatPrice(data.low, isUS)} />
            <Row label="거래량" value={data.volume ? data.volume.toLocaleString() : "—"} />
            <Row label="52주 최고" value={formatPrice(data.high52w, isUS)} />
            <Row label="52주 최저" value={formatPrice(data.low52w, isUS)} />
          </section>

          <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
            <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">재무</h3>
            <Row label="시가총액" value={formatMarketCap(data.marketCap, isUS)} />
            <Row label="PER" value={data.per > 0 ? data.per.toFixed(1) : "—"} />
            <Row label="PBR" value={data.pbr > 0 ? data.pbr.toFixed(1) : "—"} />
          </section>
        </>
      )}
    </div>
  );
}

function formatPrice(price: number, isUS = false): string {
  if (!price) return "—";
  return isUS ? `$${price.toFixed(2)}` : price.toLocaleString();
}

function formatMarketCap(cap: number, isUS = false): string {
  if (!cap || cap <= 0) return "—";
  if (isUS) {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    return `$${cap.toLocaleString()}`;
  }
  // 한국 — KIS hts_avls 단위 = 억원 (1조 = 10,000억)
  if (cap >= 10000) return `${(cap / 10000).toFixed(1)}조`;
  return `${cap.toLocaleString()}억`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-unjong-muted">{label}</span>
      <span className="font-semibold text-unjong-primary tabular-nums">{value}</span>
    </div>
  );
}
