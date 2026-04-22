'use client';

import WatchlistWidget from '@/components/widgets/WatchlistWidget';
import ChartWidget from '@/components/widgets/ChartWidget';
import OrderBookWidget from '@/components/widgets/OrderBookWidget';
import TickWidget from '@/components/widgets/TickWidget';
import GlobalIndicesWidget from '@/components/widgets/GlobalIndicesWidget';
import NetBuyTopWidget from '@/components/widgets/NetBuyTopWidget';
import ChatWidget from '@/components/widgets/ChatWidget';
import NewsFeedWidget from '@/components/widgets/NewsFeedWidget';
import TrendingThemesWidget from '@/components/widgets/TrendingThemesWidget';
import DartFilingsWidget from '@/components/widgets/DartFilingsWidget';
import VolumeTop10Widget from '@/components/widgets/VolumeTop10Widget';
import MoversTop10Widget from '@/components/widgets/MoversTop10Widget';
import ScreenerMiniWidget from '@/components/widgets/ScreenerMiniWidget';
import EconCalendarMiniWidget from '@/components/widgets/EconCalendarMiniWidget';
import StockDetailPanel from '@/components/dashboard/StockDetailPanel';

// ── 레이아웃 (Dashboard V3 — STEP 70) ─────────────────────────────────────
//
//  Section 1 (3컬럼, h-680px):
//    좌(280px): 관심종목
//    중(1fr):   차트(60%) / 호가창(25%) / 체결창(15%) 세로 스택
//    우(360px): 종목 상세 (스냅샷 헤더 + 탭 4개)
//
//  R4 (Discovery Row): 5등분 — 기존 유지

export default function HomeClient() {
  return (
    <div className="px-2 py-2 flex flex-col gap-2">
      {/* Section 1 — 3컬럼 (관심종목 / 차트·호가·체결 / 종목 상세) */}
      <section className="grid grid-cols-[280px_1fr_360px] gap-0 h-[680px] border border-[#E5E7EB] bg-white">
        {/* 좌 — 관심종목 */}
        <div className="border-r border-[#E5E7EB] min-w-0 overflow-hidden">
          <WatchlistWidget />
        </div>

        {/* 중 — 차트 60% / 호가 25% / 체결 15% */}
        <div className="flex flex-col min-w-0 overflow-hidden">
          <div className="basis-[60%] shrink-0 border-b border-[#E5E7EB] min-h-0 overflow-hidden">
            <ChartWidget />
          </div>
          <div className="basis-[25%] shrink-0 border-b border-[#E5E7EB] min-h-0 overflow-hidden">
            <OrderBookWidget />
          </div>
          <div className="basis-[15%] shrink-0 min-h-0 overflow-hidden">
            <TickWidget />
          </div>
        </div>

        {/* 우 — 종목 상세 (신규) */}
        <StockDetailPanel />
      </section>

      {/* R4: Discovery Row (1:1:1:1:1) — 기존 유지 */}
      <div
        id="section-r4"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gap: 8,
          height: 'max(500px, calc(100vh - 280px))',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div id="section-movers" style={{ minHeight: 0 }}>
          <MoversTop10Widget size="large" />
        </div>
        <div id="section-volume" style={{ minHeight: 0 }}>
          <VolumeTop10Widget size="large" />
        </div>
        <div id="section-net-buy" style={{ minHeight: 0 }}>
          <NetBuyTopWidget size="large" />
        </div>
        <div id="section-themes" style={{ minHeight: 0 }}>
          <TrendingThemesWidget />
        </div>
        <div id="section-global" style={{ minHeight: 0 }}>
          <GlobalIndicesWidget />
        </div>
      </div>
    </div>
  );
}
