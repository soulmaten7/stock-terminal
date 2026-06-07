<!-- 2026-06-06 -->
# STEP 180 — 상세 패널 커뮤니티(토스식): 차트 밑 종목 토론

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_180_COMMAND.md 파일 내용대로 실행해줘`

## 목표
상세 패널 레이아웃을 토스처럼: **헤더 → 캔들차트 → 커뮤니티(종목 토론 글)**.
- 거래량/거래대금 박스 **제거**(토스 패널엔 없음)
- `discussions` 테이블(`createAnonClient`)에서 해당 종목 최근 토론 3개 — **있으면 실제 글(닉네임·내용·시간), 없으면 "첫 의견 남기기" 안내**(가짜 X)
- "종목 상세·토론 보기" 버튼 유지

## 전제 상태
- HEAD: STEP 179 적용된 상태
- 변경: `components/home-v6/HomeStockDetail.tsx`(전체 교체) 1파일
- 참고: `discussions` 컬럼 = id, symbol, nickname, tier, content, like_count, dislike_count, comment_count, created_at

---

## 작업 1/1 — `components/home-v6/HomeStockDetail.tsx` (파일 전체 교체)

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import { createAnonClient } from "@/lib/supabase/anon-client";
import type { HoverStock } from "@/components/market/MarketClient";

type Candle = { open: number; high: number; low: number; close: number };
type Post = { id: string; nickname: string; tier: string | null; content: string; created_at: string };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
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
  const [posts, setPosts] = useState<Post[]>([]);

  // 차트 (국내 6자리, debounce)
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
    return () => { cancelled = true; clearTimeout(t); };
  }, [stock?.symbol]);

  // 커뮤니티 (종목 토론, debounce)
  useEffect(() => {
    if (!stock) { setPosts([]); return; }
    const code = stock.symbol;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("discussions")
          .select("id, nickname, tier, content, created_at")
          .eq("symbol", code)
          .eq("hidden", false)
          .order("created_at", { ascending: false })
          .limit(3);
        if (!cancelled) setPosts((data as Post[]) ?? []);
      } catch {
        if (!cancelled) setPosts([]);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
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

            {/* 캔들차트 */}
            <div className="border-b border-unjong-border px-2 py-3">
              <p className="px-2 pb-1 text-xs text-unjong-muted">일봉</p>
              <CandleChart candles={candles} />
            </div>

            {/* 커뮤니티 */}
            <div className="border-b border-unjong-border p-4">
              <p className="mb-2 text-xs font-semibold text-unjong-muted">커뮤니티</p>
              {posts.length === 0 ? (
                <p className="text-xs text-unjong-muted">아직 토론이 없어요. 첫 의견을 남겨보세요.</p>
              ) : (
                <ul className="space-y-2.5">
                  {posts.map((p) => (
                    <li key={p.id} className="text-xs">
                      <p className="mb-0.5 text-unjong-muted">
                        {p.nickname}
                        {p.tier ? <span className="ml-1 rounded bg-unjong-background px-1 py-0.5 text-[10px]">{p.tier}</span> : null}
                        <span className="ml-1">· {timeAgo(p.created_at)}</span>
                      </p>
                      <p className="line-clamp-2 text-unjong-primary">{p.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* CTA */}
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

> 변경점: 거래량/거래대금 박스 → **커뮤니티(종목 토론)**. 토론 있으면 닉네임·내용·시간, 없으면 "첫 의견 남기기" 안내. 캔들차트·헤더·CTA 유지. (운종은 신규라 대부분 토론 0개 → 안내 표시가 정상)

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeStockDetail.tsx && git commit -m "feat(v7): 상세 패널 커뮤니티(토스식) — 차트 밑 종목 토론(있으면 실제, 없으면 CTA), 거래량/거래대금 박스 제거 (STEP 180)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 상세 패널이 **헤더 → 캔들차트 → 커뮤니티 → 버튼** 순(토스 레이아웃), 거래량/거래대금 박스 사라짐
- [ ] 토론 있는 종목은 글 표시, 없으면 "아직 토론이 없어요…" 안내
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 운종 신규라 대부분 종목 토론 0개 → 안내 문구 정상(가짜 글 X). 실제 글 쌓이면 자동 표시.
- 커뮤니티/차트 fetch는 hover debounce 350ms.
- 다음: 미국 탭 "데이터 없음" 버그 · 카테고리 레이아웃.

---
> STEP 180 = 상세 패널 커뮤니티. 전제 STEP 179. 다음: 미국탭 버그 · 카테고리. 문서 묶어 갱신.
