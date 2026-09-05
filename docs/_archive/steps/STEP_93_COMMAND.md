<!-- 2026-05-27 -->
# STEP 93 — 우측 사이드패널 (종목 클릭 시 차트/호가/체결/종합)

> **목표**: 우측 사이드패널 (폭 360px) — 종목 선택 시 4탭 시각화. 관심종목·카드 클릭 → 패널 자동 전환.
> **세션**: #25
> **전제**: STEP 92 완료 (`ef1bf4d`), 좌측·헤더·카드 모두 작동
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 5-4 (우측 사이드패널)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_93_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **UI 4탭 완성, 데이터는 더미** — TradingView·KIS 실차트는 Layer 1
2. **Zustand store 로 종목 선택 상태 관리** — 기존 V3 store 있으면 재활용, 없으면 신설
3. **카드 → 패널 연결은 데모만** — WatchlistPanel + ScalperCards.MoversCard 만 연결, 나머지는 Layer 1
4. **기본 선택 종목 = 삼성전자 (005930)** — 사용자가 첫 페이지에서 패널 안의 시각 즉시 인지
5. **opacity 폴백 패턴 STEP 92 동일** — `bg-emerald-50` 등 fallback

---

## 작업 1 — 기존 V3 selectedSymbolStore 확인

```bash
cd ~/stock-terminal
find stores -name "*.ts" -o -name "*.tsx" 2>/dev/null
grep -ri "selectedSymbol" --include="*.ts" --include="*.tsx" stores components app 2>/dev/null | head -20
```

### 시나리오 A — 기존 store 발견 시
- import 만 하고 그대로 사용
- 인터페이스 확인: `selectedSymbol`, `setSymbol(code, name)` 또는 비슷한 패턴

### 시나리오 B — 신규 생성 시 (안전한 폴백)
다음 단계로 진행.

---

## 작업 2 — `stores/selectedSymbolStore.ts` (신규 또는 확장)

기존 store 가 없으면 신규 생성. 있으면 인터페이스 확인 후 그대로 사용.

```ts
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 운종 선택 종목 store
 *
 * 우측 사이드패널에 표시할 종목 코드·이름·가격·등락률을 관리.
 * 카드·관심종목 클릭 시 setSelectedSymbol 호출 → 패널 자동 업데이트.
 *
 * Layer 0: 정적 더미 (기본 삼성전자)
 * Layer 1: KIS API 실시간 가격 연동 + 추가 메타데이터
 */

export type SelectedSymbol = {
  code: string;
  name: string;
  price?: string;
  changePct?: number;
  market?: "KOSPI" | "KOSDAQ" | "US" | "ETF";
};

type Store = {
  selectedSymbol: SelectedSymbol | null;
  setSelectedSymbol: (symbol: SelectedSymbol | null) => void;
};

export const useSelectedSymbol = create<Store>()(
  persist(
    (set) => ({
      // 기본 — 삼성전자 (사용자 첫 진입 시 빈 패널 회피)
      selectedSymbol: {
        code: "005930",
        name: "삼성전자",
        price: "78,400",
        changePct: 1.42,
        market: "KOSPI",
      },
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
    }),
    {
      name: "unjong-selected-symbol",
    }
  )
);
```

⚠️ 기존 store 와 충돌하면 파일명 다르게 (`stores/unjongSelectedSymbolStore.ts`) 신규 생성.

---

## 작업 3 — `components/sidepanel/StockDetailPanel.tsx` (4탭 통합)

