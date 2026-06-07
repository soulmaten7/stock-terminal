"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Row = { symbol: string; name: string; priceText: string; changePercent: number; volume: number; tradeAmount?: number };

// ETF 식별 — 주요 운용사 브랜드 접두
const ETF_RE = /^(KODEX|TIGER|KBSTAR|RISE|ARIRANG|PLUS|ACE|KINDEX|SOL|HANARO|KOSEF|TIMEFOLIO|WOORI|KCGI|BNK|파워|TREX|FOCUS|히어로즈|네비게이터|마이티|WON|KIWOOM)/i;

function fmtAmount(won?: number): string {
  if (!won || won <= 0) return "—";
  if (won >= 1e12) return `${(won / 1e12).toFixed(1)}조`;
  if (won >= 1e8) return `${Math.round(won / 1e8).toLocaleString()}억`;
  return won.toLocaleString();
}

export default function HomeEtfRanking() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const j = await (await fetch("/api/kis/volume-rank?market=all&sort=amount&limit=100")).json();
        const raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
        const list: Row[] = raw
          .map((s) => ({
            symbol: String(s.symbol ?? ""),
            name: String(s.name ?? ""),
            priceText: Number(s.price ?? 0).toLocaleString(),
            changePercent: Number(s.changePercent ?? 0),
            volume: Number(s.volume ?? 0),
            tradeAmount: typeof s.tradeAmount === "number" ? s.tradeAmount : undefined,
          }))
          .filter((r) => r.name && ETF_RE.test(r.name))
          .slice(0, 15);
        if (!cancelled) setRows(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="flex items-baseline gap-2 border-b border-unjong-border px-4 py-3">
        <h3 className="text-sm font-bold text-unjong-primary">인기 ETF</h3>
        <span className="text-xs text-unjong-muted">거래대금 순 · KRX (실시간 아님)</span>
      </div>
      {loading ? (
        <LoadingState className="py-10" />
      ) : rows.length === 0 ? (
        <EmptyState title="ETF 데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-unjong-border text-xs text-unjong-muted">
              <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
              <th className="px-4 py-2.5 text-left font-medium">종목명</th>
              <th className="px-4 py-2.5 text-right font-medium">현재가</th>
              <th className="px-4 py-2.5 text-right font-medium">등락률</th>
              <th className="hidden px-4 py-2.5 text-right font-medium md:table-cell">거래대금</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const up = r.changePercent >= 0;
              return (
                <tr
                  key={r.symbol}
                  onClick={() => router.push(`/stock/${r.symbol}`)}
                  className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background"
                >
                  <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <StockLogo code={r.symbol} name={r.name} size={28} />
                      <span className="font-medium text-unjong-primary">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{r.priceText}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${up ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                    {up ? "+" : ""}{r.changePercent.toFixed(2)}%
                  </td>
                  <td className="hidden px-4 py-3 text-right tabular-nums text-unjong-muted md:table-cell">{fmtAmount(r.tradeAmount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
