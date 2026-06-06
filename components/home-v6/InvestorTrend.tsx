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
      <div className="border-b border-unjong-border bg-unjong-background px-4 py-3">
        <span className="text-sm font-bold text-unjong-primary">
          {title} <span className="text-xs font-normal text-unjong-muted">순매수 상위 (억)</span>
        </span>
      </div>
      <ul className="divide-y divide-unjong-border">
        {items.slice(0, 10).map((it, i) => {
          const v = it[valueKey];
          return (
            <li key={it.symbol}>
              <Link href={`/stock/${it.symbol}`} className="flex items-center gap-2.5 px-4 py-2 hover:bg-unjong-background">
                <span className="w-5 text-xs tabular-nums text-unjong-muted">{i + 1}</span>
                <StockLogo code={it.symbol} name={it.name} size={24} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-unjong-primary">{it.name}</span>
                <span className={`text-sm font-semibold tabular-nums ${v >= 0 ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                  {v >= 0 ? "+" : ""}{v.toLocaleString()}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function InvestorTrend() {
  const [data, setData] = useState<{ foreignTop: Item[]; institutionTop: Item[] }>({ foreignTop: [], institutionTop: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/kis/investor-rank?market=all&sort=buy")).json();
        if (!cancelled) setData({ foreignTop: j.foreignTop ?? [], institutionTop: j.institutionTop ?? [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState className="py-10" />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Col title="외국인" items={data.foreignTop} valueKey="foreignBuy" />
      <Col title="기관" items={data.institutionTop} valueKey="institutionBuy" />
    </div>
  );
}
