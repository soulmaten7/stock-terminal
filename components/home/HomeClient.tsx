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

export default function HomeClient() {
  return (
    <div className="px-2 py-2 flex flex-col gap-2">
      {/* Section 1 — 680px 고정 */}
      <section className="grid gap-0 h-[680px] border border-[#E5E7EB] bg-white overflow-hidden
        grid-cols-[240px_1fr]
        lg:grid-cols-[240px_1fr_320px]
        xl:grid-cols-[280px_1fr_360px]">
        <div className="border-r border-[#E5E7EB] min-w-0 min-h-0 overflow-y-auto">
          <WatchlistWidget />
        </div>
        <div className="flex flex-col min-w-0 overflow-hidden">
          <div className="basis-[60%] shrink-0 border-b border-[#E5E7EB] min-h-0 overflow-hidden">
            <ChartWidget />
          </div>
          <div className="basis-[25%] shrink-0 border-b border-[#E5E7EB] min-h-0 overflow-y-auto">
            <OrderBookWidget />
          </div>
          <div className="basis-[15%] shrink-0 min-h-0 overflow-y-auto">
            <TickWidget />
          </div>
        </div>
        <div className="hidden lg:block min-w-0 min-h-0 overflow-hidden">
          <StockDetailPanel />
        </div>
      </section>

      <StockDetailToggle />

      {/* Section 2 — 400px 고정 */}
      <section className="grid grid-cols-12 gap-2 h-[400px]">
        <div className="col-span-12 lg:col-span-4 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <BriefingWidget compact />
        </div>
        <div className="col-span-12 lg:col-span-8 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <GlobalIndicesWidget expanded />
        </div>
      </section>

      {/* Section 3 — 260 + 340 */}
      <section className="space-y-2">
        <div className="h-[260px] border border-[#E5E7EB] bg-white overflow-y-auto">
          <ScreenerExpandedWidget />
        </div>
        <div className="grid grid-cols-12 gap-2 h-[340px]">
          <div className="col-span-12 lg:col-span-6 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
            <MoversPairWidget />
          </div>
          <div className="col-span-6 lg:col-span-3 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
            <VolumeTop10Widget inline />
          </div>
          <div className="col-span-6 lg:col-span-3 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
            <NetBuyTopWidget inline />
          </div>
        </div>
      </section>

      {/* Section 4 — 440px 고정 */}
      <section className="grid grid-cols-12 gap-2 h-[440px]">
        <div className="col-span-12 lg:col-span-9 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <SectorHeatmapWidget />
        </div>
        <div className="col-span-12 lg:col-span-3 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <ThemeTop10Widget />
        </div>
      </section>

      {/* Section 5 — 440px 고정 */}
      <section className="grid grid-cols-12 gap-2 h-[440px] mb-6">
        <div className="col-span-12 lg:col-span-5 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <NewsStreamWidget />
        </div>
        <div className="col-span-12 lg:col-span-4 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <DisclosureStreamWidget />
        </div>
        <div className="col-span-12 lg:col-span-3 min-w-0 min-h-0 border border-[#E5E7EB] bg-white overflow-y-auto">
          <EconomicCalendarWidget />
        </div>
      </section>
    </div>
  );
}
