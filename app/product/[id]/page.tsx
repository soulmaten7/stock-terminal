import { Suspense } from "react";
import ProductDetailClient from "@/components/platform/ProductDetailClient";

export const metadata = { title: "상품 평가 — 운종" };

type Props = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center">⏳ 로딩 중...</div>}>
      <ProductDetailClient id={id} />
    </Suspense>
  );
}