```tsx
"use client";

import { useState } from "react";
import { useSelectedSymbol } from "@/stores/selectedSymbolStore";
import { TrendingUp, TrendingDown, X } from "lucide-react";

// ─── 더미 데이터 (Layer 1 실데이터 교체 예정) ───

const DUMMY_ORDERBOOK = {
  asks: [
    { price: "78,500", quantity: 12_847 },
    { price: "78,450", quantity: 8_234 },
    { price: "78,400", quantity: 15_623 },
    { price: "78,350", quantity: 9_184 },
    { price: "78,300", quantity: 6_472 },
  ],
  bids: [
    { price: "78,250", quantity: 11_283 },
    { price: "78,200", quantity: 7_854 },
    { price: "78,150", quantity: 14_321 },
    { price: "78,100", quantity: 5_672 },
    { price: "78,050", quantity: 8_945 },
  ],
};

const DUMMY_TICKS = [
  { time: "14:32:14", price: "78,400", quantity: 1_283, type: "buy" as const },
  { time: "14:32:08", price: "78,350", quantity: 542, type: "sell" as const },
  { time: "14:31:57", price: "78,400", quantity: 2_184, type: "buy" as const },
  { time: "14:31:43", price: "78,300", quantity: 845, type: "sell" as const },
  { time: "14:31:21", price: "78,400", quantity: 3_421, type: "buy" as const },
  { time: "14:30:58", price: "78,350", quantity: 1_675, type: "sell" as const },
  { time: "14:30:42", price: "78,400", quantity: 924, type: "buy" as const },
  { time: "14:30:19", price: "78,400", quantity: 5_281, type: "buy" as const },
];

const DUMMY_OVERVIEW = {
  open: "77,800",
  high: "78,900",
  low: "77,500",
  volume: "12,847,234",
  marketCap: "467.8조",
  per: 12.4,
  pbr: 1.8,
  roe: 14.5,
  divYield: 1.73,
  high52w: "85,400",
  low52w: "65,200",
};

type Tab = "chart" | "orderbook" | "tick" | "overview";

const TABS: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: "chart", label: "차트", emoji: "📈" },
  { id: "orderbook", label: "호가창", emoji: "📊" },
  { id: "tick", label: "체결", emoji: "⚡" },
  { id: "overview", label: "종합", emoji: "📋" },
];

export function StockDetailPanel() {
  const { selectedSymbol, setSelectedSymbol } = useSelectedSymbol();
  const [activeTab, setActiveTab] = useState<Tab>("chart");

  // 종목 미선택 시 빈 상태
  if (!selectedSymbol) {
    return (
      <aside className="hidden xl:flex w-[360px] flex-shrink-0 flex-col border-l border-unjong-border bg-unjong-surface">
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <div className="text-3xl">👆</div>
            <p className="text-sm text-unjong-muted">
              관심종목 또는 카드에서
              <br />
              종목을 클릭하면
              <br />
              여기 차트·호가·체결이 표시됩니다.
            </p>
            <p className="text-[10px] text-unjong-muted italic mt-3">
              Layer 1 — 모든 카드 종목 클릭 연결
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const isUp = (selectedSymbol.changePct ?? 0) >= 0;

  return (
    <aside className="hidden xl:flex w-[360px] flex-shrink-0 flex-col border-l border-unjong-border bg-unjong-surface">
      {/* 종목 헤더 */}
      <header className="border-b border-unjong-border p-3 bg-unjong-background">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-unjong-primary truncate">
                {selectedSymbol.name}
              </h3>
              {selectedSymbol.market && (
                <span className="text-[10px] font-semibold text-unjong-muted bg-unjong-surface px-1.5 py-0.5 rounded">
                  {selectedSymbol.market}
                </span>
              )}
            </div>
            <p className="text-[11px] text-unjong-muted font-mono">
              {selectedSymbol.code}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSymbol(null)}
            className="text-unjong-muted hover:text-unjong-primary p-1"
            aria-label="종목 선택 해제"
          >
            <X size={14} />
          </button>
        </div>

        {/* 가격 + 등락 */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-unjong-primary tabular-nums">
            {selectedSymbol.price ?? "—"}
          </span>
          {selectedSymbol.changePct !== undefined && (
            <span
              className={`flex items-center gap-0.5 text-sm font-semibold ${
                isUp ? "text-unjong-success" : "text-unjong-danger"
              }`}
            >
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isUp ? "+" : ""}
              {selectedSymbol.changePct.toFixed(2)}%
            </span>
          )}
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="flex border-b border-unjong-border" aria-label="종목 상세 탭">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors border-b-2 ${
              activeTab === t.id
                ? "border-unjong-accent text-unjong-primary"
                : "border-transparent text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
            }`}
          >
            <span className="mr-1" aria-hidden>
              {t.emoji}
            </span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "chart" && <ChartTab />}
        {activeTab === "orderbook" && <OrderBookTab />}
        {activeTab === "tick" && <TickTab />}
        {activeTab === "overview" && <OverviewTab />}
      </div>
    </aside>
  );
}

