<!-- 2026-05-27 -->
# STEP 95-E — 3컬럼 구조 재설계 (채팅 좌 + 메인 가운데 + 관심종목 우)

> **목표**: 큰 구조 변경. 우측 사이드패널 → 메인 영역 1행으로 이동. 관심종목 → 우측 컬럼. 채팅 sticky top + 고정 500px.
> **세션**: #25
> **전제**: STEP 98 진행 후 (또는 그 직후) — 21개 카드 시각화 완성 후
> **유형**: 구조 재설계 (작업 시간 1~2시간)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에:

```
@docs/STEP_95E_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **3컬럼 구조** — 좌 (채팅) + 가운데 (종목상세 + 카드) + 우 (관심종목)
2. **우측 사이드패널 폐기** — StockDetailPanel 을 메인 영역 1행으로 이동
3. **관심종목 우측으로 이동** — 폭 300px, 가변 길이
4. **채팅 sticky top** — 스크롤해도 좌측 위에 항상 보임 (높이 500px 고정)
5. **빈 공간 보존** — Layer 2 에서 광고·텔레그램 링크로 채울 예정
6. **빌드 깨지면 즉시 보고**

---

## 작업 1 — 진단

```bash
cd ~/stock-terminal
cat "app/(windows)/layout.tsx"
cat components/sidebar/UnjongSidebar.tsx
cat components/sidepanel/StockDetailPanel.tsx | head -60
```

확인:
- 현재 (windows)/layout.tsx 의 구조
- UnjongSidebar 안 ChatPanel + WatchlistPanel 배치
- StockDetailPanel 의 외부 wrapper (aside, w-[360px] 등)

---

## 작업 2 — `app/(windows)/layout.tsx` 재설계

기존 코드를 다음으로 교체:

```tsx
import type { ReactNode } from "react";
import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import { StockDetailPanel } from "@/components/sidepanel/StockDetailPanel";
import { ContextNav } from "@/components/header/ContextNav";

/**
 * 운종 3창 공통 레이아웃 — 3컬럼 구조 (STEP 95-E 재설계)
 *
 * 구조:
 * - 좌측 (300px, sticky top): 채팅 (고정 높이 500px)
 *   - 빈 공간 (Layer 2 에서 광고·텔레그램 링크)
 * - 가운데 (flex-1):
 *   - ContextNav (창별 컨텍스트 메뉴)
 *   - 종목 상세 (1행, 풀폭)
 *   - 카드 7개 (2열 그리드)
 * - 우측 (300px): 관심종목 (가변 길이)
 *
 * 헤더 1~3단은 root layout 의 V3 헤더 (Header + TickerBar + MainNav).
 */
export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-unjong-background min-h-screen">
      {/* ─── 좌측 컬럼: 채팅 (sticky top + 고정 500px) ─── */}
      <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
        <div className="sticky top-0 h-[500px] flex flex-col">
          <ChatPanel />
        </div>
        {/* 채팅 아래 빈 공간 — Layer 2 에서 광고·텔레그램 링크로 채움 */}
        <div className="border-t border-unjong-border bg-unjong-background p-3 text-[10px] text-unjong-muted text-center italic">
          Layer 2 — 광고·텔레그램 링크 영역
        </div>
      </aside>

      {/* ─── 가운데 컬럼: ContextNav + 종목상세 + 카드 ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <ContextNav />
        <main className="flex-1 p-4 space-y-4">
          {/* 종목 상세 (메인 1행, 풀폭) */}
          <StockDetailPanel inline />

          {/* 카드 그리드 (page.tsx 의 children) */}
          {children}
        </main>
      </div>

      {/* ─── 우측 컬럼: 관심종목 (가변 길이) ─── */}
      <aside className="w-[300px] flex-shrink-0 border-l border-unjong-border bg-unjong-surface">
        <WatchlistPanel />
      </aside>
    </div>
  );
}
```

⚠️ 핵심 변경:
- `overflow-hidden` 모두 제거 (페이지 자연 스크롤)
- `min-h-screen` 으로 화면 최소 높이 보장
- 좌측 채팅 = `sticky top-0 h-[500px]` (스크롤해도 위에 고정)
- 좌측 아래 빈 공간 = Layer 2 안내 placeholder
- 가운데 = ContextNav + StockDetailPanel + children
- 우측 = WatchlistPanel (분리)

---

## 작업 3 — `components/sidebar/WatchlistPanel.tsx` 수정 (max-h 제거)

기존 `max-h-[35%]` 제거 → 자연 길이.

```diff
- <div className="flex flex-col max-h-[35%] border-t border-unjong-border bg-unjong-surface flex-shrink-0">
+ <div className="flex flex-col bg-unjong-surface">
+   {/* 헤더 + 리스트 자연 길이 */}
```

리스트도 overflow-y-auto 유지 가능 (관심종목 50개 이상이면 자체 스크롤). 또는 자연 길이로 모두 표시.

```tsx
"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

