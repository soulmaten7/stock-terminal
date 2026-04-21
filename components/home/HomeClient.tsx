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

// ── 레이아웃 (Dashboard V1.5) ──────────────────────────────────────────────
//
//  Row\Col │  Col 1 (2.5fr)      │    Col 2 (6.5fr)              │    Col 3 (3fr)
// ─────────┼─────────────────────┼───────────────────────────────┼─────────────────────
//  R1-R2   │  마켓채팅 (top)      │  차트 (R1-R2 span)             │  호가창 (top)
//  R1-R3   │  ────                │  ──────                       │  ────
//          │  글로벌지수 (bot)    │                                │  체결창 (bot)
//  R3      │                     │  관심종목 | 상승 테마           │
// ─────────┼─────────────────────┼───────────────────────────────┼─────────────────────
//  R4      │  상승/하락 | 거래량 | 실시간수급 | DART공시 | 뉴스속보
//          │  (max(500px, 100vh-280px), 내부 스크롤)
// ────────────────────────────────────────────────────────────────────────────────────────
//
// Zone 철학:
//  좌열 = 대화·감성 엔진 (채팅 + 배경 지수)
//  중앙 = 트레이딩 아이디어 엔진 (차트 + 내 종목 + 핫 테마)
//  우열 = 주문·실행 엔진 (호가 + 체결)
//  R4   = 발견·탐색 엔진 (랭킹 + 피드)

export default function HomeClient() {
  return (
    <div
      className="px-2 py-2"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)',
        gridTemplateRows: 'repeat(3, calc((100vh - 152px) / 3)) max(500px, calc(100vh - 280px))',
        gap: 8,
      }}
    >
      {/* ── Col 1: Chat + GlobalIndices (spans R1-R3, internal 1:1 vertical split) ── */}
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
        <div id="section-global"><GlobalIndicesWidget /></div>
      </div>

      {/* ── Col 2 R1-R2: Chart (span) ── */}
      <div id="section-chart" style={{ gridRow: '1 / 3', gridColumn: 2 }}>
        <ChartWidget />
      </div>

      {/* ── Col 2 R3: Watchlist | Themes horizontal 1:1 subgrid ── */}
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
        <div id="section-watchlist"><WatchlistWidget /></div>
        <div id="section-themes"><TrendingThemesWidget /></div>
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

      {/* ── R4: Discovery Row (max(500px, 100vh-280px), 5 widgets flat) ── */}
      <div
        id="section-r4"
        style={{
          gridRow: 4,
          gridColumn: '1 / 4',
          display: 'grid',
          gridTemplateColumns: '0.75fr 0.75fr 0.75fr 0.75fr 1fr',
          gap: 8,
          minHeight: 0,
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
        <div id="section-dart" style={{ minHeight: 0 }}>
          <DartFilingsWidget size="large" />
        </div>
        <div id="section-news" style={{ minHeight: 0 }}>
          <NewsFeedWidget size="large" />
        </div>
      </div>
    </div>
  );
}
