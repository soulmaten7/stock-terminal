'use client';

import WatchlistWidget from '@/components/widgets/WatchlistWidget';
import ChartWidget from '@/components/widgets/ChartWidget';
import OrderBookWidget from '@/components/widgets/OrderBookWidget';
import TickWidget from '@/components/widgets/TickWidget';
import GlobalIndicesWidget from '@/components/widgets/GlobalIndicesWidget';
import NetBuyTopWidget from '@/components/widgets/NetBuyTopWidget';
import VolumeTop10Widget from '@/components/widgets/VolumeTop10Widget';
import StockDetailPanel from '@/components/dashboard/StockDetailPanel';
import StockDetailToggle from '@/components/dashboard/StockDetailToggle';
import BriefingWidget from '@/components/widgets/BriefingWidget';
import ScreenerExpandedWidget from '@/components/widgets/ScreenerExpandedWidget';
import MoversPairWidget from '@/components/widgets/MoversPairWidget';
import SectorHeatmapWidget from '@/components/widgets/SectorHeatmapWidget';
import ThemeTop10Widget from '@/components/widgets/ThemeTop10Widget';
import NewsStreamWidget from '@/components/widgets/NewsStreamWidget';
import DisclosureStreamWidget from '@/components/widgets/DisclosureStreamWidget';
import EconomicCalendarWidget from '@/components/widgets/EconomicCalendarWidget';
import FloatingChat from '@/components/chat/FloatingChat';

export default function HomeClient() {
  return (
    <div className="relative max-w-[1600px] min-w-[1280px] mx-auto px-2 py-2 flex flex-col gap-2">

      {/* Section 1 — L자 레이아웃, 820px */}
      <section
        className="grid gap-0 h-[820px] border border-[#E5E7EB] bg-white overflow-hidden"
        style={{
          gridTemplateColumns: '280px 1fr 360px',
          gridTemplateRows: '55% 45%',
        }}
      >
        {/* 상단 좌: 관심종목 */}
        <div className="border-r border-[#E5E7EB] min-w-0 min-h-0 overflow-y-auto"
          style={{ gridRow: 1, gridColumn: 1 }}>
          <WatchlistWidget compact />
        </div>

        {/* 상단 중: 차트 */}
        <div className="min-w-0 min-h-0 overflow-hidden"
          style={{ gridRow: 1, gridColumn: 2 }}>
          <ChartWidget />
        </div>

        {/* 우측 통짜: 상세탭 row-span-2 */}
        <div className="border-l border-[#E5E7EB] min-w-0 min-h-0 overflow-hidden"
          style={{ gridRow: '1 / 3', gridColumn: 3 }}>
          <StockDetailPanel />
        </div>

        {/* 하단: 호가 55% + 체결 45%, col-span-2 */}
        <div className="border-t border-[#E5E7EB] grid min-w-0 overflow-hidden"
          style={{ gridRow: 2, gridColumn: '1 / 3', gridTemplateColumns: '55% 45%' }}>
          <div className="border-r border-[#E5E7EB] min-w-0 min-h-0 overflow-y-auto">
            <OrderBookWidget />
          </div>
          <div className="min-w-0 min-h-0 overflow-y-auto">
            <TickWidget />
          </div>
        </div>
      </section>

      <StockDetailToggle />

      {/* Section 2 — 400px */}
      <section className="grid grid-cols-12 gap-2 h-[400px]">
        <div className="col-span-4 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <BriefingWidget compact />
        </div>
        <div className="col-span-8 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <GlobalIndicesWidget expanded />
        </div>
      </section>

      {/* Section 3 — 260 + 340 */}
      <section className="space-y-2">
        <div className="h-[260px] border border-[#E5E7EB] bg-white overflow-y-auto">
          <ScreenerExpandedWidget />
        </div>
        <div className="grid grid-cols-12 gap-2 h-[340px]">
          <div className="col-span-6 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
            <MoversPairWidget />
          </div>
          <div className="col-span-3 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
            <VolumeTop10Widget inline />
          </div>
          <div className="col-span-3 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
            <NetBuyTopWidget inline />
          </div>
        </div>
      </section>

      {/* Section 4 — 440px */}
      <section className="grid grid-cols-12 gap-2 h-[440px]">
        <div className="col-span-9 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <SectorHeatmapWidget />
        </div>
        <div className="col-span-3 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <ThemeTop10Widget />
        </div>
      </section>

      {/* Section 5 — 440px */}
      <section className="grid grid-cols-12 gap-2 h-[440px]">
        <div className="col-span-5 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <NewsStreamWidget />
        </div>
        <div className="col-span-4 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <DisclosureStreamWidget />
        </div>
        <div className="col-span-3 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <EconomicCalendarWidget />
        </div>
      </section>

      {/* FloatingChat — 대시보드 폭 안쪽, 최하단 */}
      <FloatingChat />
    </div>
  );
}
