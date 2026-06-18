"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "@/components/home-v6/HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";

type TypeKey = "주식" | "ETF" | "리츠" | "미국" | "ETN";
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
  type: TypeKey;
};
type PerfItem = Omit<Row, "type">;

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

type FilterKey = "all" | TypeKey;
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "주식", label: "주식" },
  { key: "ETF", label: "ETF" },
  { key: "ETN", label: "ETN" },
  { key: "리츠", label: "리츠" },
  { key: "미국", label: "미국" },
];
const TYPE_BADGE: Record<TypeKey, string> = {
  주식: "bg-unjong-background text-[#3182F6]",
  ETF: "bg-unjong-background text-[#12B886]",
  리츠: "bg-unjong-background text-[#7048E8]",
  미국: "bg-unjong-background text-[#F76707]",
  ETN: "bg-unjong-background text-[#1098AD]",
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
function priceText(r: Row): string {
  return r.type === "미국" ? `$${r.price.toLocaleString()}` : r.price.toLocaleString();
}
function toHover(r: Row): HoverStock {
  return { symbol: r.symbol, name: r.name, priceText: priceText(r), changePercent: r.changePercent, volume: 0 };
}

export default function MarketDirectoryClient() {
  const router = useRouter();
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [typeFilter, setTypeFilter] = useState<FilterKey>("all");
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const grab = (path: string): Promise<PerfItem[]> =>
        fetch(path)
          .then((r) => r.json())
          .then((j) => (j.items ?? []) as PerfItem[])
          .catch(() => [] as PerfItem[]);
      const [kr, etf, reit, us, etn] = await Promise.all([
        grab("/api/yahoo/kr-performance"),
        grab("/api/yahoo/etf-performance"),
        grab("/api/yahoo/reit-performance"),
        grab("/api/yahoo/us-performance"),
        grab("/api/krx/etn-performance"),
      ]);
      const combined: Row[] = [
        ...kr.map((x) => ({ ...x, type: "주식" as TypeKey })),
        ...etf.map((x) => ({ ...x, type: "ETF" as TypeKey })),
        ...reit.map((x) => ({ ...x, type: "리츠" as TypeKey })),
        ...us.map((x) => ({ ...x, type: "미국" as TypeKey })),
        ...etn.map((x) => ({ ...x, type: "ETN" as TypeKey })),
      ];
      if (!cancelled) {
        setAllRows(combined);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setHovered(null);
  }, [period, typeFilter]);

  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  const field = FIELD[period];

  const rows = useMemo(() => {
    return allRows
      .filter((r) => (typeFilter === "all" ? true : r.type === typeFilter))
      .filter((r) => r[field] != null)
      .sort((a, b) => (b[field] as number) - (a[field] as number))
      .slice(0, 60);
  }, [allRows, field, typeFilter]);

  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

  return (
    <div className="px-6 py-5">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-unjong-primary">상품 리스트</h1>
        <p className="mt-1 text-sm text-unjong-muted">모든 투자상품을 같은 기간 수익률 자로 가로질러 — 중립 성적표. 종목 클릭 시 상세로.</p>
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setTypeFilter(f.key)} className={chip(typeFilter === f.key)}>
            {f.label}
          </button>
        ))}
        <span className="mx-1.5 h-5 w-px bg-unjong-border" />
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {loading ? (
            <LoadingState className="py-10" />
          ) : rows.length === 0 ? (
            <EmptyState title="데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">순위</th>
                    <th className="px-4 py-2.5 text-left font-medium w-full">종목명</th>
                    <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel}전 대비</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const v = r[field];
                    return (
                      <tr
                        key={`${r.type}-${r.symbol}`}
                        onClick={() => router.push(`/stock/${r.symbol}?name=${encodeURIComponent(r.name)}`)}
                        onMouseEnter={() => setHovered(toHover(r))}
                        className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
                      >
                        <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${TYPE_BADGE[r.type]}`}>{r.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{priceText(r)}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>
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
