<!-- 2026-06-06 -->
# STEP 178 — 실시간 차트 토스화: ♥ 관심 토글 + 상세 패널 캔들차트

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_178_COMMAND.md 파일 내용대로 실행해줘`

## 목표
- **랭킹에 ♥ 관심 토글** — 토스처럼 각 행 맨 앞 ♥. 누르면 관심종목 추가/해제 → **우측 관심 레일과 동기화**. "전일대비"→"등락률" 라벨.
- **상세 패널 차트를 캔들(일봉)** 로 — 토스처럼 (기존 라인 → 캔들스틱).
> 거래비율 바·AI 요약은 토스 전용 데이터라 제외(추후 운종 대안).

## 전제 상태
- HEAD: STEP 177 적용된 상태
- 변경: `components/market/MarketClient.tsx`(♥ 4곳) · `components/home-v6/HomeStockDetail.tsx`(캔들 전체 교체)

---

## 작업 1/5 — `components/market/MarketClient.tsx` ① import

**찾기:**
```tsx
import { StockLogo } from "@/components/ui/StockLogo";
```
**바꾸기:**
```tsx
import { StockLogo } from "@/components/ui/StockLogo";
import { Heart } from "lucide-react";
import { useWatchlist } from "@/stores/watchlistStore";
```

## 작업 2/5 — `MarketClient.tsx` ② 관심 store 훅 + mounted

**찾기:**
```tsx
  const router = useRouter();
```
**바꾸기:**
```tsx
  const router = useRouter();
  const watchItems = useWatchlist((s) => s.items);
  const addWatch = useWatchlist((s) => s.add);
  const removeWatch = useWatchlist((s) => s.remove);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isWatched = (code: string) => watchItems.some((i) => i.code === code);
```

## 작업 3/5 — `MarketClient.tsx` ③ thead (♥ 칸 + 등락률 라벨)

**찾기:**
```tsx
                  <tr className="text-xs text-unjong-muted border-b border-unjong-border">
                    <th className="text-left font-medium px-4 py-2.5 w-12">순위</th>
                    <th className="text-left font-medium px-4 py-2.5">종목명</th>
                    <th className="text-right font-medium px-4 py-2.5">현재가</th>
                    <th className="text-right font-medium px-4 py-2.5">전일대비</th>
```
**바꾸기:**
```tsx
                  <tr className="text-xs text-unjong-muted border-b border-unjong-border">
                    <th className="w-8 px-2 py-2.5"></th>
                    <th className="text-left font-medium px-4 py-2.5 w-12">순위</th>
                    <th className="text-left font-medium px-4 py-2.5">종목명</th>
                    <th className="text-right font-medium px-4 py-2.5">현재가</th>
                    <th className="text-right font-medium px-4 py-2.5">등락률</th>
```

## 작업 4/5 — `MarketClient.tsx` ④ 행에 ♥ 셀

**찾기:**
```tsx
                        className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                      >
                        <td className="px-4 py-3 text-unjong-muted tabular-nums">{r.rank}</td>
```
**바꾸기:**
```tsx
                        className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                      >
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            aria-label="관심 토글"
                            className="p-0.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWatched(r.symbol)) removeWatch(r.symbol);
                              else addWatch({ code: r.symbol, name: r.name, market: country === "us" ? "US" : "KOSPI" });
                            }}
                          >
                            <Heart
                              size={15}
                              fill={mounted && isWatched(r.symbol) ? "currentColor" : "none"}
                              className={mounted && isWatched(r.symbol) ? "text-[#F04452]" : "text-unjong-muted hover:text-[#F04452]"}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-unjong-muted tabular-nums">{r.rank}</td>
