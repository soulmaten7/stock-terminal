"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Row = { rank: number; symbol: string; name: string; price: number; changePercent: number; volume: number; tradeAmount?: number };

const COUNTRIES = [
  { key: "kr", label: "국내" },
  { key: "us", label: "미국" },
  { key: "global", label: "글로벌" },
] as const;
type CountryKey = (typeof COUNTRIES)[number]["key"];

const FILTERS = [
  { key: "amount", label: "거래대금" },
  { key: "volume", label: "거래량" },
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

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

export default function MarketClient() {
  const router = useRouter();
  const [country, setCountry] = useState<CountryKey>("kr");
  const [filter, setFilter] = useState<FilterKey>("amount");
  const [market, setMarket] = useState<MarketKey>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (country !== "kr") return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const url =
          filter === "amount" || filter === "volume"
            ? `/api/kis/volume-rank?market=${market}&sort=${filter}&limit=30`
            : `/api/kis/movers?dir=${filter}&market=${market}&limit=30`;
        const j = await (await fetch(url)).json();
        if (cancelled) return;
        const list: Row[] = (j.stocks ?? j.items ?? []).map((s: Record<string, unknown>, i: number) => ({
          rank: typeof s.rank === "number" ? s.rank : i + 1,
          symbol: String(s.symbol ?? ""),
          name: String(s.name ?? ""),
          price: Number(s.price ?? 0),
          changePercent: Number(s.changePercent ?? 0),
          volume: Number(s.volume ?? 0),
          tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
        }));
        setRows(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country, filter, market]);

  return (
    <div className="max-w-[1480px] mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
        <p className="mt-1 text-sm text-unjong-muted">실시간 랭킹 — 종목 클릭 시 상세로. (시장지표·히트맵은 순차 확장)</p>
      </header>

      {/* 국가 탭 */}
      <div className="flex items-center gap-2 border-b border-unjong-border mb-4">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCountry(c.key)}
            className={
              country === c.key
                ? "px-3 py-2 text-sm font-bold text-unjong-primary border-b-2 border-unjong-primary -mb-px"
                : "px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary border-b-2 border-transparent -mb-px"
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {country !== "kr" ? (
        <EmptyState
          icon="🛠️"
          title={`${COUNTRIES.find((c) => c.key === country)?.label} 마켓 준비 중`}
          description="순차 확장 예정 (STEP 153~)."
          className="py-12"
        />
      ) : (
        <>
          {/* 시장 필터 */}
          <div className="flex items-center gap-1.5 mb-3">
            {MARKETS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMarket(m.key)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  market === m.key ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* 랭킹 필터 */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  filter === f.key ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 랭킹 테이블 */}
          <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft overflow-hidden">
            {loading ? (
              <LoadingState className="py-10" />
            ) : rows.length === 0 ? (
              <EmptyState title="데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-unjong-muted border-b border-unjong-border">
                    <th className="text-left font-medium px-4 py-2.5 w-12">순위</th>
                    <th className="text-left font-medium px-4 py-2.5">종목명</th>
                    <th className="text-right font-medium px-4 py-2.5">현재가</th>
                    <th className="text-right font-medium px-4 py-2.5">전일대비</th>
                    <th className="text-right font-medium px-4 py-2.5 hidden md:table-cell">거래량</th>
                    <th className="text-right font-medium px-4 py-2.5 hidden md:table-cell">거래대금</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const up = r.changePercent >= 0;
                    return (
                      <tr
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}`)}
                        className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                      >
                        <td className="px-4 py-3 text-unjong-muted tabular-nums">{r.rank}</td>
                        <td className="px-4 py-3 font-medium text-unjong-primary">{r.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.price.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${up ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                          {up ? "+" : ""}{r.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-muted hidden md:table-cell">
                          {r.volume ? r.volume.toLocaleString() : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-muted hidden md:table-cell">
                          {fmtAmount(r.tradeAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
