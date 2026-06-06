"use client";

import { useRef, useState } from "react";
import HomeIndexBar from "./HomeIndexBar";
import HomeRightRail from "./HomeRightRail";
import HomeStickyTicker from "./HomeStickyTicker";
import HomeStockDetail from "./HomeStockDetail";
import { type HoverStock } from "@/components/market/MarketClient";
import HomeRankingTabs from "./HomeRankingTabs";

export default function HomeClientV6() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* 왼쪽: 상태바 + 지수 그리드 + (랭킹 | 상세) */}
        <div className="min-w-0">
          {/* 시장 상태바 */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-unjong-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
              국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
              해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
            </span>
          </div>

          {/* 지수 그리드 */}
          <div ref={gridRef}>
            <HomeIndexBar />
          </div>

          {/* 랭킹 + (xl) 종목 상세 패널 */}
          <div className="mt-5">
            <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} />} />
          </div>
        </div>

        {/* 오른쪽: 관심 레일 */}
        <HomeRightRail />
      </div>

      {/* 하단 마퀴 티커 */}
      <HomeStickyTicker observeRef={gridRef} />
    </div>
  );
}
