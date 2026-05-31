"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

type Props = { symbol: string };

export default function StockInfoPanel({ symbol }: Props) {
  const [data, setData] = useState<{
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
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!/^\d{6}$/.test(symbol)) {
      // 미국 주식: Yahoo /api/yahoo/quote 사용 (추후 통합)
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/price?symbol=${symbol}`);
        const json = await r.json();
        if (!cancelled && !json.error) {
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
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  if (loading) return <div className="p-4 text-center text-xs text-unjong-muted">⏳ 로딩...</div>;
  if (!data) return (
    <div className="p-4 text-center text-xs text-unjong-muted">
      {/^\d{6}$/.test(symbol) ? "데이터 없음" : "미국 주식 — Yahoo Finance 통합 추후"}
    </div>
  );

  const isUp = data.changePct >= 0;

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
            {data.price.toLocaleString()}
          </span>
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? "+" : ""}{data.changePct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* 시세 */}
      <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
        <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">시세</h3>
        <Row label="시가" value={data.open ? data.open.toLocaleString() : "—"} />
        <Row label="고가" value={data.high ? data.high.toLocaleString() : "—"} />
        <Row label="저가" value={data.low ? data.low.toLocaleString() : "—"} />
        <Row label="거래량" value={data.volume ? data.volume.toLocaleString() : "—"} />
        <Row label="52주 최고" value={data.high52w ? data.high52w.toLocaleString() : "—"} />
        <Row label="52주 최저" value={data.low52w ? data.low52w.toLocaleString() : "—"} />
      </section>

      {/* 재무 */}
      <section className="bg-unjong-surface rounded-lg border border-unjong-border p-3 space-y-1.5">
        <h3 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1">재무</h3>
        <Row label="시가총액" value={data.marketCap > 0 ? `${(data.marketCap / 100000000).toFixed(1)}조` : "—"} />
        <Row label="PER" value={data.per > 0 ? data.per.toFixed(1) : "—"} />
        <Row label="PBR" value={data.pbr > 0 ? data.pbr.toFixed(1) : "—"} />
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-unjong-muted">{label}</span>
      <span className="font-semibold text-unjong-primary tabular-nums">{value}</span>
    </div>
  );
}
