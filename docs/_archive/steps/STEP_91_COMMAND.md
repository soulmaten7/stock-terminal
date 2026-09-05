<!-- 2026-05-27 -->
# STEP 91 — 좌측 사이드 (채팅 위 + 입력창 + 관심종목 아래)

> **목표**: 운종 좌측 사이드 (폭 300px) — 채팅창 + 입력창 + 관심종목 시각적 완성
> **세션**: #25
> **전제**: STEP 90 완료 (`052c439`), 운종 헤더 작동 중
> **참조 스펙**: `docs/PRODUCT_SPEC_V4.md` 섹션 5-2 (좌측 사이드)

---

## 실행 명령어 (Sonnet)

```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```

그 다음 Claude Code 에 다음 한 줄 입력:

```
@docs/STEP_91_COMMAND.md 파일 내용대로 실행해줘
```

---

## 핵심 원칙

1. **UI 완성, 데이터는 더미** — Supabase Realtime 채팅·실시간 시세는 Layer 1
2. **채팅창 크기 고정** — 입력창 클릭해도 확장 X (트레이딩 도구 톤)
3. **창별 채팅 자동 전환** — `usePathname()` 으로 단타창/장타창/미국주식창 메시지 다르게
4. **관심종목 = 기존 V3 Watchlist 컴포넌트 재활용** 가능하면 활용, 어려우면 더미 폴백
5. **비율 권장** — 채팅 영역 `flex-1` + 관심종목 `max-h-[35%]`

---

## 작업 1 — 컴포넌트 폴더 생성

```bash
mkdir -p components/sidebar
```

생성할 파일:
- `components/sidebar/ChatPanel.tsx` — 채팅 (헤더 + 메시지 + 입력)
- `components/sidebar/WatchlistPanel.tsx` — 관심종목 (헤더 + 리스트)
- `components/sidebar/UnjongSidebar.tsx` — 통합 사이드

---

## 작업 2 — `components/sidebar/ChatPanel.tsx`

