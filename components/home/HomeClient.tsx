'use client';

import WatchlistWidget from '@/components/widgets/WatchlistWidget';
import ChartWidget from '@/components/widgets/ChartWidget';
import OrderBookWidget from '@/components/widgets/OrderBookWidget';
import TickWidget from '@/components/widgets/TickWidget';
import GlobalIndicesWidget from '@/components/widgets/GlobalIndicesWidget';
import NetBuyTopWidget from '@/components/widgets/NetBuyTopWidget';
import VolumeMoversTabWidget from '@/components/widgets/VolumeMoversTabWidget';
import ThemesDartTabWidget from '@/components/widgets/ThemesDartTabWidget';
import ChatWidget from '@/components/widgets/ChatWidget';
import NewsFeedWidget from '@/components/widgets/NewsFeedWidget';

// ── 레이아웃 (Dashboard V1.2) ──────────────────────────────────────────────
//
//  Row\Col │    Col 1 (3fr)          │    Col 2 (6fr)                │    Col 3 (3fr)
// ─────────┼─────────────────────────┼───────────────────────────────┼─────────────────────
//  R1-R2   │  마켓채팅 (top half)    │  차트 (R1-R2 span)            │  호가창 (top half)
//  R1-R3   │  ────────────────       │  ──────────────────────       │  ────────────────
//          │  관심종목 (bot half)    │                                │  체결창 (bot half)
//  R3      │                         │  글로벌지수 | 실시간수급      │
// ─────────┼─────────────────────────┼───────────────────────────────┼─────────────────────
//  R4      │  발견피드 (1.5fr, 탭)   │  시장활성도 (1.5fr, 탭)       │  뉴스속보 (1fr)
// ────────────────────────────────────────────────────────────────────────────────────────
//
// R4 아래 = 추후 광고 배너 자리

export default function HomeClient() {
  return (
    <div
      className="px-2 py-2"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px,3fr) minmax(600px,6fr) minmax(300px,3fr)',
        gridTemplateRows: 'repeat(3, calc((100vh - 152px) / 3)) minmax(450px, auto)',
        gap: 8,
      }}
    >
      {/* ── Col 1: Chat + Watchlist (spans R1-R3, internal 1:1 vertical split) ── */}
      <div
        id="section-col1"
        style={{
          gridRow: '1 / 4',
          gridColumn: 1,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
        }}
      >
        <div id="section-chat"><ChatWidget /></div>
        <div id="section-watchlist"><WatchlistWidget /></div>
      </div>

      {/* ── Col 2 R1-R2: Chart (span) ── */}
      <div id="section-chart" style={{ gridRow: '1 / 3', gridColumn: 2 }}>
        <ChartWidget />
      </div>

      {/* ── Col 2 R3: Global | NetBuy horizontal 1:1 subgrid ── */}
      <div
        id="section-r3-center"
        style={{
          gridRow: 3,
          gridColumn: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        <div id="section-global"><GlobalIndicesWidget /></div>
        <div id="section-net-buy"><NetBuyTopWidget /></div>
      </div>

      {/* ── Col 3: OrderBook + Tick (spans R1-R3, internal 1:1 vertical split) ── */}
      <div
        id="section-col3"
        style={{
          gridRow: '1 / 4',
          gridColumn: 3,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
        }}
      >
        <div id="section-orderbook"><OrderBookWidget /></div>
        <div id="section-tick"><TickWidget /></div>
      </div>

      {/* ── R4: Discovery Row (spans full width, 1.5 : 1.5 : 1) ── */}
      <div
        id="section-r4"
        style={{
          gridRow: 4,
          gridColumn: '1 / 4',
          display: 'grid',
          gridTemplateColumns: '1.5fr 1.5fr 1fr',
          gap: 8,
        }}
      >
        <div id="section-themes-dart"><ThemesDartTabWidget size="large" /></div>
        <div id="section-volume-movers"><VolumeMoversTabWidget size="large" /></div>
        <div id="section-news"><NewsFeedWidget size="large" /></div>
      </div>
    </div>
  );
}
