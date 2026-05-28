import type { Metadata } from "next";
import {
  GlobalIndicesCard,
  PreAfterMarketCard,
  Magnificent7Card,
  UsMoversCard,
  ForexClockCard,
  UsNewsCard,
  FOMCCalendarCard,
} from "@/components/cards/UsCards";

export const metadata: Metadata = {
  title: "미국주식창",
  description:
    "운종(雲從) 미국주식창 — 미장 투자자의 새벽 데스크. " +
    "S&P/Nasdaq/VIX · Pre/After · M7 · Movers · 환율 · 뉴스+8K · FOMC.",
};

export default function UsPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <GlobalIndicesCard />
      <PreAfterMarketCard />
      <Magnificent7Card />
      <UsMoversCard />
      <ForexClockCard />
      <UsNewsCard />
      <FOMCCalendarCard />
    </div>
  );
}
