<!-- 2026-06-01 -->
# STEP 131 — 종목 페이지 네이버 탭 시스템 + 우측 fixed nav

## 실행 명령어
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- STEP 129·130 완료 (CardContainer·카드 콘텐츠 토스 스타일)
- 현재 종목 페이지 (`/stock/[code]`): 좌 320px / 중 토론·뉴스 / 우 380px 채팅
- 네이버 페이 증권 스타일: 가운데 메인을 **탭 시스템** (차트·시세 / 토론 / 종목분석 / 리포트 / 뉴스·공시 / 인사이트)

## 목표

| 영역 | 변경 |
|------|------|
| **종목 페이지 가운데** | 단일 스크롤 → **탭 시스템** (차트·시세 / 토론 / 뉴스 / 인사이트) |
| **우측 fixed nav** | 화면 우측 끝 48px (알림·관심·내 종목·최근) |
| **레이아웃** | 좌 320 / 중 1fr / 우 380 그대로, fixed nav 추가 (외부) |

## 작업

### [1] 신규 컴포넌트 — `components/stock/StockTabs.tsx`

```tsx
"use client";

import { useState } from "react";
import { LineChart, MessageSquare, Newspaper, BarChart3 } from "lucide-react";
import StockChartSection from "./StockChartSection";
import DiscussionBoard from "./DiscussionBoard";
import StockNewsModule from "./StockNewsModule";
import StockInsightsTab from "./StockInsightsTab";

type Tab = "chart" | "discussion" | "news" | "insights";

const TABS: Array<{ id: Tab; label: string; icon: typeof LineChart }> = [
  { id: "chart", label: "차트·시세", icon: LineChart },
  { id: "discussion", label: "토론", icon: MessageSquare },
  { id: "news", label: "뉴스", icon: Newspaper },
  { id: "insights", label: "인사이트", icon: BarChart3 },
];

type Props = { symbol: string; stockName: string };

export default function StockTabs({ symbol, stockName }: Props) {
  const [active, setActive] = useState<Tab>("discussion");

  return (
    <div>
      {/* 탭 헤더 */}
      <nav className="flex border-b border-unjong-border bg-unjong-surface rounded-t-2xl px-2" aria-label="종목 상세 탭">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={`
                flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${active === t.id
                  ? "border-unjong-accent text-unjong-primary"
                  : "border-transparent text-unjong-muted hover:text-unjong-primary"}
              `}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* 탭 콘텐츠 */}
      <div className="bg-unjong-surface rounded-b-2xl shadow-soft p-5 min-h-[400px]">
        {active === "chart" && <StockChartSection symbol={symbol} />}
        {active === "discussion" && <DiscussionBoard symbol={symbol} stockName={stockName} />}
        {active === "news" && <StockNewsModule symbol={symbol} />}
        {active === "insights" && <StockInsightsTab symbol={symbol} />}
      </div>
    </div>
  );
}
```

### [2] 신규 — `components/stock/StockChartSection.tsx`

기존 StockInfoPanel 의 차트 부분 분리. 큰 차트 (높이 400px) + 일/주/월 토글:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = { symbol: string };

