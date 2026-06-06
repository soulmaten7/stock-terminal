"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import { LoadingState } from "@/components/ui/State";

type Item = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
};

function Col({ title, items, valueKey }: { title: string; items: Item[]; valueKey: "foreignBuy" | "institutionBuy" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      <div className="border-b border-unjong-border bg-unjong-background px-4 py-3 text-sm font-bold text-unjong-primary">{title}</div>
      <ul className="divide-y divide-unjong-border">
        {items.slice(0, 10).map((it, i) => {
          const v = it[valueKey];
          const up = it.changePercent >= 0;
          return (
            <li key={it.symbol}>
              <Link href={`/stock/${it.symbol}`} className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-unjong-background">
                <span className="w-4 text-sm font-semibold tabular-nums text-unjong-muted">{i + 1}</span>
                <StockLogo code={it.symbol} name={it.name} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-unjong-primary">{it.name}</p>
                  <p className="text-xs tabular-nums text-unjong-muted">
                    {it.price.toLocaleString()}원{" "}
                    <span className={up ? "text-[#1AC267]" : "text-[#F04452]"}>
                      {up ? "+" : ""}{it.changePercent.toFixed(2)}%
                    </span>
                  </p>
                </div>
                <span className="text-sm font-bold tabular-nums text-unjong-primary">{Math.abs(v).toLocaleString()}억</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function InvestorTrend() {
  const [sort, setSort] = useState<"buy" | "sell">("buy");
  const [data, setData] = useState<{ foreignTop: Item[]; institutionTop: Item[] }>({ foreignTop: [], institutionTop: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const j = await (await fetch(`/api/kis/investor-rank?market=all&sort=${sort}`)).json();
        if (!cancelled) setData({ foreignTop: j.foreignTop ?? [], institutionTop: j.institutionTop ?? [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sort]);

  const label = sort === "buy" ? "순매수" : "순매도";

  return (
    <div>
      {/* 순매수/순매도 토글 */}
      <div className="mb-3 flex items-center gap-1.5">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              sort === s ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
            }`}
          >
            {s === "buy" ? "순매수" : "순매도"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState className="py-10" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Col title={`외국인 ${label} 상위`} items={data.foreignTop} valueKey="foreignBuy" />
          <Col title={`기관 ${label} 상위`} items={data.institutionTop} valueKey="institutionBuy" />
        </div>
      )}
    </div>
  );
}
