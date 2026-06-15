import type { Metadata } from "next";
import MarketDirectoryClient from "@/components/market/MarketDirectoryClient";

export const metadata: Metadata = { title: "상품 리스트 — 운종" };

export default function MarketPage() {
  return <MarketDirectoryClient />;
}
