"use client";

import { useEffect, useRef, useState } from "react";

type Props = { symbol: string };

export default function StockChartSection({ symbol }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<"D" | "W" | "M">("D");

  useEffect(() => {
    if (!/^\d{6}$/.test(symbol)) return;
    if (!chartRef.current) return;
    let chart: ReturnType<typeof import("lightweight-charts").createChart> | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;
    const load = async () => {
      try {
        const [{ createChart, ColorType, LineStyle }, res] = await Promise.all([
          import("lightweight-charts"),
          fetch(`/api/kis/chart?symbol=${symbol}&period=${period}`).then((r) => r.json()),
        ]);
        if (cancelled || !chartRef.current || !res.candles?.length) return;
        chartRef.current.innerHTML = "";
        const width = chartRef.current.clientWidth || 800;
        chart = createChart(chartRef.current, {
          width,
          height: 400,
          layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#4E5968", fontFamily: "inherit", attributionLogo: false },
          grid: { vertLines: { color: "#F2F4F6", style: LineStyle.Dotted }, horzLines: { color: "#F2F4F6", style: LineStyle.Dotted } },
          rightPriceScale: { borderColor: "#E5E7EB" },
          timeScale: { borderColor: "#E5E7EB", timeVisible: false },
        });
        const series = chart.addCandlestickSeries({
          upColor: "#1AC267", downColor: "#F04452",
          borderUpColor: "#1AC267", borderDownColor: "#F04452",
          wickUpColor: "#1AC267", wickDownColor: "#F04452",
        });
        series.setData(
          res.candles.map((c: { time: string; open: number; high: number; low: number; close: number }) => ({
            time: c.time as import("lightweight-charts").Time,
            open: c.open, high: c.high, low: c.low, close: c.close,
          }))
        );
        chart.timeScale().fitContent();
        ro = new ResizeObserver(() => { if (chart && chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth }); });
        ro.observe(chartRef.current);
      } catch {
        // 차트 로딩 실패 무시
      }
    };
    load();
    return () => { cancelled = true; if (ro) ro.disconnect(); if (chart) chart.remove(); };
  }, [symbol, period]);

  const isUS = /^[A-Z.\-]+$/.test(symbol);
  if (isUS) {
    return <div className="text-center py-12 text-sm text-unjong-muted">미국 주식 차트는 Yahoo Finance 통합 추후</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(["D", "W", "M"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${period === p ? "bg-unjong-primary text-white" : "text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"}`}
          >
            {p === "D" ? "일봉" : p === "W" ? "주봉" : "월봉"}
          </button>
        ))}
      </div>
      <div ref={chartRef} className="w-full h-[400px] bg-unjong-background rounded-lg" />
    </div>
  );
}