```tsx
"use client";

import { usePathname } from "next/navigation";
import { Send } from "lucide-react";

/**
 * 채팅창 더미 메시지 — 창별 톤 다름
 * Layer 1 에서 Supabase Realtime 으로 교체
 */
type ChatMessage = {
  id: string;
  user: string;
  message: string;
  time: string;
};

const DUMMY_MESSAGES: Record<string, { window: string; emoji: string; messages: ChatMessage[] }> = {
  "/scalper": {
    window: "단타창",
    emoji: "⚡",
    messages: [
      { id: "s1", user: "트레이더A", message: "005930 분봉 깨졌어", time: "10:32" },
      { id: "s2", user: "트레이더B", message: "손절 칠게", time: "10:32" },
      { id: "s3", user: "트레이더C", message: "외인 들어옴 지금 잡으면 좋을듯", time: "10:33" },
      { id: "s4", user: "트레이더D", message: "ㅋㅋ 늦었어 이미 5% 떴음", time: "10:34" },
      { id: "s5", user: "트레이더E", message: "VI 걸렸다 카오스", time: "10:35" },
      { id: "s6", user: "트레이더F", message: "거래원 보니까 키움 매집 중", time: "10:36" },
      { id: "s7", user: "트레이더G", message: "공매도 잔고 줄어드는데 숏커버?", time: "10:37" },
      { id: "s8", user: "트레이더A", message: "오늘 거래량 미쳤네", time: "10:38" },
    ],
  },
  "/longterm": {
    window: "장타창",
    emoji: "🌳",
    messages: [
      { id: "l1", user: "장투러A", message: "이번 분기 영업이익 컨센 상회", time: "20:11" },
      { id: "l2", user: "장투러B", message: "PER 8 이면 진짜 싸지 않나", time: "20:13" },
      { id: "l3", user: "장투러C", message: "배당 컷 없으면 더 살게", time: "20:15" },
      { id: "l4", user: "장투러D", message: "기관이 분기 보유 늘렸어", time: "20:18" },
      { id: "l5", user: "장투러A", message: "52주 신저가 우량주 줍줍 타이밍", time: "20:20" },
      { id: "l6", user: "장투러E", message: "ROE 15 넘는 종목 추천 좀", time: "20:22" },
    ],
  },
  "/us": {
    window: "미국주식창",
    emoji: "🌙",
    messages: [
      { id: "u1", user: "미장러A", message: "TSLA 갭상승 3%", time: "22:45" },
      { id: "u2", user: "미장러B", message: "NVDA 실적 발표 후 AH 변동성", time: "22:48" },
      { id: "u3", user: "미장러C", message: "환율 1387 위로 빠질듯", time: "22:50" },
      { id: "u4", user: "미장러D", message: "VIX 22 넘으면 분위기 흔들림", time: "22:52" },
      { id: "u5", user: "미장러A", message: "FOMC 매파적이었네", time: "22:55" },
      { id: "u6", user: "미장러E", message: "M7 다 빨강", time: "22:58" },
    ],
  },
};

export function ChatPanel() {
  const pathname = usePathname();
  const ctx =
    (pathname && DUMMY_MESSAGES[pathname]) || DUMMY_MESSAGES["/scalper"];

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-unjong-surface">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>{ctx.emoji}</span>
          <span className="text-sm font-semibold text-unjong-primary">
            {ctx.window} 채팅
          </span>
        </div>
        <span className="text-[10px] text-unjong-muted">
          (Layer 1 실시간 연결)
        </span>
      </div>

      {/* 메시지 영역 (스크롤) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {ctx.messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-unjong-primary">
                {msg.user}
              </span>
              <span className="text-[10px] text-unjong-muted">{msg.time}</span>
            </div>
            <p className="text-xs text-unjong-primary leading-snug pl-1">
              {msg.message}
            </p>
          </div>
        ))}
        <div className="pt-2 text-[10px] text-center text-unjong-muted italic">
          — 더미 데이터 · Layer 1 에서 실시간 채팅 활성 —
        </div>
      </div>

      {/* 입력창 (고정 크기) */}
      <div className="border-t border-unjong-border bg-unjong-background p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 rounded-md border border-unjong-border bg-unjong-surface px-2 py-1.5">
          <input
            type="text"
            placeholder={`${ctx.window}에 메시지...`}
            className="flex-1 bg-transparent text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled
            aria-label="채팅 입력 (Layer 1 에서 활성)"
          />
          <button
            type="button"
            disabled
            className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

⚠️ 색상 클래스가 작동 안 하면 STEP 90 에서 폴백한 패턴 그대로 적용.
⚠️ 입력창 `disabled` 처리 — Layer 1 에서 Supabase Realtime 연결 시 활성화.

---

## 작업 3 — `components/sidebar/WatchlistPanel.tsx`

기존 V3 의 Watchlist 컴포넌트 위치 확인 후 두 가지 시나리오:

### 시나리오 A: 기존 Watchlist 재활용 가능
`components/` 안에 `Watchlist.tsx`, `WatchlistWidget.tsx` 같은 파일이 있고 props 가 단순하면 그대로 wrap:

```tsx
"use client";

import { Watchlist } from "@/components/Watchlist"; // 경로는 실제 위치로

export function WatchlistPanel() {
  return (
    <div className="flex flex-col max-h-[35%] border-t border-unjong-border bg-unjong-surface flex-shrink-0">
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2 flex-shrink-0">
        <span className="text-xs font-semibold text-unjong-primary">
          👀 관심종목
        </span>
        <span className="text-[10px] text-unjong-muted">
          (기존 Watchlist 재활용)
        </span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <Watchlist />
      </div>
    </div>
  );
}
```

### 시나리오 B: 재활용 어려움 → 더미 폴백 (안전한 기본 선택)

```tsx
"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

type WatchItem = {
  code: string;
  name: string;
  price: string;
  changePct: number;
};

