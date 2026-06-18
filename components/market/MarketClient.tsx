"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { StockLogo } from "@/components/ui/StockLogo";
import { Heart } from "lucide-react";
import { useWatchlist } from "@/stores/watchlistStore";
import { useChartRange } from "@/stores/chartRangeStore";

type Row = {
  rank: number;
  symbol: string;
  name: string;
  priceText: string;
  changePercent: number; // 1일전 대비(현재 등락률)
  volume: number;
  tradeAmount?: number;
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
  marketCap?: number;
};

type PerfRow = { symbol: string; r1w?: number | null; r1m?: number | null; r3m?: number | null; r6m?: number | null; r1y?: number | null };

const COUNTRIES = [
  { key: "kr", label: "국내" },
  { key: "us", label: "미국" },
] as const;
type CountryKey = (typeof COUNTRIES)[number]["key"];

type PeriodKey = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주일" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "6m", label: "6개월" },
  { key: "1y", label: "1년" },
];
const PERIOD_FIELD: Record<PeriodKey, "changePercent" | "r1w" | "r1m" | "r3m" | "r6m" | "r1y"> = {
  "1d": "changePercent",
  "1w": "r1w",
  "1m": "r1m",
  "3m": "r3m",
  "6m": "r6m",
  "1y": "r1y",
};

const MARKETS = [
  { key: "all", label: "전체" },
  { key: "kospi", label: "코스피" },
  { key: "kosdaq", label: "코스닥" },
] as const;
type MarketKey = (typeof MARKETS)[number]["key"];

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

export type HoverStock = { symbol: string; name: string; priceText: string; changePercent: number; volume: number; tradeAmount?: number };

