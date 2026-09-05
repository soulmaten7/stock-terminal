# STEP 20b — 홈 대시보드 그리드 전면 재배치 (D 비율 + 차트 50% + 뉴스/DART 이동)

**실행 명령어:**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** Step 20a 완료 (commit `2ebdbdb` — ScreenerMiniWidget 신규 + URL param sync)

---

## 📐 목표

홈 대시보드 Zone 철학 → **User Flow 철학**으로 전환. ScreenerMiniWidget을 Col 1에 편입하고, 차트 비중 축소, 뉴스/DART를 실시간 이벤트 스트림으로 재배치.

```
이전 (Step 19까지):
┌─────────┬────────────────┬─────────┐
│ 채팅     │   차트 (R1-R2) │ 호가창   │
│ 글로벌   │                │          │
│ (1:1)   │ ───────────── │ 체결창   │
│         │ 관심|테마 (R3) │ (1:1)   │
└─────────┴────────────────┴─────────┘
│  상승 | 거래량 | 수급 | DART | 뉴스   │ (R4, 0.75:0.75:0.75:0.75:1)

이후 (Step 20b):
┌─────────┬────────────────┬─────────┐
│ 채팅(45)│   차트 (50%)   │ 뉴스속보 │
│ 발굴(10)│                │          │
│ 관심(45)│ ───────────── │ ───────  │
│         │ 호가창 | 체결  │ DART공시 │
│         │   (1:1)        │          │
└─────────┴────────────────┴─────────┘
│ 상승 | 거래량 | 수급 | 상승테마 | 글로벌 │ (R4, 1:1:1:1:1)
```

**핵심 변경:**
1. **Col 1**: 채팅+글로벌(1:1) → 채팅+발굴+관심(45:10:45)
2. **Col 2**: 차트(R1-R2 span) + 관심|테마(R3) → 차트(50%) + 호가|체결(50%, 1:1)
3. **Col 3**: 호가+체결(1:1) → 뉴스+DART(1:1) — 실시간 이벤트 스트림
4. **R4**: DART/뉴스 제거 → 상승테마+글로벌 추가, 비율 통일 1:1:1:1:1

**User Flow 철학:**
- Col 1: 정보→탐색→결정 (채팅 → 발굴 → 관심종목)
- Col 2: 분석→주문 (차트 → 호가/체결)
- Col 3: 실시간 이벤트 스트림 (뉴스 + DART)
- R4: 순수 랭킹/훑어보기

---

## 🔧 파일 변경 (1개 파일)

### `components/home/HomeClient.tsx` — 전체 재작성

**Write (전체 파일 덮어쓰기):**

```tsx
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
        gridTemplateColumns: 'minmax(280px,2.5fr) minmax(640px,6.5fr) minmax(300px,3fr)',
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
```

---

## 📋 변경 세부 내역

**Import 추가:**
- `ScreenerMiniWidget` (Step 20a에서 생성)

**외부 그리드 구조:**
- `gridTemplateRows`: `repeat(3, calc((100vh-152px)/3)) max(500px, calc(100vh-280px))` → `calc(100vh-152px) max(500px, calc(100vh-280px))`
- 이유: 각 Col이 자체 grid로 내부 분할하므로 외부 R1-R3 구분 불필요. R1(대시보드 상단) + R2(R4 디스커버리 행) 2행 구조.

**Col 1:**
- `gridRow: '1 / 4'` → `gridRow: 1` (외부 grid가 1행이 됨)
- 내부 rows: `1fr 1fr` → `45fr 10fr 45fr`
- 위젯: Chat + GlobalIndices → Chat + ScreenerMini + Watchlist

**Col 2:**
- 구조 변경: Chart(R1-R2 span) + Watchlist|Themes(R3) → Chart(50%) + OrderBook|Tick(50%, 1:1)
- 내부 grid 2중첩: 외부 `gridTemplateRows: '1fr 1fr'` + 하단 `gridTemplateColumns: '1fr 1fr'`

**Col 3:**
- 위젯 교체: OrderBook+Tick → NewsFeed+DartFilings
- 구조는 동일 (`1fr 1fr` vertical)

**R4:**
- 위젯 교체: Movers+Volume+NetBuy+**DART+News** → Movers+Volume+NetBuy+**TrendingThemes+GlobalIndices**
- 비율 통일: `0.75fr 0.75fr 0.75fr 0.75fr 1fr` → `1fr 1fr 1fr 1fr 1fr`
- `gridRow: 4` → `gridRow: 2`

---

## 🔒 변경하지 않는 파일

- **각 위젯 파일** — 모두 `h-full` 로 부모 그리드 영역 채우도록 이미 설정됨
- **`ScreenerMiniWidget.tsx`** — Step 20a에서 생성, 변경 불필요
- **다른 페이지** (`/screener`, `/net-buy`, `/dart` 등) — 영향 없음

---

## 🚀 실행 순서

