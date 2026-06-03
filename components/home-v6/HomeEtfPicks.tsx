"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Etf = {
  id: string;
  ticker: string | null;
  name: string;
  issuer: string | null;
  fee_pct: number | null;
  discussion_count: number;
};

// 좌측 필터 — '인기'만 실데이터(discussion_count), 나머지는 데이터 보유 전까지 준비 중
const FILTERS = [
  { key: "popular", label: "인기 평가순", ready: true },
  { key: "volume", label: "거래대금 많은", ready: false },
  { key: "up", label: "많이 오른", ready: false },
  { key: "index", label: "지수 추종", ready: false },
  { key: "dividend", label: "배당", ready: false },
];

export default function HomeEtfPicks() {
  const [items, setItems] = useState<Etf[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("popular");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await createAnonClient()
          .from("products")
          .select("id, ticker, name, issuer, fee_pct, discussion_count")
          .eq("category", "etf")
          .eq("hidden", false)
          .order("discussion_count", { ascending: false })
          .limit(10);
        if (!cancelled) setItems((data || []) as Etf[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const cur = FILTERS.find((f) => f.key === filter);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <h2 className="text-lg font-bold text-unjong-primary mb-3">요즘 주목할 ETF</h2>
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
        {/* 좌측 필터 */}
        <div className="flex md:flex-col gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => f.ready && setFilter(f.key)}
              className={`text-sm px-3 py-1.5 rounded-lg text-left transition-colors ${
                filter === f.key ? "bg-unjong-accent text-white font-semibold" : "text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
              } ${!f.ready ? "opacity-50 cursor-default" : ""}`}
              title={f.ready ? "" : "준비 중"}
            >
              {f.label}{!f.ready && " ·준비중"}
            </button>
          ))}
        </div>

        {/* 우측 리스트 */}
        <div>
          {loading ? (
            <LoadingState />
          ) : !cur?.ready ? (
            <EmptyState title="준비 중" description="해당 정렬 데이터 연동 예정" />
          ) : items.length === 0 ? (
            <EmptyState icon="💼" title="등록된 ETF 가 없습니다" />
          ) : (
            <ul className="space-y-2">
              {items.map((e, i) => (
                <li key={e.id}>
                  <Link href={`/product/${e.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-unjong-background hover:bg-unjong-surface border border-transparent hover:border-unjong-accent transition-colors">
                    <span className="w-4 text-center text-sm font-bold text-unjong-muted tabular-nums">{i + 1}</span>
                    {e.ticker && <span className="text-xs font-mono text-unjong-muted flex-shrink-0">{e.ticker}</span>}
                    <span className="flex-1 text-sm font-semibold text-unjong-primary truncate">{e.name}</span>
                    <span className="text-xs text-unjong-muted truncate flex-shrink-0">{e.issuer ?? ""}</span>
                    {e.fee_pct !== null && <span className="text-xs text-unjong-muted flex-shrink-0">{(e.fee_pct * 100).toFixed(2)}%</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
