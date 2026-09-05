<!-- 2026-05-27 -->
# STEP 95-F — 카드 풀폭 (관심종목 영역 침범)

> **목표**: 우측 영역 안에서 1행(종목상세 + 관심종목 가로) + 2행~(카드 풀폭, 관심종목 위 침범) 구조.
> **세션**: #25
> **전제**: STEP 95-E (`ea52558`) + STEP 95-E1 (`8c7dc6a`) 완료, 3컬럼 작동 중
> **유형**: 레이아웃 재구성 (작업 시간 30분~1시간)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_95F_COMMAND.md 파일 내용대로 실행해줘
```

---

## 문제

현재 STEP 95-E 결과:
```
┌──────┬──────────────────────────┬──────┐
│ 채팅  │ 종목상세                  │ 관심   │
│      ├──────────────────────────┤ 종목   │
│      │ 카드 (가운데만, 2열)        │       │
│ Layer├──────────────────────────┤       │
│ 2    │ ...                       │ (긴   │
│ 빈공간│                          │ 컬럼) │
└──────┴──────────────────────────┴──────┘
```

→ 카드가 가운데 영역에만 표시. 관심종목은 우측 별도 컬럼 (전체 높이) — 관심종목 8개 후 우측에 빈 공간.

## 목표 (사용자 의도)

```
┌──────┬───────────────────────┬───────┐
│ 채팅  │ 종목상세 (가운데)       │ 관심   │  ← 1행 가로 배치
│      │                       │ 종목   │
├──────┼───────────────────────┴───────┤
│ Layer│                                │
│ 2    │ 카드 (풀폭, 관심종목 영역 침범)  │  ← 2행~ 카드 풀폭
│ 빈공간│ Movers · Volume                │
│      │ VI · NetBuy                    │
│      │ ...                            │
└──────┴───────────────────────────────┘
```

→ 카드가 우측 영역 풀폭 차지 (관심종목 위까지).

---

## 작업 1 — `app/(windows)/layout.tsx` 재구성

기존 구조:
```tsx
<div className="flex bg-unjong-background min-h-screen">
  <aside className="w-[300px]">{/* 채팅 + Layer 2 */}</aside>
  <div className="flex-1 flex flex-col">
    <ContextNav />
    <main className="flex-1 p-4 space-y-4">
      <StockDetailPanel inline />
      {children}
    </main>
  </div>
  <aside className="w-[300px]">{/* 관심종목 */}</aside>  ← 전체 높이 차지
</div>
```

새 구조:
```tsx
import type { ReactNode } from "react";
import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import { StockDetailPanel } from "@/components/sidepanel/StockDetailPanel";
import { ContextNav } from "@/components/header/ContextNav";

/**
 * 운종 3창 공통 레이아웃 (STEP 95-F)
 *
 * 구조:
 * - 좌측 (300px, sticky top): 채팅 + Layer 2 placeholder
 * - 우측 영역 (flex-1):
 *   - ContextNav (창별 컨텍스트 메뉴)
 *   - 1행: 종목상세 (flex-1) + 관심종목 (300px) — 가로 배치
 *   - 2행~: 카드 그리드 (children) — 우측 영역 풀폭 (관심종목 위 침범)
 */
export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-unjong-background min-h-screen">
      {/* ─── 좌측 컬럼: 채팅 (sticky top) ─── */}
      <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
        <div className="sticky top-0 h-[500px] flex flex-col">
          <ChatPanel />
        </div>
        <div className="border-t border-unjong-border bg-unjong-background p-3 text-[10px] text-unjong-muted text-center italic">
          Layer 2 — 광고·텔레그램 링크 영역
        </div>
      </aside>

      {/* ─── 우측 영역: ContextNav + 1행 + 2행~ ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ContextNav (창별 네비) */}
        <ContextNav />

        {/* 1행: 종목상세 + 관심종목 가로 배치 */}
        <div className="flex gap-4 px-4 pt-4 items-stretch">
          <div className="flex-1 min-w-0">
            <StockDetailPanel inline />
          </div>
          <aside className="w-[300px] flex-shrink-0 flex flex-col">
            <WatchlistPanel />
          </aside>
        </div>

        {/* 2행~: 카드 그리드 풀폭 (children) */}
        <main className="px-4 py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
