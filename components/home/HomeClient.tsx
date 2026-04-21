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

// ── 레이아웃 (Dashboard V2 — User Flow Architecture) ────────────────────────
//
//  Row\Col │  Col 1 (2.5fr)       │  Col 2 (6.5fr)              │  Col 3 (3fr)
// ─────────┼──────────────────────┼──────────────────────────────┼──────────────────
//  R1-R3   │  마켓채팅 (45%)       │  차트 (50%)                  │  뉴스속보 (50%)
//          │  ──────               │  ──────                      │  ──────
//          │  종목발굴 (10%)       │  호가창 | 체결창 (50%, 1:1)  │  DART공시 (50%)
//          │  ──────               │                              │
//          │  관심종목 (45%)       │                              │
// ─────────┼──────────────────────┼──────────────────────────────┼──────────────────
//  R4      │  상승/하락 | 거래량 | 실시간수급 | 상승테마 | 글로벌지수 (1:1:1:1:1)
//          │  (max(500px, 100vh-280px), 내부 스크롤)
// ────────────────────────────────────────────────────────────────────────────────
//
// User Flow 철학 (Zone 철학에서 전환):
//  Col 1 = 정보→탐색→결정 (채팅 → 발굴 → 관심종목)
//  Col 2 = 분석→주문 (차트 → 호가/체결)
//  Col 3 = 실시간 이벤트 스트림 (뉴스 + DART)
//  R4    = 순수 랭킹/훑어보기

export default function HomeClient() {
  return (
    <div
      className="px-2 py-2"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,2.5fr) minmax(0,6.5fr) minmax(0,3fr)',
        gridTemplateRows: 'calc(100vh - 152px) max(500px, calc(100vh - 280px))',
        gap: 8,
      }}
    >
      {/* ── Col 1: Chat (45) + ScreenerMini (10) + Watchlist (45) ── */}
      <div
        id="section-col1"
        style={{
          gridRow: 1,
          gridColumn: 1,
          display: 'grid',
          gridTemplateRows: '45fr 10fr 45fr',
          gap: 8,
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div id="section-chat" style={{ minHeight: 0 }}><ChatWidget /></div>
        <div id="section-screener-mini" style={{ minHeight: 0 }}><ScreenerMiniWidget /></div>
        <div id="section-watchlist" style={{ minHeight: 0 }}><WatchlistWidget /></div>
      </div>

      {/* ── Col 2: Chart (50) + (OrderBook | Tick 1:1) (50) ── */}
      <div
        id="section-col2"
        style={{
          gridRow: 1,
          gridColumn: 2,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div id="section-chart" style={{ minHeight: 0 }}><ChartWidget /></div>
        <div
          id="section-orderbook-tick"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div id="section-orderbook" style={{ minHeight: 0 }}><OrderBookWidget /></div>
          <div id="section-tick" style={{ minHeight: 0 }}><TickWidget /></div>
        </div>
      </div>

      {/* ── Col 3: News (50) + DART (50) vertical ── */}
      <div
        id="section-col3"
        style={{
          gridRow: 1,
          gridColumn: 3,
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gap: 8,
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div id="section-news" style={{ minHeight: 0 }}><NewsFeedWidget /></div>
        <div id="section-dart" style={{ minHeight: 0 }}><DartFilingsWidget /></div>
      </div>

      {/* ── R4: Discovery Row (1:1:1:1:1) ── */}
      <div
        id="section-r4"
        style={{
          gridRow: 2,
          gridColumn: '1 / 4',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
          gap: 8,
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