const DUMMY_WATCHLIST: WatchItem[] = [
  { code: "005930", name: "삼성전자", price: "78,400", changePct: 1.42 },
  { code: "000660", name: "SK하이닉스", price: "234,500", changePct: -0.51 },
  { code: "035720", name: "카카오", price: "47,850", changePct: 3.42 },
  { code: "035420", name: "NAVER", price: "208,000", changePct: 0.97 },
  { code: "207940", name: "삼성바이오로직스", price: "942,000", changePct: -1.20 },
  { code: "AAPL", name: "Apple", price: "$195.34", changePct: 0.82 },
  { code: "TSLA", name: "Tesla", price: "$247.18", changePct: -2.11 },
  { code: "NVDA", name: "NVIDIA", price: "$880.50", changePct: 1.54 },
];

export function WatchlistPanel() {
  return (
    <div className="flex flex-col max-h-[35%] border-t border-unjong-border bg-unjong-surface flex-shrink-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2 flex-shrink-0">
        <span className="text-xs font-semibold text-unjong-primary">
          👀 관심종목 {DUMMY_WATCHLIST.length}개
        </span>
        <span className="text-[10px] text-unjong-muted">(더미)</span>
      </div>

      {/* 리스트 (스크롤) */}
      <ul className="flex-1 overflow-y-auto min-h-0 divide-y divide-unjong-border">
        {DUMMY_WATCHLIST.map((item) => {
          const isUp = item.changePct >= 0;
          return (
            <li
              key={item.code}
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

### 판단 기준

- `components/` 폴더에서 `grep -ri "watchlist" --include="*.tsx" .` 실행
- 기존 컴포넌트가 5분 안에 wrap 가능하면 시나리오 A
- props 가 복잡하거나 의존성 많으면 시나리오 B (안전)
- **확실하지 않으면 시나리오 B 폴백** + 보고

---

## 작업 4 — `components/sidebar/UnjongSidebar.tsx` (통합)

```tsx
import { ChatPanel } from "./ChatPanel";
import { WatchlistPanel } from "./WatchlistPanel";

/**
 * 운종 좌측 사이드 (폭 300px)
 *
 * 구조:
 * - 위: 채팅창 (헤더 + 메시지 스크롤 + 입력창 고정)
 * - 아래: 관심종목 (헤더 + 리스트 스크롤)
 *
 * 비율: 채팅 ≈70% / 관심종목 ≈30% (관심종목 max-h-[35%])
 */
export function UnjongSidebar() {
  return (
    <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
      <div className="flex h-full flex-col">
        <ChatPanel />
        <WatchlistPanel />
      </div>
    </aside>
  );
}
```

---

## 작업 5 — `app/(windows)/layout.tsx` 좌측 사이드 교체

기존 STEP 89 의 placeholder aside (좌측) 를 `UnjongSidebar` 로 교체.

**기존 (STEP 89 placeholder)**:
```tsx
<aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
  <div className="flex h-full flex-col">
    <div className="border-b border-unjong-border p-3 text-sm font-medium">
      💬 채팅 (STEP 91)
    </div>
    {/* ... placeholder 텍스트들 ... */}
  </div>
</aside>
```

**변경 후**:
```tsx
import { UnjongSidebar } from "@/components/sidebar/UnjongSidebar";

// ...
return (
  <div className="flex h-screen flex-col bg-unjong-background">
    <UnjongHeader />
    <div className="flex flex-1 overflow-hidden">
      <UnjongSidebar />
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
      {/* 우측 사이드패널 placeholder (STEP 93 에서 채움) */}
      <aside className="hidden xl:flex w-[360px] flex-shrink-0 border-l border-unjong-border bg-unjong-surface p-3 text-xs text-unjong-muted">
        종목 미선택 상태 · STEP 93 에서 차트·호가·체결 패널 연결
      </aside>
    </div>
  </div>
);
```

기존 placeholder aside 마크업 완전 제거. `UnjongSidebar` import 추가.

---

## 작업 6 — 빌드 검증

```bash
cd ~/stock-terminal
npm run build
```

**확인 사항**:
- 빌드 성공
- TypeScript 오류 0
- 새 컴포넌트 3개 (`components/sidebar/*.tsx`) 컴파일 OK
- 기존 V3 Watchlist 컴포넌트 재활용 시 import 경로 정확

색상 클래스 폴백은 STEP 90 패턴 동일.

---

## 작업 7 — git commit + push

빌드 성공 확인 후:

```bash
cd ~/stock-terminal
rm -f .git/index.lock
git add components/sidebar
git add "app/(windows)/layout.tsx"
git add docs/STEP_91_COMMAND.md
git status
git commit -m "feat: STEP 91 - 좌측 사이드 (채팅+관심종목) 완성

- components/sidebar/ChatPanel.tsx — 창별 더미 메시지 (단타·장타·미장 톤 다름)
  · usePathname() 으로 자동 전환
  · 입력창 고정 크기 (Layer 1 활성)
- components/sidebar/WatchlistPanel.tsx — 관심종목 (기존 재활용 or 더미 폴백)
- components/sidebar/UnjongSidebar.tsx — 통합 (채팅 ≈70% / 관심종목 ≈30%)
- app/(windows)/layout.tsx — 좌측 placeholder → UnjongSidebar 교체
- 다음 STEP 92: 메인 카드 그리드 (창별 3개씩)"
git push
```

---

## 검증 체크리스트

작업 끝나면 다음 항목 확인:

- [ ] `components/sidebar/` 폴더 + 3개 컴포넌트 파일 존재
- [ ] `app/(windows)/layout.tsx` 에 `UnjongSidebar` import + 사용
- [ ] 기존 placeholder aside (좌측) 마크업 제거됨
- [ ] WatchlistPanel 시나리오 A 또는 B 적용 여부 명시
- [ ] `npm run build` 성공
- [ ] git commit + push 완료
- [ ] 색상 클래스 폴백 여부 보고

---

## 완료 보고 (Claude Code → 사용자)

작업 끝나면 사용자에게:
```
STEP 91 완료. 좌측 사이드 (채팅+관심종목) 끝.
- ChatPanel — 단타창/장타창/미국주식창 더미 메시지 톤 다름 (usePathname 자동 전환)
- WatchlistPanel — [시나리오 A 재활용 / 시나리오 B 더미 폴백] 적용
- UnjongSidebar 통합 (채팅 ≈70% / 관심종목 ≈30%, 채팅 크기 고정, 스크롤)
- (windows)/layout.tsx 좌측 placeholder → UnjongSidebar 로 교체
- 빌드 클린, git push 완료 (커밋 [해시])
- 색상 클래스 폴백 여부: [yes/no]

다음 STEP 92 (메인 카드 그리드 — 창별 3개씩) 명령서 받을 준비 됨.

브라우저에서 확인:
  http://localhost:3333/scalper → 단타꾼 톤 채팅 (분봉 깨졌어, VI 등)
  http://localhost:3333/longterm → 가치투자자 톤 (PER, ROE, 배당)
  http://localhost:3333/us → 미장러 톤 (TSLA, NVDA, VIX)
```

---

## ⚠️ 주의 사항

1. **채팅 입력 disabled** — Layer 1 에서 활성화. 지금 활성화 시도 X
2. **채팅창 크기 고정** — `flex-1 min-h-0` 으로 가용 공간 채우되 입력창은 별도 영역. 확장 X
3. **관심종목 시나리오 A vs B** — 확실하지 않으면 무조건 B (더미 폴백). 사후 변경 쉬움
4. **창별 자동 전환** — usePathname() 정확히 사용 (`/scalper`, `/longterm`, `/us` 매칭)
5. **flex 안에서 overflow 스크롤** — `min-h-0` 필수 (없으면 스크롤 안 됨, flex 알려진 함정)
6. **console.log 남기지 말 것** — CLAUDE.md 규칙
7. **빌드 깨지면 즉시 멈추고 보고** — 강제 진행 금지
