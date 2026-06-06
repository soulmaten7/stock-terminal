"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingState, EmptyState } from "@/components/ui/State";
import { StockLogo } from "@/components/ui/StockLogo";

type Row = { rank: number; symbol: string; name: string; priceText: string; changePercent: number; volume: number; tradeAmount?: number };

const COUNTRIES = [
  { key: "kr", label: "국내" },
  { key: "us", label: "미국" },
  { key: "global", label: "글로벌" },
] as const;
type CountryKey = (typeof COUNTRIES)[number]["key"];

type FilterKey = "amount" | "volume" | "cap" | "up" | "down";
type FilterDef = { key: FilterKey; label: string };

const KR_FILTERS: FilterDef[] = [
  { key: "amount", label: "거래대금" },
  { key: "volume", label: "거래량" },
  { key: "cap", label: "시가총액" },
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
];
const US_FILTERS: FilterDef[] = [
  { key: "up", label: "상승" },
  { key: "down", label: "하락" },
];

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

export type HoverStock = { symbol: string; name: string; priceText: string; changePercent: number; volume: number; tradeAmount?: number };

export default function MarketClient({ embedded = false, onHover }: { embedded?: boolean; onHover?: (s: HoverStock) => void }) {
  const router = useRouter();
  const [country, setCountry] = useState<CountryKey>("kr");
  const [filter, setFilter] = useState<FilterKey>("amount");
  const [market, setMarket] = useState<MarketKey>("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (country === "global") return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        let list: Row[] = [];
        if (country === "kr") {
          // 1순위: KRX 100개(약 20분 지연). 비거나 실패하면 2순위: KIS 30개 fallback.
          const krxUrl = `/api/krx/ranking?market=${market}&sort=${filter}&limit=100`;
          const kisUrl =
            filter === "amount" || filter === "volume"
              ? `/api/kis/volume-rank?market=${market}&sort=${filter}&limit=100`
              : filter === "cap"
              ? `/api/kis/market-cap?market=${market}&limit=100`
              : `/api/kis/movers?dir=${filter}&market=${market}&limit=100`;
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
          list = raw.map((s, i: number) => ({
            rank: typeof s.rank === "number" ? s.rank : i + 1,
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
          }));
        } else {
          const dir = filter === "down" ? "down" : "up";
          const j = await (await fetch(`/api/yahoo/us-movers?dir=${dir}&count=100`)).json();
          list = (j.items ?? []).map((s: Record<string, unknown>, i: number) => ({
            rank: i + 1,
            symbol: String(s.code ?? ""),
            name: String(s.name ?? ""),
            priceText: String(s.price ?? "—"),
            changePercent: Number(s.changePct ?? 0),
            volume: Number(s.volume ?? 0),
          }));
        }
        if (!cancelled) setRows(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country, filter, market]);

  const filters = country === "us" ? US_FILTERS : KR_FILTERS;

  return (
    <div className={embedded ? "" : "px-4 py-6"}>
      {!embedded && (
        <header className="mb-4">
          <h1 className="text-xl font-bold text-unjong-primary">마켓</h1>
          <p className="mt-1 text-sm text-unjong-muted">실시간 랭킹 — 종목 클릭 시 상세로. (시총·52주 필터·히트맵은 순차 확장)</p>
        </header>
      )}

      {/* 국가 탭 */}
      <div className="flex items-center gap-2 border-b border-unjong-border mb-4">
        {COUNTRIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCountry(c.key);
              setFilter(c.key === "us" ? "up" : "amount");
              setMarket("all");
            }}
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

      {country === "global" ? (
        <EmptyState icon="🛠️" title="글로벌 마켓 준비 중" description="순차 확장 예정 (STEP 154~)." className="py-12" />
      ) : (
        <>
          {/* 시장 필터 (국내만) */}
          {country === "kr" && (
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
          )}

          {/* 랭킹 필터 (국가별) */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {filters.map((f) => (
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

          {country === "kr" && (
            <p className="text-xs text-unjong-muted mb-2">국내 시세 KRX 기준 · 최대 약 20분 지연 (실시간 아님)</p>
          )}
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
                    {country === "kr" && <th className="text-right font-medium px-4 py-2.5 hidden md:table-cell">거래대금</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const up = r.changePercent >= 0;
                    return (
                      <tr
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}`)}
                        onMouseEnter={() => onHover?.({ symbol: r.symbol, name: r.name, priceText: r.priceText, changePercent: r.changePercent, volume: r.volume, tradeAmount: r.tradeAmount })}
                        className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                      >
                        <td className="px-4 py-3 text-unjong-muted tabular-nums">{r.rank}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <StockLogo code={r.symbol} name={r.name} size={28} />
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.priceText}</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-semibold ${up ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                          {up ? "+" : ""}{r.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-unjong-muted hidden md:table-cell">
                          {r.volume ? r.volume.toLocaleString() : "—"}
                        </td>
                        {country === "kr" && (
                          <td className="px-4 py-3 text-right tabular-nums text-unjong-muted hidden md:table-cell">
                            {fmtAmount(r.tradeAmount)}
                          </td>
                        )}
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
