'use client';

import { useEffect } from 'react';
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

const CARD = 'bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col';

export default function HomeClient() {
  useEffect(() => {
    const scrollTop = () => window.scrollTo(0, 0);
    scrollTop();
    const timers = [50, 150, 300, 600, 1000].map((ms) => setTimeout(scrollTop, ms));
    requestAnimationFrame(scrollTop);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="mx-auto px-4 py-4" style={{ maxWidth: 1920 }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr) 240px' }}>
        {/* ═══ 메인 영역: Bento Grid ═══ */}
        <div className="grid grid-cols-2 gap-3">
          {/* ROW 1 — 관심종목 | 수급 TOP10 (400px) */}
          <div className={CARD} style={{ height: 400 }}>
            <WatchlistLive />
          </div>
          <div className={CARD} style={{ height: 400 }}>
            <InstitutionalFlow />
          </div>

          {/* ROW 2 — 거래량 급등 | 코스피/코스닥 (300px) */}
          <div className={CARD} style={{ height: 300 }}>
            <VolumeSpike />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <MarketMiniCharts />
          </div>

          {/* ROW 3~5 — 속보 (tall, row-span-3) | 경제지표·IPO·실적 세로 스택 */}
          <div className={CARD} style={{ height: 924, gridRow: 'span 3' }}>
            <BreakingFeed />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <EconomicCalendar />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <IpoSchedule />
          </div>
          <div className={CARD} style={{ height: 300 }}>
            <EarningsCalendar />
          </div>

          {/* ROW 6 — 프로그램매매 | 글로벌선물 | 경고종목 (col-span-2, 3등분) */}
          <div className={`${CARD} col-span-2 grid grid-cols-3 gap-0`} style={{ height: 300 }}>
            <div className="border-r border-[#F0F0F0] overflow-hidden">
              <ProgramTrading />
            </div>
            <div className="border-r border-[#F0F0F0] overflow-hidden">
              <GlobalFutures />
            </div>
            <div className="overflow-hidden">
              <WarningStocks />
            </div>
          </div>
        </div>

        {/* ═══ 우측: Partner Slot 예약 공간 (240px) ═══ */}
        <aside className="hidden min-[1400px]:block">
          <div className="sticky top-[120px] flex flex-col gap-3">
            <div
              className="bg-[#F8F9FA] border border-dashed border-[#D1D5DB] rounded-lg flex items-center justify-center text-xs text-[#999999] tracking-widest"
              style={{ height: 400 }}
            >
              PARTNER SLOT<br />(W4)
            </div>
            <div
              className="bg-[#F8F9FA] border border-dashed border-[#D1D5DB] rounded-lg flex items-center justify-center text-xs text-[#999999] tracking-widest"
              style={{ height: 300 }}
            >
              PARTNER SLOT<br />(W4)
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
