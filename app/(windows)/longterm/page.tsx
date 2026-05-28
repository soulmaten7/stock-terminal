import type { Metadata } from "next";
import {
  LongtermDisclosureCard,
  EarningsCalendarCard,
  SectorCard,
  ValueScreenCard,
  DividendTopCard,
  Lows52WCard,
  WarningStockCard,
} from "@/components/cards/LongtermCards";

export const metadata: Metadata = {
  title: "장타창",
  description:
    "운종 장타창 — 가치투자자·장기보유자의 데스크. " +
    "공시 · 분기실적 · 저평가 · 배당 · 신저가 · 섹터 · 관리종목.",
};

export default function LongtermPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <LongtermDisclosureCard />
      <EarningsCalendarCard />
      <ValueScreenCard />
      <DividendTopCard />
      <Lows52WCard />
      <SectorCard />
      <WarningStockCard />
    </div>
  );
}
