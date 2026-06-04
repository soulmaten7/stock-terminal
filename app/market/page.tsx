import type { Metadata } from "next";
import MarketClient from "@/components/market/MarketClient";

export const metadata: Metadata = { title: "마켓" };

export default function MarketPage() {
  return <MarketClient />;
}
