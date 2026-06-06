<!-- 2026-06-06 -->
# STEP 174 — #2 종목 hover 상세 패널 3단 레이아웃 (토스식 UI 셸)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_174_COMMAND.md 파일 내용대로 실행해줘`

## 목표
토스처럼 **3단 레이아웃 [랭킹 ｜ 종목 상세 패널 ｜ 관심 레일]** + 랭킹 종목에 **마우스 올리면(hover) 가운데 상세 패널이 그 종목으로** 바뀜.
- 상세 패널 = **종목 헤더(로고·현재가·등락 — 실데이터)** + **차트 자리(placeholder)** + **운종 확장영역(증권사별 투자상품·단톡방/커뮤니티 — 추후 운종 데이터)**
- **UI 셸 우선**(요청): 차트·운종 데이터는 다음 단계에서 채움. AI/한줄요약 같은 가짜는 안 넣음.
- 상세 패널은 `xl` 이상에서 표시(좁은 화면은 2단 유지).

## 전제 상태
- HEAD: `cefe651`(STEP 173) 이상
- 변경: `components/market/MarketClient.tsx`(prop+hover 2곳) · 신규 `components/home-v6/HomeStockDetail.tsx` · `components/home-v6/HomeClientV6.tsx`(교체)

---

## 작업 1/3 — `components/market/MarketClient.tsx` (hover 콜백, 2곳)

### ① 시그니처 + 타입 export
**찾기:**
```tsx
export default function MarketClient({ embedded = false }: { embedded?: boolean }) {
```
**바꾸기:**
```tsx
export type HoverStock = { symbol: string; name: string; priceText: string; changePercent: number };

export default function MarketClient({ embedded = false, onHover }: { embedded?: boolean; onHover?: (s: HoverStock) => void }) {
```

### ② 행에 onMouseEnter
**찾기:**
```tsx
                      <tr
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}`)}
                        className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                      >
```
**바꾸기:**
```tsx
                      <tr
                        key={r.symbol}
                        onClick={() => router.push(`/stock/${r.symbol}`)}
                        onMouseEnter={() => onHover?.({ symbol: r.symbol, name: r.name, priceText: r.priceText, changePercent: r.changePercent })}
                        className="border-b border-unjong-border last:border-0 hover:bg-unjong-background cursor-pointer"
                      >
```
> `/market` 페이지(`<MarketClient />`)는 `onHover` 없음 → 동작 동일(무영향). 홈만 hover 연동.

---

## 작업 2/3 — 신규 파일 `components/home-v6/HomeStockDetail.tsx`

```tsx
"use client";

import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import type { HoverStock } from "@/components/market/MarketClient";

export default function HomeStockDetail({ stock }: { stock: HoverStock | null }) {
  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-5 rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft overflow-hidden">
        {!stock ? (
          <div className="p-5 text-sm text-unjong-muted">
            종목에 마우스를 올리면 상세가 여기에 표시됩니다.
          </div>
        ) : (
          <>
            {/* 헤더 (실데이터) */}
            <div className="flex items-center gap-2.5 border-b border-unjong-border p-4">
              <StockLogo code={stock.symbol} name={stock.name} size={36} />
              <div className="min-w-0">
                <p className="font-bold text-unjong-primary truncate">{stock.name}</p>
                <p className={`text-sm font-semibold tabular-nums ${stock.changePercent >= 0 ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                  {stock.priceText}
                  <span className="ml-1 text-xs">
                    ({stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>

            {/* 차트 (추후 연동) */}
            <div className="border-b border-unjong-border p-4">
              <p className="mb-2 text-xs font-semibold text-unjong-muted">차트</p>
              <div className="flex h-28 items-center justify-center rounded-lg bg-unjong-background text-xs text-unjong-muted">
                차트 — 추후 연동
              </div>
            </div>

            {/* 운종 확장영역 (추후: 증권사 상품·단톡방 링크 등) */}
            <div className="space-y-3 p-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-unjong-muted">증권사별 투자상품</p>
                <p className="text-xs text-unjong-muted">운종 데이터 — 추후 연동</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-unjong-muted">단톡방 · 커뮤니티</p>
                <Link href={`/stock/${stock.symbol}`} className="text-xs text-unjong-accent hover:underline">
                  종목 토론 보기 →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
```

---

## 작업 3/3 — `components/home-v6/HomeClientV6.tsx` (파일 전체 교체)

```tsx
"use client";

import { useRef, useState } from "react";
import HomeIndexBar from "./HomeIndexBar";
import HomeRightRail from "./HomeRightRail";
import HomeStickyTicker from "./HomeStickyTicker";
import HomeStockDetail from "./HomeStockDetail";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";

export default function HomeClientV6() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  return (
    <div className="px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* 왼쪽: 상태바 + 지수 그리드 + (랭킹 | 상세) */}
        <div className="min-w-0">
          {/* 시장 상태바 */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-unjong-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
              국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1AC267]" />
              해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
            </span>
          </div>

          {/* 지수 그리드 */}
          <div ref={gridRef}>
            <HomeIndexBar />
          </div>

          {/* 랭킹 + (xl) 종목 상세 패널 */}
          <div className="mt-5 flex gap-4">
            <div className="flex-1 min-w-0">
              <MarketClient embedded onHover={setHovered} />
            </div>
            <HomeStockDetail stock={hovered} />
          </div>
        </div>

        {/* 오른쪽: 관심 레일 */}
        <HomeRightRail />
      </div>

      {/* 하단 마퀴 티커 */}
      <HomeStickyTicker observeRef={gridRef} />
    </div>
  );
}
```
> 변경점: 랭킹을 `flex`로 감싸 오른쪽에 `HomeStockDetail`(xl 표시) 추가, `hovered` state 를 `MarketClient onHover`로 받음 → 3단 [랭킹｜상세｜관심]. 지수 그리드·관심 레일·하단 티커 유지.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx components/home-v6/HomeStockDetail.tsx components/home-v6/HomeClientV6.tsx && git commit -m "feat(v7): 종목 hover 상세 3단 레이아웃(토스 UI 셸) — 랭킹|상세|관심, hover 연동 + 운종 확장영역 placeholder (STEP 174)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 넓은 화면(xl)에서 **[랭킹 ｜ 종목 상세 ｜ 관심 레일] 3단**으로 보이는지
- [ ] 랭킹 종목에 **마우스 올리면 가운데 상세 패널**이 그 종목(로고·현재가·등락)으로 바뀌는지
- [ ] 상세 패널에 차트 자리 + "증권사별 투자상품 / 단톡방·커뮤니티" 영역(추후) 보이는지
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 상세 패널은 `xl` 이상에서만(좁은 화면은 2단 유지) — 의도된 동작.
- 차트·운종 데이터(증권사 상품·단톡방)는 **다음 STEP에서 채움**(이번은 UI 셸).
- `/market` 페이지는 `onHover` 안 넘겨서 영향 없음.
- 랭킹이 상세(320px)만큼 좁아짐 — 넓은 화면 기준 정상.

---
> STEP 174 = #2 hover 상세 3단 셸. 전제 `cefe651`. 다음: 상세 패널 실콘텐츠(차트·운종 상품/단톡방) · #4 카테고리 탭. 문서 묶어 갱신.
