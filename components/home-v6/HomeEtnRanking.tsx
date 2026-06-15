"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "./HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";

type Etn = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  tradeAmount: number;
  marketCap: number;
};

type SortKey = "tradeAmount" | "changePercent";

function pct(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}
function pctColor(v: number): string {
  return v >= 0 ? "text-[#F04452]" : "text-[#3182F6]";
}
function won(v: number): string {
  if (v >= 1e8) return `${(v / 1e8).toFixed(v >= 1e9 ? 0 : 1)}억`;
  if (v >= 1e4) return `${Math.round(v / 1e4).toLocaleString()}만`;
  return v.toLocaleString();
}
function toHover(r: Etn): HoverStock {
  return { symbol: r.symbol, name: r.name, priceText: r.price.toLocaleString(), changePercent: r.changePercent, volume: r.volume };
}
function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}

export default function HomeEtnRanking() {
  const router = useRouter();
  const [all, setAll] = useState<Etn[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("tradeAmount");
  const [hovered, setHovered] = useState<HoverStock | null>(null);
  const [basDd, setBasDd] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const j = await (await fetch("/api/krx/etn")).json();
        if (!cancelled) {
          setAll((j.etns ?? []) as Etn[]);
          setBasDd(String(j.basDd ?? ""));
        }
      } catch {
        if (!cancelled) setAll([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setHovered(null);
  }, [sort]);

  const rows = useMemo(() => {
    return [...all]
      .sort((a, b) => (sort === "tradeAmount" ? b.tradeAmount - a.tradeAmount : b.changePercent - a.changePercent))
      .slice(0, 20);
  }, [all, sort]);

  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);
  const dateLabel = basDd.length === 8 ? `${basDd.slice(4, 6)}/${basDd.slice(6, 8)}` : "";

  return (
    <div>
      {/* 정렬칩 (주식·ETF 기간칩과 동일 스타일) + 기준 안내 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        <button type="button" onClick={() => setSort("tradeAmount")} className={chip(sort === "tradeAmount")}>
          거래대금순
        </button>
        <button type="button" onClick={() => setSort("changePercent")} className={chip(sort === "changePercent")}>
          1일 등락순
        </button>
        <span className="ml-auto text-[11px] text-unjong-muted">
          ETN 1일 시세{dateLabel ? ` · ${dateLabel} 기준` : ""} · 기간 수익률 미제공
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {loading ? (
            <LoadingState className="py-10" />
          ) : rows.length === 0 ? (
            <EmptyState title="ETN 데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
                    <th className="px-4 py-2.5 text-left font-medium">종목명</th>
                    <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">1일 대비</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">거래대금</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={r.symbol}
                      onClick={() => router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)}
                      onMouseEnter={() => setHovered(toHover(r))}
                      className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
                    >
                      <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <StockLogo code={r.symbol} name={r.name} size={28} />
                          <span className="font-medium text-unjong-primary">{r.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.price.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${pctColor(r.changePercent)}`}>{pct(r.changePercent)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-unjong-muted">{won(r.tradeAmount)}</td>
                    </tr>
                  ))}
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
