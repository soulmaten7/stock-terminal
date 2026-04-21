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

// ── 1페이지 그리드 배치 (3행 × 1뷰포트) ──────────────────────────────────────
//
//  Row\Col │    Col 1 (3fr)              │    Col 2 (6fr)           │    Col 3 (3fr)
// ─────────┼──────────────────────────────┼─────────────────────────┼──────────────────────
//  Row 1   │  관심종목                    │  차트 (span 2)            │  글로벌 지수
//  Row 2   │  거래량+상승하락 탭          │  ↑                       │  실시간 수급 TOP
//  Row 3   │  상승테마+DART공시 탭        │  호가창 + 체결창          │  마켓 채팅
// ──────────────────────────────────────────────────────────────────────────────

export default function HomeClient() {
  return (
    <div
      className="px-2 py-2"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px,3fr) minmax(600px,6fr) minmax(300px,3fr)',
        gridTemplateRows: 'repeat(3, calc((100vh - 152px) / 3))',
        gap: 8,
      }}
    >
      {/* ── Row 1 ── */}

      {/* R1 C1 — 관심종목 */}
      <div id="section-watchlist" style={{ gridRow: 1, gridColumn: 1 }}>
        <WatchlistWidget />
      </div>

      {/* R1-2 C2 — 차트 (2행 span) */}
      <div id="section-chart" style={{ gridRow: '1 / 3', gridColumn: 2 }}>
        <ChartWidget />
      </div>

      {/* R1 C3 — 글로벌 지수 */}
      <div id="section-global" style={{ gridRow: 1, gridColumn: 3 }}>
        <GlobalIndicesWidget />
      </div>

      {/* ── Row 2 ── */}

      {/* R2 C1 — 거래량+상승하락 탭 */}
      <div id="section-volume-movers" style={{ gridRow: 2, gridColumn: 1 }}>
        <VolumeMoversTabWidget />
      </div>

      {/* R2 C3 — 실시간 수급 TOP */}
      <div id="section-net-buy" style={{ gridRow: 2, gridColumn: 3 }}>
        <NetBuyTopWidget />
      </div>

      {/* ── Row 3 ── */}

      {/* R3 C1 — 상승테마+DART공시 탭 */}
      <div id="section-themes-dart" style={{ gridRow: 3, gridColumn: 1 }}>
        <ThemesDartTabWidget />
      </div>

      {/* R3 C2 — 호가창 + 체결창 sub-grid */}
      <div
        id="section-orderbook-tick"
        style={{
          gridRow: 3,
          gridColumn: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr',
          gap: 8,
        }}
      >
        <div id="section-orderbook"><OrderBookWidget /></div>
        <div id="section-tick"><TickWidget /></div>
      </div>

      {/* R3 C3 — 마켓 채팅 */}
      <div id="section-chat" style={{ gridRow: 3, gridColumn: 3 }}>
        <ChatWidget />
      </div>
    </div>
  );
}
