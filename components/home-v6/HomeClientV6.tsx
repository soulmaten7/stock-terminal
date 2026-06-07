"use client";

import { useState } from "react";
import HomeIndexStrip from "./HomeIndexStrip";
import HomePopularDiscussions from "./HomePopularDiscussions";
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
        {/* 왼쪽: 상태바 + 인기토론 + (랭킹 | 상세) */}
        <div className="min-w-0">
          {/* 시장 상태바 */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-unjong-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
              국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
              해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
            </span>
          </div>

          {/* 인기 토론 (주요지수 박스 자리 — 지수는 상단 스트립으로 이동) */}
          <HomePopularDiscussions />

          {/* 랭킹 + (xl) 종목 상세 패널 */}
          <div className="mt-5">
            <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} />} />
          </div>
        </div>

        {/* 오른쪽: 관심 레일 */}
        <HomeRightRail />
      </div>
    </div>
  );
}
