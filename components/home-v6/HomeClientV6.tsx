"use client";

import { useState } from "react";
import HomeIndexStrip from "./HomeIndexStrip";
import HomeBreakingNews from "./HomeBreakingNews";
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
        {/* 왼쪽: 실시간 속보 + (랭킹 | 상세 2:1) */}
        <div className="min-w-0">
          {/* 🔴 실시간 속보 (옛 인기토론 카드 자리) */}
          <HomeBreakingNews />

          {/* 랭킹 + (xl) 종목 상세 패널(2:1) */}
          <div className="mt-5">
            <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} wide />} />
          </div>
        </div>

        {/* 오른쪽: 관심 레일 */}
        <HomeRightRail />
      </div>
    </div>
  );
}
