"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { useWatchlist } from "@/stores/watchlistStore";
import HomeStockDetail from "./HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";

type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
};

type PeriodKey = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];
const FIELD: Record<PeriodKey, "changePercent" | "r1w" | "r1m" | "r3m" | "r6m" | "r1y"> = {
  "1d": "changePercent",
  "1w": "r1w",
  "1m": "r1m",
  "3m": "r3m",
  "6m": "r6m",
  "1y": "r1y",
};

function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}
function pct(v?: number | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return "text-unjong-muted";
  return v >= 0 ? "text-[#F04452]" : "text-[#3182F6]";
}
function toHover(r: Row): HoverStock {
  return { symbol: r.symbol, name: r.name, priceText: r.price.toLocaleString(), changePercent: r.changePercent, volume: 0 };
}

export default function HomePerfRanking({ apiPath, emptyLabel }: { apiPath: string; emptyLabel: string }) {
  const router = useRouter();
  const watchItems = useWatchlist((s) => s.items);
  const addWatch = useWatchlist((s) => s.add);
  const removeWatch = useWatchlist((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isWatched = (code: string) => watchItems.some((i) => i.code === code);
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const j = await (await fetch(apiPath)).json();
        if (!cancelled) setAllRows((j.items ?? []) as Row[]);
      } catch {
        if (!cancelled) setAllRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [apiPath]);

  useEffect(() => { setHovered(null); }, [period]);

  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  const field = FIELD[period];

  const rows = useMemo(() => {
    return [...allRows]
      .filter((r) => r[field] != null)
      .sort((a, b) => (b[field] as number) - (a[field] as number))
      .slice(0, 20);
  }, [allRows, field]);

  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

  return (
    <div>
      {/* 기간칩 (위, 풀폭 — 주식·ETF와 동일) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-unjong-muted">기간 수익률 · 최근 시세 기준</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {loading ? (
            <LoadingState className="py-10" />
          ) : rows.length === 0 ? (
            <EmptyState title={`${emptyLabel} 데이터 없음`} description="잠시 후 다시 시도해 주세요." className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="w-8 px-2 py-2.5"></th>
                    <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">순위</th>
                    <th className="px-3 py-2.5 text-left font-medium w-full">종목명</th>
                    <th className="px-3 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-3 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel}전 대비</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const v = r[field];
                    return (
                      <tr
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)}
                        onMouseEnter={() => setHovered(toHover(r))}
                        className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
                      >
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            aria-label="관심 토글"
                            className="p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWatched(r.symbol)) removeWatch(r.symbol);
                              else addWatch({ code: r.symbol, name: r.name, market: "KOSPI" });
                            }}
                          >
                            <Heart
                              size={15}
                              fill={mounted && isWatched(r.symbol) ? "currentColor" : "none"}
                              className={mounted && isWatched(r.symbol) ? "text-[#3182F6]" : "text-unjong-muted hover:text-[#3182F6]"}
                            />
                          </button>
                        </td>
                        <td className="px-3 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-unjong-primary">{r.price.toLocaleString()}</td>
                        <td className={`px-3 py-3 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <HomeStockDetail stock={previewStock} wide />
      </div>
    </div>
  );
}
