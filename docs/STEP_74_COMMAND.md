# STEP 74 — Section 1 반응형 + 선택 종목 localStorage 지속

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 73 완료 — 4개 탭 상세 콘텐츠 UI 구현.

**목표:**
1. Section 1 레이아웃 **반응형 처리** — 좁은 모니터(1280px 미만)에서도 레이아웃이 깨지지 않게.
2. `selectedSymbolStore` 에 **localStorage 지속성** 추가 — 페이지 새로고침해도 선택 종목 유지.
3. 우측 종목상세 패널 **토글 버튼** 추가 (소형 화면에서 숨김/표시).

**범위 제한:**
- 모바일(< 768px) 최적화는 이번 STEP 제외. Section 1은 **데스크톱/랩톱 기준**만 다룸.
- 기존 레이아웃 색상/폰트/높이 변경 금지. 그리드 열 너비만 브레이크포인트에 맞춰 조정.

---

## 작업 1 — `selectedSymbolStore` persist 미들웨어 추가

Zustand persist 미들웨어 활용. `stores/selectedSymbolStore.ts` 교체:

```ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Market = 'KR' | 'US';

export interface SelectedSymbol {
  code: string;
  name: string;
  market: Market;
}

interface SelectedSymbolState {
  selected: SelectedSymbol | null;
  setSelected: (symbol: SelectedSymbol | null) => void;
}

export const useSelectedSymbolStore = create<SelectedSymbolState>()(
  persist(
    (set) => ({
      selected: null,
      setSelected: (symbol) => set({ selected: symbol }),
    }),
    {
      name: 'selected-symbol',   // localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
```

**SSR Hydration 주의:**
- `localStorage` 는 서버에서 없으므로 persist 미들웨어가 첫 렌더 시 `null` → 하이드레이션 후 값 반영.
- `SnapshotHeader` / `OverviewTab` 등에서 hydration mismatch 가능성 있으면 `useEffect` 기반 `mounted` 플래그 추가:

```tsx
import { useEffect, useState } from 'react';

export default function SnapshotHeader() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const selected = useSelectedSymbolStore((s) => s.selected);

  const effective = mounted ? selected : null;
  // ... effective 로 표시
}
```

위 패턴을 `SnapshotHeader`, `OverviewTab`, `NewsTab`, `DisclosuresTab`, `FinancialsTab` 5곳에 적용.

---

## 작업 2 — Section 1 반응형 브레이크포인트

`components/home/HomeClient.tsx` (또는 Section 1 래퍼가 있는 파일) 의 Section 1 grid 클래스 조정.

**현재 (STEP 70):**
```tsx
<section className="grid grid-cols-[280px_1fr_360px] gap-0 h-[680px] ...">
```

**목표:**
- `>= 1440px` (xl:): 280 / 1fr / 360 — 현재 그대로
- `1280px ~ 1440px` (lg:): 240 / 1fr / 320 — 좌·우 컬럼 약간 축소
- `< 1280px`: 좌 240 / 중 1fr, 우는 **오버레이 토글** 로 전환 (별도 컬럼 없음)

Tailwind 클래스:
```tsx
<section className="grid gap-0 h-[680px] border border-[#E5E7EB] bg-white
  grid-cols-[240px_1fr]
  lg:grid-cols-[240px_1fr_320px]
  xl:grid-cols-[280px_1fr_360px]">
  ...
</section>
```

**우측 컬럼 렌더링 조건:**
- `lg:` 이상에서는 grid cell로 렌더
- `< lg`: 우측 컬럼 div에 `hidden lg:block` 클래스 + 별도 토글 모달 레이어 제공

---

## 작업 3 — 우측 패널 토글 버튼 + 모바일 오버레이

### 3-1. `components/dashboard/StockDetailToggle.tsx` 신규

```tsx
'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import StockDetailPanel from './StockDetailPanel';

/**
 * < 1280px 화면에서만 표시되는 토글 버튼 + 오버레이.
 * 1280px 이상은 grid cell로 직접 렌더되므로 이 컴포넌트 불필요.
 */
export default function StockDetailToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 토글 버튼 — lg 미만에서만 노출 */}
      <button
        onClick={() => setOpen(true)}
        aria-label="종목 상세 열기"
        className="lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#0ABAB5] text-white shadow-lg flex items-center justify-center hover:bg-[#089693]"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* 오버레이 */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm h-full bg-white shadow-xl flex flex-col">
            <button
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="absolute top-3 right-3 z-10 text-[#666] hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <StockDetailPanel />
          </div>
        </div>
      )}
    </>
  );
}
```