export default function StockChartSection({ symbol }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<"D" | "W" | "M">("D");

  useEffect(() => {
    if (!/^\d{6}$/.test(symbol)) return;
    if (!chartRef.current) return;
    let chart: ReturnType<typeof import("lightweight-charts").createChart> | null = null;
    let cancelled = false;
    const load = async () => {
      try {
        const [{ createChart, ColorType, LineStyle }, res] = await Promise.all([
          import("lightweight-charts"),
          fetch(`/api/kis/chart?symbol=${symbol}&period=${period}`).then((r) => r.json()),
        ]);
        if (cancelled || !chartRef.current || !res.candles?.length) return;
        chartRef.current.innerHTML = "";
        const width = chartRef.current.clientWidth || 800;
        chart = createChart(chartRef.current, {
          width,
          height: 400,
          layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#4E5968", fontFamily: "inherit", attributionLogo: false },
          grid: { vertLines: { color: "#F2F4F6", style: LineStyle.Dotted }, horzLines: { color: "#F2F4F6", style: LineStyle.Dotted } },
          rightPriceScale: { borderColor: "#E5E7EB" },
          timeScale: { borderColor: "#E5E7EB", timeVisible: false },
        });
        const series = chart.addCandlestickSeries({
          upColor: "#1AC267", downColor: "#F04452",
          borderUpColor: "#1AC267", borderDownColor: "#F04452",
          wickUpColor: "#1AC267", wickDownColor: "#F04452",
        });
        series.setData(res.candles.map((c: { time: string; open: number; high: number; low: number; close: number }) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })));
        chart.timeScale().fitContent();
        const ro = new ResizeObserver(() => { if (chart && chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth }); });
        ro.observe(chartRef.current);
        (chart as unknown as { _ro?: ResizeObserver })._ro = ro;
      } catch {}
    };
    load();
    return () => { cancelled = true; if (chart) { const ro = (chart as unknown as { _ro?: ResizeObserver })._ro; if (ro) ro.disconnect(); chart.remove(); } };
  }, [symbol, period]);

  const isUS = /^[A-Z.\-]+$/.test(symbol);
  if (isUS) {
    return <div className="text-center py-12 text-sm text-unjong-muted">미국 주식 차트는 Yahoo Finance 통합 추후</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {(["D", "W", "M"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${period === p ? "bg-unjong-primary text-white" : "text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"}`}
          >
            {p === "D" ? "일봉" : p === "W" ? "주봉" : "월봉"}
          </button>
        ))}
      </div>
      <div ref={chartRef} className="w-full h-[400px] bg-unjong-background rounded-lg" />
    </div>
  );
}
```

### [3] 신규 — `components/stock/StockInsightsTab.tsx`

```tsx
type Props = { symbol: string };
export default function StockInsightsTab({ symbol }: Props) {
  return (
    <div className="text-center py-12 text-sm text-unjong-muted">
      <p>📊 인사이트</p>
      <p className="mt-2 text-xs">차트 분석·재무 비교·동종업종 — 추후 통합 예정</p>
      <p className="mt-1 text-xs">현재 종목: {symbol}</p>
    </div>
  );
}
```

### [4] StockPageClient — 탭 시스템 적용

```tsx
// 기존 가운데 main 영역 변경
<main>
  <StockNewsModule />  // 제거 (탭에 통합)
  <DiscussionBoard />  // 제거 (탭에 통합)
</main>

// 변경
<main>
  <StockTabs symbol={code} stockName={stockName} />
</main>
```

### [5] 우측 fixed nav (48px)

신규 `components/layout/RightFixedNav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Bell, Star, Briefcase, Clock } from "lucide-react";

export default function RightFixedNav() {
  return (
    <nav className="fixed right-0 top-1/2 -translate-y-1/2 w-12 bg-unjong-surface border border-unjong-border rounded-l-xl shadow-soft py-2 flex flex-col items-center gap-1 z-40">
      <Link href="/notifications" className="p-2 rounded-lg text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background transition-colors" title="알림">
        <Bell size={18} />
      </Link>
      <Link href="/watchlist" className="p-2 rounded-lg text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background transition-colors" title="관심 종목">
        <Star size={18} />
      </Link>
      <Link href="/mypage" className="p-2 rounded-lg text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background transition-colors" title="내 종목">
        <Briefcase size={18} />
      </Link>
      <Link href="/recent" className="p-2 rounded-lg text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background transition-colors" title="최근 본">
        <Clock size={18} />
      </Link>
    </nav>
  );
}
```

`app/layout.tsx` 또는 `app/(windows)/layout.tsx` 같은 곳에 추가. 단 종목 페이지에만 보이도록 또는 전역 — 사용자 결정.

이번 STEP 에서는 종목 페이지 (`app/stock/layout.tsx`) 에만 추가.

### 빌드 검증
```bash
npm run build 2>&1 | tail -15
```

### 커밋 + 푸시
```bash
git add -A
git commit -m "feat(design): 종목 페이지 네이버 탭 시스템 + 우측 fixed nav (전면 리뉴얼 STEP 3/5)

탭 시스템 (네이버 페이 증권 스타일):
- 차트·시세 / 토론 / 뉴스 / 인사이트 4탭
- 활성 탭 border-b-2 하이라이트
- StockTabs 신규 컴포넌트
- StockChartSection: 큰 차트 (높이 400px) + 일/주/월 토글 + 토스 그린·레드
- StockInsightsTab: placeholder (재무·동종업종 추후)

우측 fixed nav (네이버 스타일):
- RightFixedNav 신규
- 알림·관심·내 종목·최근 본
- 종목 페이지에만 표시 (app/stock/layout.tsx)

StockPageClient 변경:
- 가운데 메인이 StockNewsModule + DiscussionBoard 직접 렌더 → StockTabs 통합

다음 STEP 132: 새 홈 손성기 모듈 순서 재배치 + MVP 2.0 진입"
git push
```
