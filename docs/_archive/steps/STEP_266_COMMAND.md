<!-- 2026-06-15 -->
# STEP 266 — 헤더 홈/로고 클릭 → 홈 완전 리셋(주식·국내·전체·1일)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_266_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (네비 마무리)
STEP 265로 홈/로고 클릭 시 **탭**은 주식으로 리셋됨. 하지만 주식 탭(MarketClient) 내부의 **국내/전체/1일**(country·market·period)은 컴포넌트 내부 상태라 리셋 안 됨(이미 `/`에 있으면 클릭이 no-op 내비라 안 다시 그려짐).
- 해결: **홈/로고 클릭 시 리셋 신호(zustand 카운터)** → 홈 랭킹 영역을 **리마운트(key)** → 탭=주식 + MarketClient 기본값(국내/전체/1일)로 초기화.
- 새로고침 시 `?tab` 유지(STEP 265)는 그대로(카운터는 메모리라 새로고침 시 0).

## 전제 상태
- 현재 HEAD: STEP 265 적용 후(`837a9df`)
- 변경 **3파일**:
  - `stores/homeResetStore.ts` (**신규** — 리셋 카운터)
  - `components/layout/Header.tsx` (로고·홈 클릭 시 bump)
  - `components/home-v6/HomeClientV6.tsx` (랭킹 영역 key + hovered 초기화)

---

## 작업 1/3 — `stores/homeResetStore.ts` (신규)

```ts
import { create } from "zustand";

type HomeResetState = { n: number; reset: () => void };

// 헤더 홈/로고 클릭 시 n 증가 → 홈 랭킹 영역 key로 사용해 리마운트(전체 리셋)
export const useHomeReset = create<HomeResetState>((set) => ({
  n: 0,
  reset: () => set((s) => ({ n: s.n + 1 })),
}));
```

---

## 작업 2/3 — `components/layout/Header.tsx`

**① import 추가 — 찾기:**
```tsx
import { HeaderSearch } from '@/components/header/HeaderSearch';
```
**바꾸기:**
```tsx
import { HeaderSearch } from '@/components/header/HeaderSearch';
import { useHomeReset } from '@/stores/homeResetStore';
```

**② 리셋 핸들러 — 찾기:**
```tsx
  const currentCountry = COUNTRIES.find((c) => c.code === country)!;
```
**바꾸기:**
```tsx
  const currentCountry = COUNTRIES.find((c) => c.code === country)!;
  const resetHome = useHomeReset((s) => s.reset);
```

**③ 로고 클릭 시 리셋 — 찾기:**
```tsx
        <Link href="/" className="shrink-0 hover:opacity-80 flex items-center gap-1.5">
```
**바꾸기:**
```tsx
        <Link href="/" onClick={resetHome} className="shrink-0 hover:opacity-80 flex items-center gap-1.5">
```

**④ '홈' 메뉴 클릭 시 리셋 — 찾기:**
```tsx
              <Link
                key={m.label}
                href={m.href}
                aria-current={isActive ? 'page' : undefined}
```
**바꾸기:**
```tsx
              <Link
                key={m.label}
                href={m.href}
                onClick={() => { if (m.href === '/') resetHome(); }}
                aria-current={isActive ? 'page' : undefined}
```

---

## 작업 3/3 — `components/home-v6/HomeClientV6.tsx`

**① import — 찾기:**
```tsx
import { useState } from "react";
import HomeIndexStrip from "./HomeIndexStrip";
```
**바꾸기:**
```tsx
import { useState, useEffect } from "react";
import { useHomeReset } from "@/stores/homeResetStore";
import HomeIndexStrip from "./HomeIndexStrip";
```

**② 리셋 카운터 + hovered 초기화 — 찾기:**
```tsx
  const [hovered, setHovered] = useState<HoverStock | null>(null);

  return (
```
**바꾸기:**
```tsx
  const [hovered, setHovered] = useState<HoverStock | null>(null);
  const resetN = useHomeReset((s) => s.n);
  useEffect(() => { setHovered(null); }, [resetN]);

  return (
```

**③ 랭킹 영역 리마운트 key — 찾기:**
```tsx
          <HomeRankingTabs onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} wide />} />
```
**바꾸기:**
```tsx
          <HomeRankingTabs key={resetN} onHover={setHovered} detailSlot={<HomeStockDetail stock={hovered} wide />} />
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add stores/homeResetStore.ts components/layout/Header.tsx components/home-v6/HomeClientV6.tsx && git commit -m "fix(v7): 헤더 홈/로고 클릭 시 홈 완전 리셋(주식·국내·전체·1일) — 리셋 카운터+리마운트 (STEP 266)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] **dev 재시작** 후: 주식 탭에서 **미국/코스피/1년 등으로 바꾼 뒤** 헤더 **'홈' 또는 'UNJONG 운종' 클릭 → 정확히 주식·국내·전체·1일**로 초기화
- [ ] 다른 탭(ETN 등)에서 홈 클릭 → 주식 탭 + 기본값
- [ ] 새로고침 시 `?tab` 유지(STEP 265)는 그대로

## 주의·예상 이슈
- 홈/로고 클릭 시 랭킹 영역이 리마운트되며 잠깐 다시 로드(KRX 캐시라 빠름) — 의도된 '리셋'이라 정상.
- 카운터는 메모리(새로고침 시 0) → 새로고침은 STEP 265의 `?tab` 유지가 담당. 충돌 없음.
- **문서 TODO**(다음 갱신): STEP 265·266.

---
> STEP 266 = 홈/로고 완전 리셋. 전제 STEP 265(`837a9df`).
