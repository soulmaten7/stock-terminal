<!-- 2026-06-06 -->
# STEP 175 — 종목 상세 패널 "완성" (실제 차트 + 지표, placeholder 제거)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_175_COMMAND.md 파일 내용대로 실행해줘`

## 목표
hover 상세 패널을 **완성된 모습**으로 (placeholder "추후 연동" 제거):
- **실제 미니 차트** — 국내 종목은 `/api/kis/chart`(일봉) 종가로 스파크라인. hover **debounce 350ms**(KIS rate-limit 방지), 국내(6자리)만 차트.
- **거래량·거래대금** 실데이터(랭킹 행에서 받음)
- **"종목 상세·토론 보기"** CTA 버튼
- "증권사 상품/단톡방 — 추후 연동" 텍스트는 **제거**(운종 데이터 생기면 그때 추가, 지금은 안 보이게)

## 전제 상태
- HEAD: `13067c6`(STEP 174) 이상
- 변경: `components/market/MarketClient.tsx`(HoverStock 타입+onHover 2곳) · `components/home-v6/HomeStockDetail.tsx`(전체 교체)

---

## 작업 1/2 — `components/market/MarketClient.tsx` (hover 데이터에 거래량·거래대금 추가, 2곳)

### ① HoverStock 타입 확장
**찾기:**
```tsx
export type HoverStock = { symbol: string; name: string; priceText: string; changePercent: number };
```
**바꾸기:**
```tsx
export type HoverStock = { symbol: string; name: string; priceText: string; changePercent: number; volume: number; tradeAmount?: number };
```

### ② onMouseEnter 에 volume·tradeAmount
**찾기:**
```tsx
                        onMouseEnter={() => onHover?.({ symbol: r.symbol, name: r.name, priceText: r.priceText, changePercent: r.changePercent })}
```
**바꾸기:**
```tsx
                        onMouseEnter={() => onHover?.({ symbol: r.symbol, name: r.name, priceText: r.priceText, changePercent: r.changePercent, volume: r.volume, tradeAmount: r.tradeAmount })}
```

---

## 작업 2/2 — `components/home-v6/HomeStockDetail.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import type { HoverStock } from "@/components/market/MarketClient";

function fmtAmount(won?: number): string {
  if (!won || won <= 0) return "—";
  if (won >= 1e12) return `${(won / 1e12).toFixed(1)}조`;
  if (won >= 1e8) return `${Math.round(won / 1e8).toLocaleString()}억`;
  return won.toLocaleString();
}

function MiniChart({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) {
    return <div className="flex h-32 items-center justify-center text-xs text-unjong-muted">차트 데이터 없음</div>;
  }
  const w = 280;
  const h = 128;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const stroke = up ? "#1AC267" : "#F04452";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-32 w-full">
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={stroke} opacity="0.07" />
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function HomeStockDetail({ stock }: { stock: HoverStock | null }) {
  const [candles, setCandles] = useState<number[]>([]);

  // 국내(6자리)만 일봉 차트. hover debounce 350ms 로 KIS 호출 최소화.
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
        const closes = (j.candles ?? [])
          .map((c: { close: number }) => c.close)
          .filter((n: number) => n > 0);
        if (!cancelled) setCandles(closes.slice(-60));
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
            {/* 헤더 */}
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

            {/* 미니 차트 (국내 일봉) */}
            <div className="border-b border-unjong-border px-2 py-3">
              <MiniChart points={candles} up={stock.changePercent >= 0} />
            </div>

            {/* 핵심 지표 (실데이터) */}
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

            {/* CTA */}
            <div className="p-4">
              <Link
                href={`/stock/${stock.symbol}`}
                className="block w-full rounded-lg bg-unjong-primary py-2 text-center text-sm font-semibold text-white hover:opacity-90"
              >
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

> 변경점: "추후 연동" placeholder 전부 제거 → **실제 미니 차트(국내 일봉) + 거래량·거래대금(실데이터) + 토론 CTA**. 미국 종목은 KIS 차트 미지원이라 "차트 데이터 없음"(헤더·지표·CTA는 표시).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeStockDetail.tsx && git commit -m "feat(v7): 종목 상세 패널 완성 — 실제 미니 차트(KIS 일봉) + 거래량/거래대금 + 토론 CTA, placeholder 제거 (STEP 175)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 랭킹 국내 종목에 마우스 올리면 상세 패널에 **실제 미니 차트** + 거래량·거래대금 + "종목 상세·토론 보기" 버튼 (placeholder "추후 연동" 사라짐)
- [ ] 마우스 빠르게 움직여도 차트 호출이 과하지 않은지(debounce). 잠깐 멈추면 차트 뜸
- [ ] 미국 종목(미국 탭)은 "차트 데이터 없음" + 나머지 정상
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 차트는 국내(6자리)만(KIS). 미국은 추후 Yahoo 차트 연동 시 추가.
- hover debounce 350ms + KIS 캐시 → rate-limit 안전. 그래도 차트가 자주 빈값이면 debounce 늘리기.
- **다음(STEP 176): 지수 영역 토스 레이아웃** — featured 큰 카드 + 주요일정 카드(전체 레이아웃 토스화). 그 다음 랭킹 컬럼 · 카테고리 탭.

---
> STEP 175 = 상세 패널 완성. 전제 `13067c6`. 다음: 지수 영역 토스 레이아웃 · 랭킹 컬럼 · 카테고리 탭. 문서 묶어 갱신.
