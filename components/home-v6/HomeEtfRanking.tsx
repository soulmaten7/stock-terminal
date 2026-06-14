"use client";

import { useEffect, useState } from "react";
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

type SortKey = "pop" | "r1m" | "r3m" | "r6m" | "r1y";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "pop", label: "거래대금순" },
  { key: "r1m", label: "1개월 수익률" },
  { key: "r3m", label: "3개월 수익률" },
  { key: "r6m", label: "6개월 수익률" },
  { key: "r1y", label: "1년 수익률" },
];

function chip(active: boolean) {
  return `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
    active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
  }`;
}
function fmtAmount(won?: number): string {
  if (!won || won <= 0) return "—";
  if (won >= 1e12) return `${(won / 1e12).toFixed(1)}조`;
  if (won >= 1e8) return `${Math.round(won / 1e8).toLocaleString()}억`;
  return won.toLocaleString();
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
  const [asset, setAsset] = useState<"etf" | "fund">(fixedAsset ?? "etf");
  const [sort, setSort] = useState<SortKey>("pop");
  const [popRows, setPopRows] = useState<Row[]>([]);
  const [perfRows, setPerfRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  useEffect(() => {
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
  }, []);

  // 정렬·자산 바뀌면 미리보기 리셋(→ 새 1위)
  useEffect(() => { setHovered(null); }, [sort, asset]);

  const isPop = sort === "pop";
  let rows: Row[] = [];
  if (asset === "etf") {
    if (isPop) rows = popRows;
    else {
      const k = sort as "r1m" | "r3m" | "r6m" | "r1y";
      rows = [...perfRows].filter((r) => r[k] != null).sort((a, b) => (b[k] as number) - (a[k] as number)).slice(0, 15);
    }
  }
  const metricLabel = isPop ? "거래대금" : SORTS.find((s) => s.key === sort)!.label;
  const previewStock = hovered ?? (rows[0] ? toHover(rows[0]) : null);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-unjong-border px-4 py-3">
        {!fixedAsset && (
          <>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setAsset("etf")} className={chip(asset === "etf")}>ETF</button>
              <button type="button" onClick={() => setAsset("fund")} className={chip(asset === "fund")}>펀드</button>
            </div>
            <span className="mx-1 h-5 w-px bg-unjong-border" />
          </>
        )}
        {asset === "etf" &&
          SORTS.map((s) => (
            <button key={s.key} type="button" onClick={() => setSort(s.key)} className={chip(sort === s.key)}>
              {s.label}
            </button>
          ))}
        <span className="ml-auto text-[11px] text-unjong-muted">
          {asset === "etf" ? (isPop ? "거래대금 순 · KRX (실시간 아님)" : "기간 수익률 · 최근 시세 기준") : ""}
        </span>
      </div>

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
        <div className="flex items-start gap-4 p-2">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
                  <th className="px-4 py-2.5 text-left font-medium">종목명</th>
                  <th className="px-4 py-2.5 text-right font-medium">현재가</th>
                  <th className="px-4 py-2.5 text-right font-medium">등락(1일)</th>
                  <th className="px-4 py-2.5 text-right font-medium">{metricLabel}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const up = r.changePercent >= 0;
                  const metric = isPop ? null : (r[sort as "r1m" | "r3m" | "r6m" | "r1y"] ?? null);
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
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${up ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                        {up ? "+" : ""}{r.changePercent.toFixed(2)}%
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${isPop ? "text-unjong-muted" : pctColor(metric)}`}>
                        {isPop ? fmtAmount(r.tradeAmount) : pct(metric)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <HomeStockDetail stock={previewStock} />
        </div>
      )}
    </section>
  );
}
