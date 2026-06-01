"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { MessageCircle, Eye } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Product = {
  id: string;
  category: string;
  ticker: string | null;
  name: string;
  issuer: string | null;
  description: string | null;
  fee_pct: number | null;
  discussion_count: number;
  view_count: number;
};

const CATEGORIES = [
  { value: "all", label: "전체" },
  { value: "etf", label: "ETF" },
  { value: "fund", label: "펀드" },
  { value: "wrap", label: "랩" },
  { value: "reits", label: "리츠" },
  { value: "bond", label: "채권" },
];

export default function ProductsClient() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const supabase = createAnonClient();
      let q = supabase
        .from("products")
        .select("id, category, ticker, name, issuer, description, fee_pct, discussion_count, view_count")
        .eq("hidden", false)
        .order("discussion_count", { ascending: false });
      if (category !== "all") q = q.eq("category", category);
      const { data } = await q;
      if (cancelled) return;
      setItems((data || []) as Product[]);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [category]);

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-unjong-primary mb-2">💼 금융 상품 디렉토리</h1>
        <p className="text-sm text-unjong-muted">
          ETF·펀드·랩·리츠 등 금융 상품을 사용자 리뷰와 함께 비교하세요. 운종은 평가 X, 사용자 토론 제공.
        </p>
      </header>

      <nav className="flex gap-2 mb-4 border-b border-unjong-border pb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={`text-sm px-3 py-1.5 rounded ${
              category === c.value
                ? "bg-unjong-accent text-white font-semibold"
                : "text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
            }`}
          >
            {c.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <LoadingState title="상품 로딩 중..." />
      ) : items.length === 0 ? (
        <EmptyState icon="💼" title="등록된 상품이 없습니다" description="운영진이 곧 추가합니다." />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/product/${p.id}`}
                className="block bg-unjong-surface rounded-lg border border-unjong-border p-4 hover:border-unjong-accent transition-colors"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    {p.category.toUpperCase()}
                  </span>
                  {p.ticker && <span className="text-xs font-mono text-unjong-muted">{p.ticker}</span>}
                </div>
                <h3 className="text-base font-semibold text-unjong-primary mb-1">{p.name}</h3>
                <p className="text-xs text-unjong-muted mb-2">{p.issuer || "운용사 미상"}</p>
                {p.description && <p className="text-sm text-unjong-primary line-clamp-2 mb-3">{p.description}</p>}
                <div className="flex items-center gap-3 text-xs text-unjong-muted">
                  {p.fee_pct !== null && <span>보수율 {(p.fee_pct * 100).toFixed(2)}%</span>}
                  <span className="flex items-center gap-1"><MessageCircle size={11} /> {p.discussion_count}</span>
                  <span className="flex items-center gap-1"><Eye size={11} /> {p.view_count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
