'use client';

import WatchlistWidget from '@/components/widgets/WatchlistWidget';
import VolumeTop10Widget from '@/components/widgets/VolumeTop10Widget';
import MoversTop10Widget from '@/components/widgets/MoversTop10Widget';
import ChartWidget from '@/components/widgets/ChartWidget';
import OrderBookWidget from '@/components/widgets/OrderBookWidget';
import TickWidget from '@/components/widgets/TickWidget';
import GlobalIndicesWidget from '@/components/widgets/GlobalIndicesWidget';
import DartFilingsWidget from '@/components/widgets/DartFilingsWidget';
import NetBuyTopWidget from '@/components/widgets/NetBuyTopWidget';
import InvestorFlowWidget from '@/components/widgets/InvestorFlowWidget';
import NewsFeedWidget from '@/components/widgets/NewsFeedWidget';
import TrendingThemesWidget from '@/components/widgets/TrendingThemesWidget';

// ── 1페이지 그리드 배치 (4행 × 1뷰포트) ──────────────────────────────────────
//
//  Row\Col │    Col 1 (3fr)       │    Col 2 (6fr)           │    Col 3 (3fr)
// ─────────┼─────────────────────┼─────────────────────────┼──────────────────
//  Row 1   │  관심종목            │  차트 (span 2)            │  글로벌 지수
//  Row 2   │  거래량 급등         │  ↑                       │  실시간 수급 TOP
//  Row 3   │  상승 테마           │  호가창 + 체결창           │  DART 공시
//  Row 4   │  상승/하락           │  투자자별                 │  뉴스 속보
// ──────────────────────────────────────────────────────────────────────────────
// 우측 ChatSidebar (fixed right-0 w-[280px]) — layout.tsx에서 전역 마운트

export default function HomeClient() {
  return (
    <div
      className="px-2 py-2"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px,3fr) minmax(600px,6fr) minmax(300px,3fr)',
        // 4행 × 1페이지 — sticky(112) + 3gaps(24) = 136 → 152 (여유 포함)
        gridTemplateRows: 'repeat(4, calc((100vh - 152px) / 4))',
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

      {/* R2 C1 — 거래량 급등 */}
      <div id="section-volume" style={{ gridRow: 2, gridColumn: 1 }}>
        <VolumeTop10Widget />
      </div>

      {/* R2 C3 — 실시간 수급 TOP */}
      <div id="section-net-buy" style={{ gridRow: 2, gridColumn: 3 }}>
        <NetBuyTopWidget />
      </div>

      {/* ── Row 3 ── */}

      {/* R3 C1 — 상승 테마 */}
      <div id="section-themes" style={{ gridRow: 3, gridColumn: 1 }}>
        <TrendingThemesWidget />
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

      {/* R3 C3 — DART 공시 */}
      <div id="section-dart" style={{ gridRow: 3, gridColumn: 3 }}>
        <DartFilingsWidget />
      </div>

      {/* ── Row 4 ── */}

      {/* R4 C1 — 상승/하락 TOP */}
      <div id="section-movers" style={{ gridRow: 4, gridColumn: 1 }}>
        <MoversTop10Widget />
      </div>

      {/* R4 C2 — 투자자별 매매동향 */}
      <div id="section-investor-flow" style={{ gridRow: 4, gridColumn: 2 }}>
        <InvestorFlowWidget />
      </div>

      {/* R4 C3 — 뉴스 속보 */}
      <div id="section-news" style={{ gridRow: 4, gridColumn: 3 }}>
        <NewsFeedWidget />
      </div>
    </div>
  );
}