```

핵심 변경:
- **우측 별도 컬럼 (WatchlistPanel aside) 제거**
- **우측 영역 안에 1행 wrapper 추가** — 종목상세 + 관심종목 가로 배치
- **WatchlistPanel 위치** = 1행 안 종목상세 옆 (300px 폭, items-stretch 로 종목상세 높이만큼)
- **children (카드 그리드) = 우측 영역 풀폭** — 관심종목 위까지 침범 자동

---

## 작업 2 — `components/sidebar/WatchlistPanel.tsx` 점검·수정

기존 STEP 95-E 에서 max-h-[35%] 제거하고 자연 길이로 변경했음. 이번엔:
- 부모 (1행 wrapper) 의 items-stretch 로 종목상세 높이만큼만
- 관심종목이 종목상세 높이보다 길면 **자체 영역 안에서 overflow-y-auto**

수정:
```tsx
"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

// DUMMY_WATCHLIST 그대로

export function WatchlistPanel() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <div className="flex h-full flex-col rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden">
      {/* 헤더 — 고정 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2 bg-unjong-background flex-shrink-0">
        <span className="text-xs font-semibold text-unjong-primary">
          👀 관심종목 {DUMMY_WATCHLIST.length}개
        </span>
        <span className="text-[10px] text-unjong-muted">(더미)</span>
      </div>

      {/* 리스트 — 자체 영역 안 스크롤 */}
      <ul className="flex-1 overflow-y-auto divide-y divide-unjong-border min-h-0">
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

핵심:
- `h-full` 로 부모 (items-stretch) 높이 채움
- `rounded-lg border` 카드처럼 둥근 모서리 (종목상세 카드와 일관성)
- `overflow-hidden` 으로 둥근 모서리 클립
- `flex-1 overflow-y-auto min-h-0` 으로 리스트 자체 스크롤
- `flex-shrink-0` 으로 헤더 고정

→ 결과: 관심종목 = 종목상세 옆 같은 높이, 종목 많으면 안에서 스크롤.

---

## 작업 3 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- (windows)/layout.tsx 정상 컴파일
- WatchlistPanel 수정 정상

---

## 작업 4 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add "app/(windows)/layout.tsx"
git add components/sidebar/WatchlistPanel.tsx
git add docs/STEP_95F_COMMAND.md
git status
git commit -m "feat: STEP 95-F - 카드 풀폭 (관심종목 영역 침범)

레이아웃 재구성:
- 우측 별도 컬럼 (WatchlistPanel aside) 제거
- 우측 영역 안에 1행 wrapper 추가:
  · 종목상세 (flex-1) + 관심종목 (300px) 가로 배치
  · items-stretch 로 같은 높이 (종목상세 기준)
- 2행~: 카드 그리드 (children) — 우측 영역 풀폭
  · 관심종목 위까지 침범하여 더 넓은 카드 표시

WatchlistPanel 수정:
- h-full + rounded-lg border 로 카드 디자인
- flex-1 overflow-y-auto min-h-0 — 종목 많으면 자체 영역 안 스크롤
- 헤더 flex-shrink-0 고정

결과:
- 1행: 종목상세 (가로 풀폭) + 관심종목 (300px, 같은 높이)
- 2행~: 카드 2열 (관심종목 위까지 풀폭으로 확장)

다음: 화면 확인 후 미세 조정 (빈 공간 처리, 디자인 등)"
git push
```

---

## 검증 체크리스트

- [ ] (windows)/layout.tsx 가 1행 wrapper + 2행 main 구조
- [ ] 1행 = 종목상세 (flex-1) + 관심종목 (300px) 가로 배치, items-stretch
- [ ] 2행 children = 우측 영역 풀폭 (관심종목 위까지)
- [ ] WatchlistPanel 이 카드 디자인 (rounded-lg border, 둥근 모서리)
- [ ] 종목 많으면 WatchlistPanel 안에서 자체 스크롤
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 95-F 완료. 카드 풀폭 (관심종목 침범) 끝.

레이아웃 변경:
- 우측 별도 컬럼 제거 → 우측 영역 안 1행 + 2행 구조
- 1행: 종목상세 (flex-1) + 관심종목 (300px) 가로 배치
- 2행~: 카드 그리드 우측 영역 풀폭

WatchlistPanel:
- 카드 디자인 (rounded-lg border)
- 자체 스크롤 (overflow-y-auto)
- 종목상세 높이 따라가기 (items-stretch)

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/scalper
    → 1행: 종목상세 (풀폭) + 관심종목 (300px) 가로
    → 2행~: 카드 2열 (관심종목 영역 위까지 풀폭)
    → 카드 크기 ↑ (더 넓어짐)
```

---

## ⚠️ 주의 사항

1. **레이아웃 재구성** — overflow, flex, sticky 구조 신중히 확인
2. **WatchlistPanel 의 sticky top 제거** — 부모 items-stretch 로 자연 높이 따라감
3. **빌드 깨지면 즉시 보고**
4. **모바일 반응형은 후수정** — 일단 데스크탑 위주
5. **console.log 남기지 말 것**
