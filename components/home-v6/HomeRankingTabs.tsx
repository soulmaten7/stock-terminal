"use client";

import { useState } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
import SectorRanking from "./SectorRanking";
import InvestorTrend from "./InvestorTrend";

const TABS = [
  { key: "chart", label: "실시간 차트" },
  { key: "category", label: "지금 뜨는 카테고리" },
  { key: "investor", label: "국내 투자자 동향" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function HomeRankingTabs({ onHover }: { onHover?: (s: HoverStock) => void }) {
  const [tab, setTab] = useState<TabKey>("chart");

  return (
    <div>
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary"
                : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "chart" && <MarketClient embedded onHover={onHover} />}
      {tab === "category" && <SectorRanking />}
      {tab === "investor" && <InvestorTrend />}
    </div>
  );
}
