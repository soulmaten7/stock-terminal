import type { Metadata } from "next";
import {
  MoversCard,
  VolumeCard,
  ScalperDisclosureCard,
  ViCard,
  NetBuyBrokerCard,
  ThemeTop10Card,
  ShortInterestCard,
} from "@/components/cards/ScalperCards";

export const metadata: Metadata = {
  title: "단타창",
  description:
    "운종 단타창 — 장중 09:00~15:30 액티브 트레이더의 데스크. " +
    "Movers · Volume · VI · NetBuy · 공시 · 테마 · 공매도.",
};

export default function ScalperPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <MoversCard />
      <VolumeCard />
      <ViCard />
      <NetBuyBrokerCard />
      <ScalperDisclosureCard />
      <ThemeTop10Card />
      <ShortInterestCard />
    </div>
  );
}