// ─── 탭 컴포넌트들 (같은 파일 안) ───

function ChartTab() {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1">
        {["1분", "3분", "5분", "30분", "일봉", "주봉", "월봉"].map((interval) => (
          <button
            key={interval}
            type="button"
            className="text-[10px] text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background px-2 py-1 rounded"
          >
            {interval}
          </button>
        ))}
      </div>

      {/* 차트 placeholder — 단순 SVG 모형 */}
      <div className="aspect-[4/3] rounded border border-unjong-border bg-unjong-background flex items-center justify-center relative overflow-hidden">
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 w-full h-full opacity-30"
          aria-hidden
        >
          <polyline
            points="20,200 60,180 100,210 140,150 180,160 220,120 260,140 300,90 340,110 380,70"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-unjong-success"
          />
          <line x1="0" y1="100" x2="400" y2="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="text-unjong-border" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="text-unjong-border" />
        </svg>
        <div className="relative text-center px-4">
          <p className="text-sm font-medium text-unjong-primary">📈 차트</p>
          <p className="text-[10px] text-unjong-muted mt-1">
            Layer 1 — TradingView · lightweight-charts 연결
          </p>
        </div>
      </div>
    </div>
  );
}

function OrderBookTab() {
  return (
    <div className="p-3 space-y-1">
      <p className="text-[10px] text-unjong-muted text-center mb-2 italic">
        Layer 1 — KIS OrderBook API 실시간 연결 예정
      </p>

      {/* 매도 호가 (위) */}
      <div className="space-y-0.5">
        {DUMMY_ORDERBOOK.asks.map((ask, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 rounded px-2 py-1 text-xs"
          >
            <span className="text-unjong-muted tabular-nums">{ask.quantity.toLocaleString()}</span>
            <span className="font-semibold text-unjong-success tabular-nums">{ask.price}</span>
          </div>
        ))}
      </div>

      {/* 중앙 현재가 */}
      <div className="border-y border-unjong-border my-1 py-1.5 text-center bg-unjong-background">
        <span className="text-sm font-bold text-unjong-accent">78,400</span>
        <span className="text-[10px] text-unjong-muted ml-2">현재가</span>
      </div>

      {/* 매수 호가 (아래) */}
      <div className="space-y-0.5">
        {DUMMY_ORDERBOOK.bids.map((bid, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 rounded px-2 py-1 text-xs"
          >
            <span className="font-semibold text-unjong-danger tabular-nums">{bid.price}</span>
            <span className="text-unjong-muted tabular-nums">{bid.quantity.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TickTab() {
  return (
    <div className="p-3">
      <p className="text-[10px] text-unjong-muted text-center mb-2 italic">
        Layer 1 — KIS Tick API 실시간 체결
      </p>
      <ul className="space-y-1">
        {DUMMY_TICKS.map((tick, i) => (
          <li
            key={i}
            className="flex items-center justify-between text-xs px-2 py-1 hover:bg-unjong-background rounded"
          >
            <span className="text-[10px] text-unjong-muted font-mono">{tick.time}</span>
            <span
              className={`font-semibold tabular-nums ${
                tick.type === "buy" ? "text-unjong-success" : "text-unjong-danger"
              }`}
            >
              {tick.price}
            </span>
            <span className="text-unjong-muted tabular-nums">{tick.quantity.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewTab() {
  const overview = DUMMY_OVERVIEW;
  return (
    <div className="p-3 space-y-3">
      <p className="text-[10px] text-unjong-muted text-center italic">
        Layer 1 — KIS price + 재무 + 기업 메타데이터
      </p>

      {/* 가격 정보 */}
      <section>
        <h4 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1.5">
          가격
        </h4>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Row label="시가" value={overview.open} />
          <Row label="고가" value={overview.high} />
          <Row label="저가" value={overview.low} />
          <Row label="거래량" value={overview.volume} />
          <Row label="52주 최고" value={overview.high52w} />
          <Row label="52주 최저" value={overview.low52w} />
        </dl>
      </section>

      {/* 재무 정보 */}
      <section className="border-t border-unjong-border pt-3">
        <h4 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1.5">
          재무
        </h4>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Row label="시가총액" value={overview.marketCap} />
          <Row label="PER" value={overview.per.toFixed(1)} />
          <Row label="PBR" value={overview.pbr.toFixed(1)} />
          <Row label="ROE" value={`${overview.roe.toFixed(1)}%`} />
          <Row label="배당수익률" value={`${overview.divYield.toFixed(2)}%`} />
        </dl>
      </section>

      {/* Layer 1 안내 */}
      <section className="border-t border-unjong-border pt-3">
        <p className="text-[10px] text-unjong-muted italic">
          Layer 1 추가 예정: 공시 5건 · 뉴스 5건 · 분기 실적 그래프 · 컨센서스
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-unjong-muted">{label}</dt>
      <dd className="font-semibold text-unjong-primary text-right tabular-nums">
        {value}
      </dd>
    </>
  );
}
```

⚠️ `bg-emerald-50 dark:bg-emerald-950/20` — opacity 안 되면 그냥 `bg-emerald-50` 만 사용.

---

## 작업 4 — `app/(windows)/layout.tsx` 우측 패널 교체

기존 STEP 89 의 placeholder aside (우측) 를 `StockDetailPanel` 로 교체.

```tsx
import { UnjongHeader } from "@/components/header/UnjongHeader";
import { UnjongSidebar } from "@/components/sidebar/UnjongSidebar";
import { StockDetailPanel } from "@/components/sidepanel/StockDetailPanel";

// ...
return (
  <div className="flex h-screen flex-col bg-unjong-background">
    <UnjongHeader />
    <div className="flex flex-1 overflow-hidden">
      <UnjongSidebar />
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
      <StockDetailPanel />
    </div>
  </div>
);
```

기존 placeholder aside (`hidden xl:flex w-[360px]...`) 제거. `import` 추가.

---

## 작업 5 — WatchlistPanel 종목 클릭 연결 (데모)

기존 `components/sidebar/WatchlistPanel.tsx` 의 `<li>` 에 `onClick` 추가.

```tsx
"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useSelectedSymbol } from "@/stores/selectedSymbolStore";

// ... DUMMY_WATCHLIST 그대로 ...

export function WatchlistPanel() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <div className="flex flex-col max-h-[35%] border-t border-unjong-border bg-unjong-surface flex-shrink-0">
      {/* 헤더 그대로 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2 flex-shrink-0">
        <span className="text-xs font-semibold text-unjong-primary">
          👀 관심종목 {DUMMY_WATCHLIST.length}개
        </span>
        <span className="text-[10px] text-unjong-muted">(더미)</span>
      </div>

      <ul className="flex-1 overflow-y-auto min-h-0 divide-y divide-unjong-border">
        {DUMMY_WATCHLIST.map((item) => {
          const isUp = item.changePct >= 0;
          return (
            <li
              key={item.code}
              onClick={() =>
                setSelectedSymbol({
                  code: item.code,
                  name: item.name,
                  price: item.price,
                  changePct: item.changePct,
                  market: item.code.match(/^[A-Z]+$/)
                    ? "US"
                    : item.code.startsWith("0")
                    ? "KOSPI"
                    : "KOSDAQ",
                })
              }
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-unjong-background cursor-pointer transition-colors"
            >
              {/* 기존 내용 그대로 */}
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {item.name}
                </span>
                <span className="text-[10px] text-unjong-muted">{item.code}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="font-semibold text-unjong-primary">
                  {item.price}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-medium ${
                    isUp ? "text-unjong-success" : "text-unjong-danger"
                  }`}
                >
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? "+" : ""}
                  {item.changePct.toFixed(2)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

핵심 변경: `useSelectedSymbol` import + `<li onClick>` 추가. 다른 카드들 (Movers·Volume·공시 등) 은 **Layer 1 에서 연결**. 

---

## 작업 6 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

**확인 사항**:
- 빌드 성공, TypeScript 오류 0
- 새 파일 2개 (`stores/selectedSymbolStore.ts`, `components/sidepanel/StockDetailPanel.tsx`)
- WatchlistPanel 수정 후 클라이언트 컴포넌트 정상 작동
- opacity 클래스 (`/20`) 폴백 여부 확인

---

## 작업 7 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add stores components/sidepanel components/sidebar
git add "app/(windows)/layout.tsx"
git add docs/STEP_93_COMMAND.md
git status
git commit -m "feat: STEP 93 - 우측 사이드패널 (4탭 + 종목 클릭 연결)

- stores/selectedSymbolStore.ts — Zustand persist (기본 삼성전자)
- components/sidepanel/StockDetailPanel.tsx — 4탭 통합:
  · 차트 탭 (간격 버튼 + SVG placeholder)
  · 호가창 탭 (매도 5호가 + 현재가 + 매수 5호가, 더미)
  · 체결 탭 (8건 더미, 매수/매도 색 구분)
  · 종합 탭 (가격·재무 정보 dl 그리드)
- components/sidebar/WatchlistPanel.tsx — onClick 으로 setSelectedSymbol 연결
- app/(windows)/layout.tsx — 우측 placeholder → StockDetailPanel 교체
- 카드 (Movers/Volume/공시 등) 클릭 연결은 Layer 1 예정
- 다음 STEP 94: V3 5섹션 → /dashboard 강등"
git push
```

---

## 검증 체크리스트

- [ ] `stores/selectedSymbolStore.ts` 존재 (또는 기존 store 재활용 명시)
- [ ] `components/sidepanel/StockDetailPanel.tsx` 존재 (4탭 작동)
- [ ] `(windows)/layout.tsx` 에 `StockDetailPanel` 적용
- [ ] `WatchlistPanel.tsx` 종목 클릭 시 패널 업데이트
- [ ] 4개 탭 전환 작동 (차트·호가창·체결·종합)
- [ ] 빌드 클린, git push 완료
- [ ] opacity / dark-mode 클래스 폴백 여부 보고

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 93 완료. 우측 사이드패널 (4탭 + 종목 클릭 연결) 끝.

- selectedSymbolStore [신규 / 기존 재활용] — Zustand persist, 기본 삼성전자
- StockDetailPanel 4탭:
  · 차트 (간격 버튼 + SVG line placeholder)
  · 호가창 (매도 5호가 / 현재가 / 매수 5호가)
  · 체결 (8건 더미, 매수=초록 / 매도=빨강)
  · 종합 (가격·재무 dl 그리드)
- WatchlistPanel 의 종목 클릭 → 패널 자동 업데이트
- 카드 (Movers/Volume/공시) 클릭 연결은 Layer 1
- 빌드 클린, git push 완료 (커밋 [해시])
- opacity 폴백 여부: [yes/no]

다음 STEP 94 (V3 5섹션 → /dashboard 강등) 명령서 받을 준비 됨.
이게 Layer 0 의 마지막 STEP.

브라우저에서 확인:
  - 좌측 관심종목에서 다른 종목 클릭 → 우측 패널 자동 변경
  - 우측 패널 4탭 클릭으로 차트/호가/체결/종합 전환
  - 우측 상단 X 버튼으로 종목 선택 해제 → 빈 상태
```

---

## ⚠️ 주의 사항

1. **기본 종목 = 005930 삼성전자** — 사용자 첫 진입 시 빈 패널 회피
2. **opacity 클래스 (`/10`, `/20`) 폴백** — STEP 92 패턴 동일 (`bg-emerald-50`, `bg-red-50` 등)
3. **WatchlistPanel 만 클릭 연결** — 카드들은 Layer 1
4. **차트 탭은 SVG placeholder** — 실 TradingView·lightweight-charts 연결 시도 X
5. **호가창 더미 = 5호가** (10호가는 Layer 1)
6. **xl 미만 화면 (1280px 미만) 에서는 패널 숨김** — `hidden xl:flex` 유지
7. **console.log 남기지 말 것** — CLAUDE.md 규칙
8. **빌드 깨지면 즉시 멈추고 보고** — 강제 진행 금지
