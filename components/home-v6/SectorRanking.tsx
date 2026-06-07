"use client";

import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Sector = { code: string; name: string; index: number; changePercent: number; tradeAmount: number };

export default function SectorRanking() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/kis/sector-rank")).json();
        if (!cancelled) setSectors(j.sectors ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
      {loading ? (
        <LoadingState className="py-10" />
      ) : sectors.length === 0 ? (
        <EmptyState title="업종 데이터 없음" description="잠시 후 다시 시도해 주세요." className="py-10" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-unjong-border text-xs text-unjong-muted">
              <th className="w-12 px-4 py-2.5 text-left font-medium">순위</th>
              <th className="px-4 py-2.5 text-left font-medium">업종</th>
              <th className="px-4 py-2.5 text-right font-medium">지수</th>
              <th className="px-4 py-2.5 text-right font-medium">등락률</th>
            </tr>
          </thead>
          <tbody>
            {sectors.map((s, i) => {
              const up = s.changePercent >= 0;
              return (
                <tr key={s.code} className="border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                  <td className="px-4 py-3 tabular-nums text-unjong-muted">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-unjong-primary">{s.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-unjong-primary">{s.index.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${up ? "text-[#F04452]" : "text-[#3182F6]"}`}>
                    {up ? "+" : ""}{s.changePercent.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
