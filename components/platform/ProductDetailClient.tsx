"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createAnonClient } from "@/lib/supabase/anon-client";
import { LoadingState } from "@/components/ui/State";
import PlatformDiscussionBoard from "./PlatformDiscussionBoard";

type Product = {
  id: string;
  category: string;
  ticker: string | null;
  name: string;
  issuer: string | null;
  description: string | null;
  external_url: string | null;
  fee_pct: number | null;
  discussion_count: number;
};

export default function ProductDetailClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const supabase = createAnonClient();
      const { data } = await supabase
        .from("products")
        .select("id, category, ticker, name, issuer, description, external_url, fee_pct, discussion_count")
        .eq("id", id)
        .maybeSingle();
      if (!cancelled) { setProduct((data as Product) ?? null); setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingState className="p-8" title="상품 로딩 중..." />;
  if (!product) return <div className="p-8 text-center text-sm text-unjong-muted">상품을 찾을 수 없습니다.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 px-6 lg:px-10 py-4">
      {/* 좌: 상품 정보 */}
      <aside className="lg:sticky lg:top-4 lg:self-start space-y-3">
        <Link href="/products" className="inline-flex items-center gap-1 text-xs text-unjong-muted hover:text-unjong-primary">
          <ArrowLeft size={12} /> 상품 디렉토리
        </Link>
        <div className="bg-unjong-surface rounded-2xl border border-unjong-border p-4 shadow-soft">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
              {product.category.toUpperCase()}
            </span>
            {product.ticker && <span className="text-xs font-mono text-unjong-muted">{product.ticker}</span>}
          </div>
          <h1 className="text-lg font-bold text-unjong-primary">{product.name}</h1>
          <p className="text-xs text-unjong-muted mb-3">{product.issuer || "운용사 미상"}</p>
          {product.description && <p className="text-sm text-unjong-primary leading-normal mb-3">{product.description}</p>}
          <dl className="space-y-1.5 text-sm">
            {product.fee_pct !== null && (
              <div className="flex justify-between">
                <dt className="text-unjong-muted">보수율</dt>
                <dd className="font-semibold text-unjong-primary tabular-nums">{(product.fee_pct * 100).toFixed(2)}%</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-unjong-muted">평가 수</dt>
              <dd className="font-semibold text-unjong-primary tabular-nums">{product.discussion_count}</dd>
            </div>
          </dl>
          {product.external_url && (
            <a
              href={product.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-1 rounded-md border border-unjong-border py-2 text-sm text-unjong-primary hover:border-unjong-accent transition-colors"
            >
              운용사 페이지 <ExternalLink size={12} />
            </a>
          )}
        </div>
      </aside>

      {/* 우: 평가 토론 */}
      <main>
        <PlatformDiscussionBoard targetType="product" targetId={id} />
      </main>
    </div>
  );
}
