import type { Metadata } from "next";
import {
  GlobalIndicesCard,
  Magnificent7Card,
  UsMoversCard,
  ForexClockCard,
} from "@/components/cards/UsCards";

export const metadata: Metadata = {
  title: "미국주식 — 운종",
  description:
    "운종 미국주식 — S&P/Nasdaq/Dow/VIX · M7 · Movers · 미국 시계+시장 상태. " +
    "정확도 보장되는 핵심 지표만.",
};

export default function UsPage() {
  return (
    <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <GlobalIndicesCard />
      <Magnificent7Card />
      <UsMoversCard />
      <ForexClockCard />
    </div>
  );
}
