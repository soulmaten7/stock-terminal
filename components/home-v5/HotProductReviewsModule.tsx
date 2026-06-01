"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { MessageCircle } from "lucide-react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Product = {
  id: string;
  category: string;
  ticker: string | null;
  name: string;
  issuer: string | null;
  discussion_count: number;
};

export default function HotProductReviewsModule() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("products")
          .select("id, category, ticker, name, issuer, discussion_count")
          .eq("hidden", false)
          .order("discussion_count", { ascending: false })
          .limit(5);
        if (!cancelled) setItems((data || []) as Product[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-unjong-primary flex items-center gap-1.5">
          💎 HOT 상품 평가
        </h2>
        <Link href="/products" className="text-xs text-unjong-accent hover:underline font-medium">
          전체 보기 →
        </Link>
      </header>

      {loading ? (
        <LoadingState title="로딩 중..." />
      ) : items.length === 0 ? (
        <EmptyState icon="💼" title="등록된 상품이 없습니다" />
      ) : (
        <ul className="space-y-2">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/product/${p.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-unjong-background transition-colors">
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 flex-shrink-0">
                  {p.category.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-unjong-primary truncate">{p.name}</p>
                  <p className="text-xs text-unjong-muted truncate">{p.issuer}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-unjong-muted flex-shrink-0">
                  <MessageCircle size={12} /> {p.discussion_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