// DUMMY_WATCHLIST 그대로

export function WatchlistPanel() {
  const setSelectedSymbol = useSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <div className="flex flex-col bg-unjong-surface">
      {/* 헤더 (sticky 처리로 스크롤 시 위에 보임) */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-unjong-border px-3 py-2 bg-unjong-surface">
        <span className="text-xs font-semibold text-unjong-primary">
          👀 관심종목 {DUMMY_WATCHLIST.length}개
        </span>
        <span className="text-[10px] text-unjong-muted">(더미)</span>
      </div>

      {/* 리스트 — 자연 길이 (스크롤 X) */}
      <ul className="divide-y divide-unjong-border">
        {DUMMY_WATCHLIST.map((item) => {
          const isUp = item.changePct >= 0;
          return (
            <li
              key={item.code}
              onClick={() => setSelectedSymbol({ ... })}
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-unjong-background cursor-pointer transition-colors"
            >
              {/* 기존 내용 그대로 */}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

⚠️ `max-h-[35%]`, `overflow-y-auto`, `flex-shrink-0`, `border-t` 제거. 자연 길이 + sticky 헤더만.

---

## 작업 4 — `components/sidepanel/StockDetailPanel.tsx` 수정 (inline prop)

기존 우측 사이드패널 wrapper (aside, w-[360px], hidden xl:flex) 제거 + inline 디자인 추가.

```tsx
"use client";

// ... 기존 imports + DUMMY 데이터 그대로

type StockDetailPanelProps = {
  inline?: boolean;  // ← 신규: true 면 메인 영역 1행 풀폭 디자인
};

export function StockDetailPanel({ inline = false }: StockDetailPanelProps) {
  const { selectedSymbol, setSelectedSymbol } = useSelectedSymbol();
  const [activeTab, setActiveTab] = useState<Tab>("chart");

  if (!selectedSymbol) {
    return (
      <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-6 text-center text-xs text-unjong-muted">
        관심종목 또는 카드에서 종목을 클릭하면 차트·호가·체결·종합이 표시됩니다.
      </div>
    );
  }

  const isUp = (selectedSymbol.changePct ?? 0) >= 0;

  // inline 모드 = 메인 영역 1행 풀폭
  if (inline) {
    return (
      <section className="rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden">
        {/* 헤더 — 종목 정보 (가로 배치) */}
        <header className="flex items-center justify-between gap-4 border-b border-unjong-border px-4 py-3 bg-unjong-background">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-unjong-primary">
                {selectedSymbol.name}
              </h3>
              {selectedSymbol.market && (
                <span className="text-[10px] font-semibold text-unjong-muted bg-unjong-surface px-1.5 py-0.5 rounded">
                  {selectedSymbol.market}
                </span>
              )}
              <span className="text-[11px] text-unjong-muted font-mono">
                {selectedSymbol.code}
              </span>
            </div>
            <div className="flex items-baseline gap-2 border-l border-unjong-border pl-4">
              <span className="text-xl font-bold text-unjong-primary tabular-nums">
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
          </div>
          <button
            type="button"
            onClick={() => setSelectedSymbol(null)}
            className="text-unjong-muted hover:text-unjong-primary p-1"
            aria-label="종목 선택 해제"
          >
            <X size={16} />
          </button>
        </header>

        {/* 탭 네비게이션 */}
        <nav className="flex border-b border-unjong-border" aria-label="종목 상세 탭">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeTab === t.id
                  ? "border-unjong-accent text-unjong-primary"
                  : "border-transparent text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
              }`}
            >
              <span className="mr-1" aria-hidden>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* 탭 컨텐츠 */}
        <div className="p-4 min-h-[300px]">
          {activeTab === "chart" && <ChartTab />}
          {activeTab === "orderbook" && <OrderBookTab />}
          {activeTab === "tick" && <TickTab />}
          {activeTab === "overview" && <OverviewTab />}
        </div>
      </section>
    );
  }

  // 기존 세로 사이드패널 모드 (재활용 가능, 사용 안 함 권장)
  return (
    <aside className="hidden xl:flex w-[360px] flex-shrink-0 flex-col border-l border-unjong-border bg-unjong-surface">
      {/* 기존 사이드패널 마크업 */}
    </aside>
  );
}
```

⚠️ 기존 사이드패널 모드는 코드 보존 (재활용 가능). `inline` prop 으로 풀폭 모드만 활성.

각 탭 컴포넌트 (`ChartTab`, `OrderBookTab`, `TickTab`, `OverviewTab`) 는 그대로. 단, 풀폭에 맞게 컨텐츠가 가로로 잘 펼쳐지도록 CSS 미세 조정 (옵션).

---

## 작업 5 — UnjongSidebar 정리 (선택)

`components/sidebar/UnjongSidebar.tsx` 는 더 이상 사용 안 됨 (ChatPanel + WatchlistPanel 이 layout.tsx 에서 직접 import).

처리:
- **A. 파일 보존** (재활용 가능, import 만 안 됨) — 안전
- **B. 파일 삭제** — 깔끔하지만 위험

**A 권장**. 만약 layout.tsx 에서 import 잔존하면 빌드 깨짐.

---

## 작업 6 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

확인:
- 빌드 성공, TypeScript 오류 0
- 3컬럼 구조 정상
- StockDetailPanel inline 모드 정상 컴파일
- WatchlistPanel 자연 길이 정상

빌드 실패 시:
- import 경로 점검 (UnjongSidebar 가 어디서 import 되는지)
- sticky top 의 z-index 충돌 점검
- 색상 클래스 폴백 확인

---

## 작업 7 — git commit + push

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add -A
git status
git commit -m "feat: STEP 95-E - 3컬럼 구조 재설계 (채팅 좌 + 메인 + 관심종목 우)

큰 구조 변경:
- 우측 사이드패널(StockDetailPanel) 폐기 → 메인 영역 1행으로 이동
- 관심종목(WatchlistPanel) 좌측 → 우측 컬럼으로 이동 (폭 300px)
- 채팅(ChatPanel) 좌측 sticky top + 고정 500px (스크롤해도 항상 보임)
- 좌측 아래 빈 공간 = Layer 2 광고·텔레그램 링크 placeholder

(windows)/layout.tsx 재설계:
- 3컬럼: 채팅(300) + 가운데(flex-1) + 관심종목(300)
- overflow-hidden 모두 제거 → 페이지 자연 스크롤
- min-h-screen 으로 화면 최소 높이

StockDetailPanel:
- inline prop 추가 — true 시 메인 영역 풀폭 디자인 (가로 헤더)
- 기존 세로 사이드패널 모드 코드 보존 (재활용 가능)

WatchlistPanel:
- max-h-[35%] 제거 → 자연 길이
- 헤더 sticky top 처리

UnjongSidebar:
- 파일 보존 (재활용 가능), import 만 제거

다음 STEP: 화면 확인 후 후수정 (디자인·빈공간·광고 위치 정리)"
git push
```

---

## 검증 체크리스트

- [ ] (windows)/layout.tsx 가 3컬럼 구조 (300 + flex-1 + 300)
- [ ] 좌측 채팅 = sticky top + 500px 고정 + 아래 빈 공간 placeholder
- [ ] 가운데 = ContextNav + StockDetailPanel inline + children (카드 그리드)
- [ ] 우측 = WatchlistPanel (자연 길이, 헤더 sticky)
- [ ] StockDetailPanel 에 `inline` prop 추가, 풀폭 디자인
- [ ] WatchlistPanel 의 max-h-[35%] 제거
- [ ] UnjongSidebar import 제거 (파일 보존)
- [ ] 빌드 클린
- [ ] git push 완료

---

## 완료 보고 (Claude Code → 사용자)

```
STEP 95-E 완료. 3컬럼 구조 재설계 끝.

변경 사항:
- (windows)/layout.tsx 재설계 — 3컬럼 (300 + flex-1 + 300)
- 채팅 좌측 sticky top + 500px 고정
- 종목 상세 → 메인 영역 1행 풀폭 (StockDetailPanel inline)
- 관심종목 → 우측 컬럼 (자연 길이, 가변)
- 좌측 채팅 아래 빈 공간 → Layer 2 광고 placeholder
- overflow-hidden 제거 → 페이지 자연 스크롤

빌드 클린, git push 완료 (커밋 [해시])

브라우저에서 확인:
  http://localhost:3333/scalper
    → 좌: 채팅 (sticky top 500px)
    → 가운데: 종목 상세 + 카드 7개 2열
    → 우: 관심종목 (가변)
    → 페이지 스크롤 시 채팅 좌측 위에 고정, 가운데와 우측은 함께 스크롤
  단타창 ↔ 장타창 ↔ 미국주식창 → 채팅 크기 동일

다음 작업 후보:
1. 빈 공간 디자인 채우기 (광고·텔레그램 링크 — Layer 2)
2. StockDetailPanel 풀폭 디자인 미세 조정
3. 모바일 반응형 (3컬럼 → 1컬럼)
```

---

## ⚠️ 주의 사항

1. **큰 구조 변경** — 빌드 깨지면 즉시 보고
2. **UnjongSidebar 파일 보존** — import 만 제거, 삭제 X
3. **sticky top 의 부모 overflow 점검** — overflow-hidden 이면 sticky 작동 안 함
4. **StockDetailPanel inline 모드 추가** — 기존 세로 모드 코드는 보존
5. **WatchlistPanel 자연 길이** — max-h 제거 + 헤더 sticky
6. **색상 클래스는 STEP 95-D 폴백 패턴 동일**
7. **console.log 남기지 말 것**
8. **모바일 반응형은 후수정** — 일단 데스크탑 위주
