"use client";

import { useRef } from "react";
import HomeIndexBar from "./HomeIndexBar";
import HomeRightRail from "./HomeRightRail";
import HomeStickyTicker from "./HomeStickyTicker";
import MarketClient from "@/components/market/MarketClient";

export default function HomeClientV6() {
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* 왼쪽: 상태바 + 지수 그리드 + 실시간 랭킹 */}
        <div className="min-w-0">
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

          <div ref={gridRef}>
            <HomeIndexBar />
          </div>

          <div className="mt-5">
            <MarketClient embedded />
          </div>
        </div>

        {/* 오른쪽: 관심 레일 (헤더까지 풀하이트) */}
        <HomeRightRail />
      </div>

      {/* 하단 고정 마퀴 티커 */}
      <HomeStickyTicker observeRef={gridRef} />
    </div>
  );
}
