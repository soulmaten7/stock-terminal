<!-- 2026-06-15 -->
# STEP 271 — 종목 상세: 미국 차트 살리기 (placeholder → yahoo 일봉)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_271_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (종목 상세 점검 1/?)
점검 결과: 주식·ETF·ETN·리츠 상세 = 정상. **미국(AAPL) 상세만 미완성** — 차트가 `if (isUS) return "미국 주식 차트는 Yahoo Finance 통합 추후"` placeholder.
- KR 차트와 렌더링 동일(`{candles:[{time,open,high,low,close}]}`). 미국은 **이미 있는 `/api/yahoo/chart`**(STEP 251, AAPL ~270봉 확인)만 연결.
- 미국은 일봉만(yahoo) → D/W/M 토글 숨김 + "미국 종목 · 일봉(Yahoo Finance)" 라벨.
- (다음 STEP: 미국 호가·체결·정보패널 graceful 상태 — KIS 국내전용이라 "로딩 중" 멈춤 정리.)

## 전제 상태
- 현재 HEAD: STEP 270 적용 후(`db791b0`)
- 변경 **1파일**: `components/stock/StockChartSection.tsx` (**전체 교체**)

---

## 작업 1/1 — `components/stock/StockChartSection.tsx` (전체 교체)

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = { symbol: string };

export default function StockChartSection({ symbol }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<"D" | "W" | "M">("D");
  const isUS = /^[A-Z.\-]+$/.test(symbol);

  useEffect(() => {
    if (!chartRef.current) return;
    // 국내(6자리)=KIS(D/W/M) · 미국=yahoo(일봉). 둘 다 {candles:[{time,open,high,low,close}]}.
    const url = isUS
      ? `/api/yahoo/chart?symbol=${encodeURIComponent(symbol)}`
      : `/api/kis/chart?symbol=${symbol}&period=${period}`;
    let chart: ReturnType<typeof import("lightweight-charts").createChart> | null = null;
    let ro: ResizeObserver | null = null;
    let cancelled = false;
    const load = async () => {
      try {
        const [{ createChart, ColorType, LineStyle }, res] = await Promise.all([
          import("lightweight-charts"),
          fetch(url).then((r) => r.json()),
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
          upColor: "#F04452", downColor: "#3182F6",
          borderUpColor: "#F04452", borderDownColor: "#3182F6",
          wickUpColor: "#F04452", wickDownColor: "#3182F6",
        });
        series.setData(
          res.candles.map((c: { time: string; open: number; high: number; low: number; close: number }) => ({
            time: c.time as import("lightweight-charts").Time,
            open: c.open, high: c.high, low: c.low, close: c.close,
          }))
        );
        chart.timeScale().fitContent();
        ro = new ResizeObserver(() => { if (chart && chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth }); });
        ro.observe(chartRef.current);
      } catch {
        // 차트 로딩 실패 무시
      }
    };
    load();
    return () => { cancelled = true; if (ro) ro.disconnect(); if (chart) chart.remove(); };
  }, [symbol, period, isUS]);

  return (
    <div className="space-y-3">
      {!isUS && (
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
      )}
      {isUS && <p className="text-xs text-unjong-muted">미국 종목 · 일봉 (Yahoo Finance)</p>}
      <div ref={chartRef} className="w-full h-[400px] bg-unjong-background rounded-lg" />
    </div>
  );
}
```

> 변경: `isUS`를 위로 + placeholder 제거. useEffect에서 미국이면 `/api/yahoo/chart` fetch(렌더링은 KR과 동일). 미국은 D/W/M 토글 숨기고 안내 라벨.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add components/stock/StockChartSection.tsx && git commit -m "feat(v7): 종목 상세 미국 차트 yahoo 연결 (placeholder 제거) (STEP 271)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 재시작** 후 `/stock/AAPL?name=Apple` → 차트·시세 탭에 **미국 일봉 차트** 뜸(전엔 "…추후" 문구)
- [ ] 국내(예: `/stock/005930`)는 기존대로 D/W/M 정상
- [ ] (미국 호가·체결·좌측 정보패널은 아직 "로딩 중" — 다음 STEP에서 정리)

## 주의·예상 이슈
- yahoo 일봉은 장 마감 기준(실시간 아님) — 상세 차트엔 충분.
- 미국 호가·체결·정보패널 graceful 처리는 STEP 272 예정.
- **문서 TODO**(다음 갱신): STEP 265~271.

---
> STEP 271 = 미국 상세 차트. 전제 STEP 270(`db791b0`).