### 3-2. `HomeClient.tsx` 에 토글 마운트

Section 1 하단(또는 HomeClient 최하단)에 한 번만 추가:

```tsx
import StockDetailToggle from '@/components/dashboard/StockDetailToggle';
// ...
<StockDetailToggle />
```

### 3-3. Section 1 grid 우측 컬럼 반응형

```tsx
<section className="grid gap-0 h-[680px] border border-[#E5E7EB] bg-white
  grid-cols-[240px_1fr]
  lg:grid-cols-[240px_1fr_320px]
  xl:grid-cols-[280px_1fr_360px]">

  <div className="border-r border-[#E5E7EB] min-w-0 overflow-hidden">
    <WatchlistWidget />
  </div>

  <div className="flex flex-col min-w-0 overflow-hidden">
    {/* 차트/호가/체결 그대로 */}
  </div>

  {/* 우측 컬럼 — lg 이상에서만 grid cell 로 표시 */}
  <div className="hidden lg:block min-w-0 overflow-hidden">
    <StockDetailPanel />
  </div>
</section>
```

**주의:** `StockDetailPanel` 이 grid cell과 오버레이 두 곳에서 **동시에 마운트되지 않도록** — Tailwind `hidden lg:block` / `lg:hidden` 으로 상호 배타 처리. React 트리 상 둘 다 마운트돼도 DOM은 한 쪽만 visible. 상태는 각자 독립이지만 store는 공유되므로 탭 위치 불일치 가능. 이번엔 허용.

---

## 작업 4 — 중앙 컬럼 높이 최소값 보장

`< lg` 브레이크포인트에서 좌·중 2컬럼 때, 중앙이 너무 좁아지지 않도록:

```tsx
<div className="flex flex-col min-w-0 min-w-[480px] overflow-hidden">
```

→ `min-w-[480px]` 로 최소 가로 480px 확보. 좌측 240 + 중앙 480 = 720px 이하 모니터에서는 가로 스크롤 발생 (수용 가능).

---

## 작업 5 — 빌드 검증

```bash
npm run build
```

---

## 작업 6 — 문서 4개 갱신

- `CLAUDE.md` 날짜
- `docs/CHANGELOG.md` 상단:
  ```
  - feat(dashboard): Section 1 반응형 + 선택 종목 persist + 모바일 토글 (STEP 74)
  ```
- `session-context.md`: STEP 74 완료 블록 + TODO 갱신
- `docs/NEXT_SESSION_START.md`: 다음 = STEP 75 (TBD — STEP 72 결과에 따라 API 보강 또는 Section 2+ 시작)

---

## 작업 7 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): Section 1 반응형 + 선택 종목 persist + 토글 (STEP 74)

- selectedSymbolStore: zustand persist 미들웨어, localStorage key=selected-symbol
- hydration mismatch 방지: mounted 플래그 5개 컴포넌트 적용
- Section 1 grid 반응형:
  · xl (≥1440): 280/1fr/360
  · lg (≥1280): 240/1fr/320
  · <lg: 240/1fr (2컬럼, 우측 오버레이로 전환)
- StockDetailToggle.tsx 신설: 우하단 FAB + 오른쪽 슬라이드 패널
- 중앙 컬럼 min-w-[480px] 보장

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 74 완료
- selectedSymbolStore persist 적용 (localStorage)
- 5개 컴포넌트에 mounted 플래그로 hydration 보호
- Section 1 grid 반응형 (xl/lg/default 3단계)
- StockDetailToggle FAB + 오버레이 패널 신설
- 중앙 컬럼 최소 가로 480px
- npm run build: 성공
- 4개 문서 갱신
- git commit: <hash>
- git push: success
```

---

## 주의사항

- **zustand 버전** — persist 미들웨어는 `zustand@4+` 필요. 프로젝트 버전 확인 후 필요 시 업데이트 (`npm install zustand@latest`). 업데이트하면 보고.
- **localStorage SSR** — Next.js App Router에서 persist 미들웨어는 클라이언트에서만 동작. 서버 렌더링 시 `selected=null`. 하이드레이션 후 복원.
- **오버레이 z-index** — 토글 버튼 `z-40`, 오버레이 `z-50`. 기존 Header/TopNav 드롭다운 `z-50`과 충돌 시 토글 버튼만 `z-30`으로 낮춤.
- **Tailwind 클래스 중복** — `min-w-0 min-w-[480px]` 같은 중복 작성 주의, `min-w-[480px]` 단독으로 충분.
- **테스트** — 브라우저 폭을 1279px ↔ 1280px 경계로 리사이즈하며 레이아웃 변화 확인 (수동).