export default function MarketClient({ embedded = false, onHover, detailSlot }: { embedded?: boolean; onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const watchItems = useWatchlist((s) => s.items);
  const addWatch = useWatchlist((s) => s.add);
  const removeWatch = useWatchlist((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isWatched = (code: string) => watchItems.some((i) => i.code === code);
  const [country, setCountry] = useState<CountryKey>("kr");
  const [period, setPeriod] = useState<PeriodKey>("1d");
  const [market, setMarket] = useState<MarketKey>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { useChartRange.getState().setRange(period); }, [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (country === "kr") {
          const krxUrl = `/api/krx/ranking?market=${market}&sort=amount&limit=100`;
          const kisUrl = `/api/kis/volume-rank?market=${market}&sort=amount&limit=100`;
          let raw: Record<string, unknown>[] = [];
          try {
            const j = await (await fetch(krxUrl)).json();
            raw = (j.stocks ?? []) as Record<string, unknown>[];
          } catch {
            raw = [];
          }
          if (raw.length === 0) {
            const j = await (await fetch(kisUrl)).json();
            raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
          }
          // 1단계: KRX(1일) 즉시 표시 — 기간 칸은 일단 "—"
          const base: Row[] = raw.map((s, i: number) => ({
            rank: typeof s.rank === "number" ? s.rank : i + 1,
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
            marketCap: typeof s.marketCap === "number" ? s.marketCap : undefined,
          }));
          if (!cancelled) { setRows(base); setLoading(false); }
          // 2단계: 기간 수익률 병합 (느려도 1일은 이미 보임 · 실패 시 무시)
          try {
            const j = await (await fetch("/api/yahoo/kr-performance")).json();
            const perfMap: Record<string, PerfRow> = {};
            for (const it of (j.items ?? []) as PerfRow[]) if (it.symbol) perfMap[String(it.symbol)] = it;
            if (!cancelled) {
              setRows((prev) =>
                prev.map((r) => {
                  const p = perfMap[r.symbol];
                  return p
                    ? { ...r, r1w: p.r1w ?? undefined, r1m: p.r1m ?? undefined, r3m: p.r3m ?? undefined, r6m: p.r6m ?? undefined, r1y: p.r1y ?? undefined }
                    : r;
                })
              );
            }
          } catch {
            /* 기간 수익률 실패 → "—" 유지 */
          }
        } else {
          const j = await (await fetch(`/api/yahoo/us-movers?dir=up&count=100`)).json();
          // 1단계: us-movers(1일) 즉시 표시
          const base: Row[] = (j.items ?? []).map((s: Record<string, unknown>, i: number) => ({
            rank: i + 1,
            symbol: String(s.code ?? ""),
            name: String(s.name ?? ""),
            priceText: String(s.price ?? "—"),
            changePercent: Number(s.changePct ?? 0),
            volume: Number(s.volume ?? 0),
          }));
          if (!cancelled) { setRows(base); setLoading(false); }
          // 2단계: 기간 수익률 병합 (티커 기준 · 실패 시 무시)
          try {
            const pj = await (await fetch("/api/yahoo/us-performance")).json();
            const perfMap: Record<string, PerfRow> = {};
            for (const it of (pj.items ?? []) as PerfRow[]) if (it.symbol) perfMap[String(it.symbol)] = it;
            if (!cancelled) {
              setRows((prev) =>
                prev.map((r) => {
                  const p = perfMap[r.symbol];
                  return p
                    ? { ...r, r1w: p.r1w ?? undefined, r1m: p.r1m ?? undefined, r3m: p.r3m ?? undefined, r6m: p.r6m ?? undefined, r1y: p.r1y ?? undefined }
                    : r;
                })
              );
            }
          } catch {
            /* 기간 수익률 실패 → "—" 유지 */
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country, market]);

  const field = PERIOD_FIELD[period];
  const periodLabel = PERIODS.find((p) => p.key === period)!.label;

  // 클라이언트 정렬: 선택 기간 수익률 내림차순(미연동 undefined는 뒤로).
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return bv - av;
    });
  }, [rows, field]);

  const chip = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
    }`;

  return (
    <div className={embedded ? "" : "px-4 py-6"}>
      {!embedded && (
        <header className="mb-4">
          <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
          <p className="mt-1 text-sm text-unjong-muted">기간 수익률 성적표 — 기간칩으로 구간 선택. (대표 종목 1주~1년 실데이터)</p>
        </header>
      )}


      <div className={embedded ? "grid grid-cols-1 gap-4 xl:grid-cols-3" : ""}>
          <section className={`overflow-hidden xl:overflow-visible rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft ${embedded ? "min-w-0 xl:col-span-2" : ""}`}>
            {/* 필터 헤더 바 — 좌: 국가·시장 / 우: 기간칩 */}
            <div className="sticky top-[74px] z-20 flex flex-wrap items-center gap-x-1 gap-y-2 border-b border-unjong-border bg-unjong-surface px-3 py-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => { setCountry(c.key); setPeriod("1d"); setMarket("all"); }}
                  className={chip(country === c.key)}
                >
                  {c.label}
                </button>
              ))}
              {country === "kr" && <span className="mx-1.5 h-5 w-px bg-unjong-border" />}
              {country === "kr" &&
                MARKETS.map((m) => (
                  <button key={m.key} type="button" onClick={() => setMarket(m.key)} className={chip(market === m.key)}>
                    {m.label}
                  </button>
                ))}
              <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1 gap-y-2">
                {PERIODS.map((p) => (
                  <button key={p.key} type="button" onClick={() => setPeriod(p.key)} className={chip(period === p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <LoadingState className="py-10" />
            ) : sortedRows.length === 0 ? (
              <EmptyState title="데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
            ) : (
              <div className="overflow-x-auto xl:overflow-visible">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sticky top-[118px] z-10 bg-unjong-surface text-xs text-unjong-muted border-b border-unjong-border">
                      <th className="w-8 px-2 py-2.5"></th>
                      <th className="text-left font-medium px-3 py-2.5 whitespace-nowrap">순위</th>
                      <th className="text-left font-medium px-3 py-2.5 w-full">종목명</th>
                      <th className="text-right font-medium px-3 py-2.5 whitespace-nowrap">현재가</th>
                      <th className="text-right font-medium px-3 py-2.5 whitespace-nowrap">{periodLabel}전 대비</th>
                      {!embedded && <th className="text-right font-medium px-3 py-2.5 whitespace-nowrap">시총</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r, i) => {
                      const v = r[field];
                      return (
                        <tr
                          key={r.symbol}
                          onClick={() => onHover?.({ symbol: r.symbol, name: r.name, priceText: r.priceText, changePercent: r.changePercent, volume: r.volume, tradeAmount: r.tradeAmount })}
                          className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                        >
                          <td className="px-2 py-3">
                            <button
                              type="button"
                              aria-label="관심 토글"
                              className="p-0.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isWatched(r.symbol)) removeWatch(r.symbol);
                                else addWatch({ code: r.symbol, name: r.name, market: country === "us" ? "US" : "KOSPI" });
                              }}
                            >
                              <Heart
                                size={15}
                                fill={mounted && isWatched(r.symbol) ? "currentColor" : "none"}
                                className={mounted && isWatched(r.symbol) ? "text-[#3182F6]" : "text-unjong-muted hover:text-[#3182F6]"}
                              />
                            </button>
                          </td>
                          <td className="px-3 py-3 text-unjong-muted tabular-nums">{i + 1}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2.5 whitespace-nowrap">
                              <StockLogo code={r.symbol} name={r.name} size={28} />
                              <span className="font-medium text-unjong-primary">{r.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-unjong-primary whitespace-nowrap">{r.priceText}</td>
                          <td className={`px-3 py-3 text-right tabular-nums font-semibold whitespace-nowrap ${pctColor(v)}`}>{pct(v)}</td>
                          {!embedded && (
                            <td className="px-3 py-3 text-right tabular-nums text-unjong-muted whitespace-nowrap">{fmtAmount(r.marketCap)}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {embedded && detailSlot}
        </div>
    </div>
  );
}