```bash
cd ~/Desktop/OTMarketing
git status
git log --oneline -3

# 1. components/home/HomeClient.tsx 전체 덮어쓰기 (Write)

# 2. 빌드 확인
npm run build 2>&1 | tail -20

# 3. 개발 서버 재기동
pkill -f "next dev" || true
rm -rf .next node_modules/.cache
nohup npm run dev > /tmp/next-dev.log 2>&1 &
sleep 6
tail -n 20 /tmp/next-dev.log

# 4. 시각 검증 (브라우저)
#    → http://localhost:3000
#    → Col 1 마켓채팅(큼) / 종목발굴(얇음) / 관심종목(큼) 세로 정렬
#    → Col 2 차트(상단) / 호가|체결(하단 가로 반반)
#    → Col 3 뉴스속보(상단) / DART(하단)
#    → R4 5개 위젯 균등 폭 (상승/하락, 거래량, 실시간수급, 상승테마, 글로벌지수)

# 5. 커밋 + 푸시
git add components/home/HomeClient.tsx

git commit -m "$(cat <<'EOF'
refactor: restructure home dashboard to User Flow architecture

Move from Zone-based to User Flow-based layout. Introduce
ScreenerMiniWidget into Col 1, shrink chart to 50%, and move
News/DART to Col 3 as a real-time event stream.

Layout changes:
- Col 1: Chat + GlobalIndices (1:1) → Chat (45) + Screener (10)
  + Watchlist (45). ScreenerMiniWidget becomes the discovery
  entry point sitting between passive reading (chat) and owned
  positions (watchlist).
- Col 2: Chart spans R1-R2 (66%) + R3 Watchlist|Themes →
  Chart (50%) + OrderBook|Tick (50%, 1:1 horizontal). Chart no
  longer dominates; order-flow widgets get equal weight.
- Col 3: OrderBook+Tick (1:1) → NewsFeed+DART (1:1). Becomes
  the real-time event stream column.
- R4: Movers|Volume|NetBuy|DART|News (0.75:0.75:0.75:0.75:1) →
  Movers|Volume|NetBuy|Themes|Global (1:1:1:1:1). DART/News
  moved to Col 3; Themes/Global filled the freed slots. Ratios
  unified.

Outer grid simplified from 4 rows (3 content + 1 R4) to 2 rows
(content + R4) since each column now manages its own internal
row partitioning.

User Flow philosophy (replaces Zone philosophy):
- Col 1: information → discovery → decision
- Col 2: analysis → order execution
- Col 3: real-time event feed
- R4: pure ranking / scan

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

---

## ✅ 시각 검증 체크리스트

**Col 1 (좌측)**
1. 마켓채팅 위젯이 Col 1 상단 **약 45%** 높이 차지
2. 그 아래 종목발굴 미니 위젯 (얇은 툴바, **약 10%** 높이)
3. 하단에 관심종목 위젯 **약 45%** 높이
4. 종목발굴 위젯에서 KOSPI/KOSDAQ 토글 + 키워드 입력 → 엔터 → `/screener` 이동 확인

**Col 2 (중앙)**
5. 차트 위젯이 Col 2 **상단 50%** 차지
6. 하단 50%가 호가창 | 체결창 **가로 반반**으로 분할
7. 차트 내부 TradingView 정상 렌더

**Col 3 (우측)**
8. 상단에 뉴스속보 위젯 (실시간 피드)
9. 하단에 DART공시 위젯
10. 스크롤이 각 위젯 내부에서만 발생 (외부 스크롤 없음)

**R4 (하단)**
11. 5개 위젯이 **정확히 1:1:1:1:1 균등 폭**
12. 순서: 상승/하락 → 거래량 → 실시간수급 → 상승테마 → 글로벌지수
13. R4 높이 `max(500px, 100vh-280px)` 적용

**전역**
14. 레이아웃 박스 (1536px) 중앙정렬 유지
15. 사이드바 정렬 Step 19 상태 그대로
16. 푸터 박스 폭 따라감
17. 모든 위젯에 내부 스크롤 정상, 외곽 깨짐 없음

---

## ⚠️ 주의사항 & 잠재 이슈

- **중복 위젯 체크**: DART/News가 R4에서 사라지고 Col 3에만 존재. 다른 페이지 (`/dart`, `/news` 라우트)에는 영향 없음
- **GlobalIndices 위치 변경**: Col 1 하단 → R4 마지막. 이 위젯은 원래 차트 표시이므로 R4에 잘 맞음
- **TrendingThemes 위치 변경**: Col 2 R3 → R4 4번째. 테이블/리스트 형태라 R4에 자연스러움
- **차트 높이 축소**: 50% → 약 (100vh-152px)×50% 높이. TradingView 기본 차트 최소 높이 확인 필요. 만약 너무 작으면 Step 20d에서 조정

---

## 🗣️ 남은 작업 대기 목록

1. **Step 20c (보류 판단)** — 페이지2 별도 라우트 존재 확인 후 결정.
   - 별도 라우트 있으면: 해당 페이지 위젯 교체
   - 없으면: Step 20b가 Step 20c까지 대체 (이 경우 Step 20c 폐기)
2. **Phase 2-B** — 수급 통합 탭 (`/investor-flow` → `/net-buy`). P0
3. **Phase 2-C** — 경제캘린더 미니 위젯 홈 편입. P1
4. **Phase 2-D** — 발굴 ↔ 관심종목 연동 (공통 StockTable). P1
5. **`/toolbox` vs `/link-hub` 중복 정리**
6. **세션 종료 처리** — 4개 문서 헤더 날짜 업데이트

Step 20b 완료 후 페이지2 라우트 존재 여부 사용자 확인 → Step 20c 여부 결정.
