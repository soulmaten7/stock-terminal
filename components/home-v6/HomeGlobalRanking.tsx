"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Row = { code: string; name: string; price: string; changePct: number };

function RankList({ title, rows, loading, router }: { title: string; rows: Row[]; loading: boolean; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="bg-unjong-background rounded-xl p-4">
      <h3 className="text-sm font-bold text-unjong-primary mb-2">{title}</h3>
      {loading ? <LoadingState /> : rows.length === 0 ? <EmptyState title="데이터 없음" /> : (
        <ul className="space-y-1">
          {rows.slice(0, 10).map((r, i) => {
            const up = r.changePct >= 0;
            return (
              <li key={r.code}>
                <button
                  type="button"
                  onClick={() => router.push(`/stock/${r.code}`)}
                  className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-unjong-surface transition-colors text-left"
                >
                  <span className="w-4 text-center text-sm font-bold text-unjong-muted tabular-nums flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-unjong-primary truncate">{r.name}</span>
                  <span className="text-sm text-unjong-primary tabular-nums flex-shrink-0">{r.price}</span>
                  <span className={`w-14 text-right text-xs font-semibold tabular-nums flex-shrink-0 ${up ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                    {up ? "+" : ""}{r.changePct.toFixed(1)}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function HomeGlobalRanking() {
  const router = useRouter();
  const [volume, setVolume] = useState<Row[]>([]);
  const [movers, setMovers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [vr, mv] = await Promise.all([
          fetch("/api/kis/volume-rank?sort=spike&limit=10").then((r) => r.json()).catch(() => null),
          fetch("/api/kis/movers").then((r) => r.json()).catch(() => null),
        ]);
        if (cancelled) return;
        if (vr?.stocks) {
          setVolume(vr.stocks.map((s: { symbol: string; name: string; volume: number; spike: number }) => ({
            code: s.symbol, name: s.name, price: `${s.spike?.toFixed?.(1) ?? "—"}x`, changePct: 0,
          })));
        }
        if (mv?.items) {
          setMovers(mv.items.slice(0, 10).map((m: { symbol: string; name: string; priceText: string; changePercent: number }) => ({
            code: m.symbol, name: m.name, price: m.priceText, changePct: m.changePercent,
          })));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold text-unjong-primary mr-2">실시간 랭킹</h2>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-unjong-primary text-white">국내</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RankList title="🔥 거래량 급증" rows={volume} loading={loading} router={router} />
        <RankList title="🚀 등락률 상위" rows={movers} loading={loading} router={router} />
        <div className="bg-unjong-background rounded-xl p-4">
          <h3 className="text-sm font-bold text-unjong-primary mb-2">🔎 검색 상위</h3>
          <div className="h-full min-h-[120px] flex items-center justify-center text-xs text-unjong-muted">준비 중 — 검색 집계 연동 예정</div>
        </div>
      </div>
    </section>
  );
}
