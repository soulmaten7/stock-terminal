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
import RealtimeChatWidget from '@/components/widgets/RealtimeChatWidget';

// ── 2페이지 그리드 배치 ──────────────────────────────────────────────────────
//
//  Row\Col │    Col 1 (3fr)       │    Col 2 (6fr)           │    Col 3 (3fr)
// ─────────┼─────────────────────┼─────────────────────────┼──────────────────
//  Row 1   │  관심종목            │  차트 (span 2)            │  글로벌 지수
//  Row 2   │  거래량 급등         │  ↑                       │  실시간 수급 TOP
//  Row 3   │  실시간 채팅         │  호가창 + 체결창           │  DART 공시
// ─────────┼─────────────────────┼─────────────────────────┼──────────────────
//  Row 4   │  상승/하락           │  투자자별 (span 2)         │  뉴스 속보 (span 3)
//  Row 5   │  장전 브리핑         │  ↑                       │  ↑
//  Row 6   │  경제캘린더 (span 2) │  ↑                       │  ↑
// ──────────────────────────────────────────────────────────────────────────────

export default function HomeClient() {
  return (
    <div
      className="px-2 py-2"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px,3fr) minmax(600px,6fr) minmax(300px,3fr)',
        // 6행 × 2페이지 — total 2vh에서 sticky(112) + 5gaps(40) 차감
        // (200vh - 152px) / 6 per row
        gridTemplateRows: 'repeat(6, calc((200vh - 152px) / 6))',
        gap: 8,
      }}
    >
      {/* ── Page 1 · Row 1 ── */}

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

      {/* ── Page 1 · Row 2 ── */}

      {/* R2 C1 — 거래량 급등 */}
      <div id="section-volume" style={{ gridRow: 2, gridColumn: 1 }}>
        <VolumeTop10Widget />
      </div>

      {/* R2 C3 — 실시간 수급 TOP */}
      <div id="section-net-buy" style={{ gridRow: 2, gridColumn: 3 }}>
        <NetBuyTopWidget />
      </div>

      {/* ── Page 1 · Row 3 ── */}

      {/* R3 C1 — 실시간 채팅 (인라인 그리드 위젯) */}
      <div id="section-chat" style={{ gridRow: 3, gridColumn: 1 }}>
        <RealtimeChatWidget />
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

      {/* ── Page 2 · Row 4 ── */}

      {/* R4 C1 — 상승/하락 TOP */}
      <div id="section-movers" style={{ gridRow: 4, gridColumn: 1 }}>
        <MoversTop10Widget />
      </div>

      {/* R4-5 C2 — 투자자별 매매동향 (2행 span) */}
      <div id="section-investor-flow" style={{ gridRow: '4 / 6', gridColumn: 2 }}>
        <InvestorFlowWidget />
      </div>

      {/* R4-6 C3 — 뉴스 속보 (3행 span) */}
      <div id="section-news" style={{ gridRow: '4 / 7', gridColumn: 3 }}>
        <NewsFeedWidget />
      </div>

      {/* ── Page 2 · Row 5 ── */}

      {/* R5 C1 — 장전 브리핑 */}
      <div id="section-briefing" style={{ gridRow: 5, gridColumn: 1 }}>
        <PreMarketBriefingWidget />
      </div>

      {/* ── Page 2 · Row 6 ── */}

      {/* R6 C1-2 — 경제캘린더 (2컬럼 span) */}
      <div id="section-econ" style={{ gridRow: 6, gridColumn: '1 / 3' }}>
        <EconCalendarWidget />
      </div>
    </div>
  );
}
