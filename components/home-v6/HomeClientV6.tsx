"use client";

import { useState } from "react";
import HomeIndexStrip from "./HomeIndexStrip";
import HomeRightRail from "./HomeRightRail";
import HomeStockDetail from "./HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";
import HomeRankingTabs from "./HomeRankingTabs";

export default function HomeClientV6() {
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  return (
    <div className="px-6 py-5">
      {/* 얇은 지수 티커 (헤더 밑 고정 — 지수 앵커) */}
      <HomeIndexStrip />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* 왼쪽: 랭킹(성적표) | 상세 2:1 — 속보 제거로 최상단 */}
        <div className="min-w-0">
          <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} wide />} />
        </div>

        {/* 오른쪽: 관심 레일 */}
        <HomeRightRail />
      </div>
    </div>
  );
}
