import { Suspense } from "react";
import StockPageClient from "@/components/stock/StockPageClient";

export const metadata = { title: "종목 — 트릴리언" };

type Props = {
  params: Promise<{ code: string }>;
};

export default async function StockPage({ params }: Props) {
  const { code } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center">⏳ 로딩 중...</div>}>
      <StockPageClient code={code} />
    </Suspense>
  );
}
