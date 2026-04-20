'use client';

import WatchlistWidget from '@/components/widgets/WatchlistWidget';
import VolumeTop10Widget from '@/components/widgets/VolumeTop10Widget';
import MoversTop10Widget from '@/components/widgets/MoversTop10Widget';
import ChartWidget from '@/components/widgets/ChartWidget';
import OrderBookWidget from '@/components/widgets/OrderBookWidget';
import TickWidget from '@/components/widgets/TickWidget';
import GlobalIndicesWidget from '@/components/widgets/GlobalIndicesWidget';
import DartFilingsWidget from '@/components/widgets/DartFilingsWidget';
import EconCalendarWidget from '@/components/widgets/EconCalendarWidget';
import NetBuyTopWidget from '@/components/widgets/NetBuyTopWidget';
import InvestorFlowWidget from '@/components/widgets/InvestorFlowWidget';
import NewsFeedWidget from '@/components/widgets/NewsFeedWidget';
import PreMarketBriefingWidget from '@/components/widgets/PreMarketBriefingWidget';
import CommunityChatWidget from '@/components/widgets/CommunityChatWidget';

export default function HomeClient() {
  return (
    <>
      <div
        className="min-h-screen px-2 py-2"
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 6fr 3fr',
          gap: 8,
          alignItems: 'start',
        }}
      >
        {/* ── 좌측 패널 (3fr): 관심종목 / 거래량급등 / 상승하락 ── */}
        <div className="flex flex-col gap-2">
          <div id="section-watchlist" style={{ height: 280 }}>
            <WatchlistWidget />
          </div>
          <div id="section-volume" style={{ height: 240 }}>
            <VolumeTop10Widget />
          </div>
          <div id="section-movers" style={{ height: 240 }}>
            <MoversTop10Widget />
          </div>
        </div>

        {/* ── 중앙 패널 (6fr): 차트 70% + 호가/체결 30% ── */}
        <div className="flex flex-col gap-2">
          <div id="section-chart" style={{ height: 480 }}>
            <ChartWidget />
          </div>
          <div className="grid grid-cols-2 gap-2" style={{ height: 240 }}>
            <div id="section-orderbook">
              <OrderBookWidget />
            </div>
            <div id="section-tick">
              <TickWidget />
            </div>
          </div>
        </div>

        {/* ── 우측 패널 (3fr): 수급·뉴스·공시 등 — 세로 스크롤 ── */}
        <div
          className="flex flex-col gap-2 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 96px)' }}
        >
          <div id="section-briefing" style={{ height: 180 }}>
            <PreMarketBriefingWidget />
          </div>
          <div id="section-global" style={{ height: 200 }}>
            <GlobalIndicesWidget />
          </div>
          <div id="section-net-buy" style={{ height: 200 }}>
            <NetBuyTopWidget />
          </div>
          <div id="section-investor-flow" style={{ height: 160 }}>
            <InvestorFlowWidget />
          </div>
          <div id="section-dart" style={{ height: 200 }}>
            <DartFilingsWidget />
          </div>
          <div id="section-news" style={{ height: 200 }}>
            <NewsFeedWidget />
          </div>
          <div id="section-econ" style={{ height: 160 }}>
            <EconCalendarWidget />
          </div>
        </div>
      </div>

      {/* ── 좌측 하단 고정: 채팅 위젯 ── */}
      <CommunityChatWidget />
    </>
  );
}
