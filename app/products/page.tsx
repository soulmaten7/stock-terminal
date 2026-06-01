import { Suspense } from "react";
import ProductsClient from "@/components/platform/ProductsClient";

export const metadata = { title: "상품 디렉토리 — 운종" };

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">⏳ 로딩 중...</div>}>
      <ProductsClient />
    </Suspense>
  );
}
