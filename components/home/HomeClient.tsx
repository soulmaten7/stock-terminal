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

export default function HomeClient() {
  return (
    <div className="px-2 py-2 flex flex-col gap-2">
      {/* Section 1 — 3컬럼 반응형 */}
      <section className="grid gap-0 h-[680px] border border-[#E5E7EB] bg-white
        grid-cols-[240px_1fr]
        lg:grid-cols-[240px_1fr_320px]
        xl:grid-cols-[280px_1fr_360px]">
        <div className="border-r border-[#E5E7EB] min-w-0 overflow-hidden">
          <WatchlistWidget />
        </div>
        <div className="flex flex-col min-w-[480px] overflow-hidden">
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
        <div className="hidden lg:block min-w-0 overflow-hidden">
          <StockDetailPanel />
        </div>
      </section>

      <StockDetailToggle />

      {/* Section 2 — Pre-Market & Global (4:8) */}
      <section className="grid grid-cols-12 gap-2 border border-[#E5E7EB]" style={{ minHeight: 400 }}>
        <div className="col-span-12 lg:col-span-4 min-w-0 border-b lg:border-b-0 lg:border-r border-[#E5E7EB] overflow-hidden" style={{ minHeight: 200 }}>
          <BriefingWidget compact />
        </div>
        <div className="col-span-12 lg:col-span-8 min-w-0 overflow-hidden">
          <GlobalIndicesWidget expanded />
        </div>
      </section>

      {/* Section 3 — Discovery */}
      <section className="space-y-2">
        {/* 상단: 종목 발굴 확장 (풀폭) */}
        <div className="border border-[#E5E7EB] bg-white overflow-hidden">
          <ScreenerExpandedWidget />
        </div>

        {/* 하단: 6:3:3 */}
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 lg:col-span-6 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden" style={{ minHeight: 320 }}>
            <MoversPairWidget />
          </div>
          <div className="col-span-6 lg:col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden" style={{ minHeight: 320 }}>
            <VolumeTop10Widget inline />
          </div>
          <div className="col-span-6 lg:col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden" style={{ minHeight: 320 }}>
            <NetBuyTopWidget inline />
          </div>
        </div>
      </section>

      {/* Section 4 — Market Structure */}
      <section className="grid grid-cols-12 gap-2">
        <div className="col-span-12 lg:col-span-9 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden" style={{ minHeight: 280 }}>
          <SectorHeatmapWidget />
        </div>
        <div className="col-span-12 lg:col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden" style={{ minHeight: 280 }}>
          <ThemeTop10Widget />
        </div>
      </section>
    </div>
  );
}
