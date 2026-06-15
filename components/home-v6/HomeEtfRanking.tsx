"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";
import HomeStockDetail from "./HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";

type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  tradeAmount?: number;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
};

const ETF_RE = /^(KODEX|TIGER|KBSTAR|RISE|ARIRANG|PLUS|ACE|KINDEX|SOL|HANARO|KOSEF|TIMEFOLIO|WOORI|KCGI|BNK|파워|TREX|FOCUS|히어로즈|네비게이터|마이티|WON|KIWOOM)/i;

type PeriodKey = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];
const PERF_FIELD: Partial<Record<PeriodKey, "r1m" | "r3m" | "r6m" | "r1y">> = {
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
  return { symbol: r.symbol, name: r.name, priceText: r.price.toLocaleString(), changePercent: r.changePercent, volume: 0, tradeAmount: r.tradeAmount };
}

export default function HomeEtfRanking({ fixedAsset }: { fixedAsset?: "etf" | "fund" } = {}) {
  const router = useRouter();
  const asset = fixedAsset ?? "etf";
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [popRows, setPopRows] = useState<Row[]>([]);
  const [perfRows, setPerfRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  useEffect(() => {
    if (asset !== "etf") { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const popP = (async () => {
        try {
          const j = await (await fetch("/api/kis/volume-rank?market=all&sort=amount&limit=100")).json();
          const raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
          return raw
            .map((s) => ({
              symbol: String(s.symbol ?? ""),
              name: String(s.name ?? ""),
              price: Number(s.price ?? 0),
              changePercent: Number(s.changePercent ?? 0),
              tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
            }))
            .filter((r) => r.name && ETF_RE.test(r.name))
            .slice(0, 15) as Row[];
        } catch {
          return [] as Row[];
        }
      })();
      const perfP = (async () => {
        try {
          const j = await (await fetch("/api/yahoo/etf-performance")).json();
          return (j.items ?? []) as Row[];
        } catch {
          return [] as Row[];
        }
      })();
      const [pop, perf] = await Promise.all([popP, perfP]);
      if (!cancelled) {
        setPopRows(pop);
        setPerfRows(perf);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [asset]);

  useEffect(() => { setHovered(null); }, [period]);

  const periodLabel = PERIODS.find((p) => p.key === period)!.label;

  const rows = useMemo(() => {
    if (period === "1d") {
      return [...popRows].sort((a, b) => b.changePercent - a.changePercent);
    }
    const f = PERF_FIELD[period];
    if (!f) return perfRows.slice(0, 15);
    return [...perfRows]
      .filter((r) => r[f] != null)
      .sort((a, b) => (b[f] as number) - (a[f] as number))
      .slice(0, 15);
  }, [period, popRows, perfRows]);

  const rowVal = (r: Row): number | null | undefined => {
    if (period === "1d") return r.changePercent;
    const f = PERF_FIELD[period];
    return f ? r[f] : undefined;
  };

  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

  return (
    <div>
      {/* 기간칩 (위, 풀폭 — 주식과 동일 위치/스타일) */}
      <div className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-2">
        {PERIODS.map((p) => (
          <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
            {p.label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-unjong-muted">
          {asset === "etf" ? (period === "1d" ? "거래대금 상위 · KRX (실시간 아님)" : "기간 수익률 · 최근 시세 기준") : ""}
        </span>
      </div>

      {/* 주식 embedded와 동일: 테이블 카드(2/3) + 미리보기(1/3, wide) */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft min-w-0 xl:col-span-2">
          {asset === "fund" ? (
            <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
              <span className="mb-2 text-2xl">🗂️</span>
              <p className="text-sm font-medium text-unjong-primary">펀드 랭킹은 준비 중이에요</p>
              <p className="mt-1 text-xs text-unjong-muted">펀드 데이터 소스 연동 후 ETF와 같은 방식으로 제공해요</p>
            </div>
          ) : loading ? (
            <LoadingState className="py-10" />
          ) : rows.length === 0 ? (
            <EmptyState title="ETF 데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                    <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
                    <th className="px-4 py-2.5 text-left font-medium">종목명</th>
                    <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{periodLabel}전 대비</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const v = rowVal(r);
                    return (
                      <tr
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}`)}
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