```

---

## 작업 5/5 — `components/home-v6/HomeStockDetail.tsx` (캔들차트로 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import type { HoverStock } from "@/components/market/MarketClient";

type Candle = { open: number; high: number; low: number; close: number };

function fmtAmount(won?: number): string {
  if (!won || won <= 0) return "—";
  if (won >= 1e12) return `${(won / 1e12).toFixed(1)}조`;
  if (won >= 1e8) return `${Math.round(won / 1e8).toLocaleString()}억`;
  return won.toLocaleString();
}

function CandleChart({ candles }: { candles: Candle[] }) {
  if (candles.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const data = candles.slice(-50);
  const w = 280;
  const h = 128;
  const pad = 4;
  const max = Math.max(...data.map((c) => c.high));
  const min = Math.min(...data.map((c) => c.low));
  const range = max - min || 1;
  const cw = w / data.length;
  const y = (v: number) => pad + (h - 2 * pad) * (1 - (v - min) / range);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
      {data.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.close >= c.open;
        const color = up ? "#1AC267" : "#F04452";
        const top = y(Math.max(c.open, c.close));
        const bot = y(Math.min(c.open, c.close));
        const bw = Math.max(1.2, cw * 0.6);
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={0.8} />
            <rect x={x - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}

export default function HomeStockDetail({ stock }: { stock: HoverStock | null }) {
  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    if (!stock || !/^\d{6}$/.test(stock.symbol)) {
      setCandles([]);
      return;
    }
    const code = stock.symbol;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const j = await (await fetch(`/api/kis/chart?symbol=${code}&period=D`)).json();
        const cs = ((j.candles ?? []) as Candle[]).filter((c) => c.close > 0);
        if (!cancelled) setCandles(cs);
      } catch {
        if (!cancelled) setCandles([]);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [stock?.symbol]);

  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-5 overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
        {!stock ? (
          <div className="p-5 text-sm text-unjong-muted">종목에 마우스를 올리면 상세가 표시됩니다.</div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 border-b border-unjong-border p-4">
              <StockLogo code={stock.symbol} name={stock.name} size={36} />
              <div className="min-w-0">
                <p className="truncate font-bold text-unjong-primary">{stock.name}</p>
                <p className={`text-sm font-semibold tabular-nums ${stock.changePercent >= 0 ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                  {stock.priceText}
                  <span className="ml-1 text-xs">({stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%)</span>
                </p>
              </div>
            </div>

            <div className="border-b border-unjong-border px-2 py-3">
              <p className="px-2 pb-1 text-xs text-unjong-muted">일봉</p>
              <CandleChart candles={candles} />
            </div>

            <div className="grid grid-cols-2 gap-px bg-unjong-border text-xs">
              <div className="bg-unjong-surface p-3">
                <p className="mb-0.5 text-unjong-muted">거래량</p>
                <p className="font-semibold text-unjong-primary tabular-nums">{stock.volume ? stock.volume.toLocaleString() : "—"}</p>
              </div>
              <div className="bg-unjong-surface p-3">
                <p className="mb-0.5 text-unjong-muted">거래대금</p>
                <p className="font-semibold text-unjong-primary tabular-nums">{fmtAmount(stock.tradeAmount)}</p>
              </div>
            </div>

            <div className="p-4">
              <Link href={`/stock/${stock.symbol}`} className="block w-full rounded-lg bg-unjong-primary py-2 text-center text-sm font-semibold text-white hover:opacity-90">
                종목 상세 · 토론 보기 →
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
```

> 변경점: 라인 → **캔들스틱(일봉, 최근 50봉)**. 빨강/초록 캔들, 위아래 꼬리. 나머지(헤더·지표·CTA) 동일.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeStockDetail.tsx && git commit -m "feat(v7): 실시간 차트 토스화 — 랭킹 ♥ 관심 토글(레일 동기화) + 상세 패널 캔들차트 (STEP 178)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 랭킹 각 행 맨 앞 **♥**, 누르면 채워지고 **우측 관심 레일에 추가/해제** 되는지
- [ ] "전일대비" → "등락률" 라벨
- [ ] 상세 패널 차트가 **캔들스틱(일봉)** 으로 바뀌었는지 (국내 종목 hover)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- ♥ 초기 채움 상태는 mounted 후 반영(hydration 안전).
- 미국 종목은 KIS 차트 미지원 → "차트 데이터 없음"(헤더·지표·CTA는 표시). 미국 차트는 추후 Yahoo.
- 거래비율 바·AI 요약은 토스 전용 → 미구현(추후 운종 대안: 매수/매도잔량 바, 운종 AI).
- 다음: 미국 탭 "데이터 없음" 버그 · 카테고리 레이아웃.

---
> STEP 178 = 실시간 차트 ♥ + 캔들. 전제 STEP 177. 다음: 미국탭 버그 · 카테고리. 문서 묶어 갱신.
