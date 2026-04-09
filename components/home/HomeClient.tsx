'use client';

import { useEffect } from 'react';
import SidebarChat from './SidebarChat';
import WatchlistLive from './WatchlistLive';
import InstitutionalFlow from './InstitutionalFlow';
import BreakingFeed from './BreakingFeed';
import VolumeSpike from './VolumeSpike';
import ProgramTrading from './ProgramTrading';
import GlobalFutures from './GlobalFutures';
import MarketMiniCharts from './MarketMiniCharts';
import WarningStocks from './WarningStocks';
import EconomicCalendar from './EconomicCalendar';
import IpoSchedule from './IpoSchedule';
import EarningsCalendar from './EarningsCalendar';
import AdColumn from './AdColumn';

export default function HomeClient() {
  useEffect(() => {
    // Force scroll to top on mount — repeated to beat async widget loading
    const scrollTop = () => window.scrollTo(0, 0);
    scrollTop();
    const timers = [50, 150, 300, 600, 1000].map(ms => setTimeout(scrollTop, ms));
    // Also use requestAnimationFrame for immediate paint
    requestAnimationFrame(scrollTop);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex gap-3 px-4 py-4 mx-auto" style={{ maxWidth: 1920 }}>
      {/* ═══ Left Ad Column ═══ */}
      <div className="hidden min-[1600px]:block shrink-0">
        <AdColumn premiumCount={5} generalCount={15} />
      </div>

      {/* ═══ Side Panel (280px) ═══ */}
      <div className="hidden min-[1400px]:flex w-[320px] shrink-0 flex-col gap-3 self-start">
        <WatchlistLive />
        <div className="sticky bottom-4" style={{ height: 500 }}>
          <SidebarChat />
        </div>
      </div>

      {/* ═══ Main Content (flex-1) ═══ */}
      <div className="flex-1 min-w-0">
        {/* 1층 */}
        <section className="flex flex-col gap-3 mb-8">
          <div style={{ minHeight: 360 }}>
            <BreakingFeed />
          </div>
          <div style={{ minHeight: 320 }}>
            <InstitutionalFlow />
          </div>
        </section>

        {/* 2층 */}
        <section className="bg-[#F8F9FA] p-6 mb-8 border border-[#E5E7EB]">
          <h2 className="text-xl font-bold text-black mb-6">오늘의 시장</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <VolumeSpike />
            <ProgramTrading />
            <GlobalFutures />
            <MarketMiniCharts />
            <WarningStocks />
          </div>
        </section>

        {/* 3층 */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-black mb-6">주요 일정</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <EconomicCalendar />
            <IpoSchedule />
            <EarningsCalendar />
          </div>
        </section>
      </div>

      {/* ═══ Right Ad Column ═══ */}
      <div className="hidden min-[1600px]:block shrink-0">
        <AdColumn premiumCount={5} generalCount={15} />
      </div>
    </div>
  );
}
