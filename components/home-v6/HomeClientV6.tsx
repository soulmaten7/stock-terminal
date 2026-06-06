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
      {/* 시장 상태바 (토스식) */}
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

      {/* 지수 그리드 (이 영역이 화면 밖으로 나가면 하단 티커 등장) */}
      <div ref={gridRef}>
        <HomeIndexBar />
      </div>

      {/* 메인(실시간 랭킹) + 우측 관심 레일 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-5">
        <main className="min-w-0">
          <MarketClient embedded />
        </main>
        <HomeRightRail />
      </div>

      {/* 하단 고정 얇은 티커 (그리드와 동일 데이터, 스크롤 시 등장) */}
      <HomeStickyTicker observeRef={gridRef} />
    </div>
  );
}
