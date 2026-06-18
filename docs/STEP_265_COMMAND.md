<!-- 2026-06-15 -->
# STEP 265 — QA 수정: 종목상세 아바타 크래시 + 헤더 홈/로고 → 주식 탭 리셋

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_265_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (버그 2개)
1. **크래시**: `/stock/126640`(종목 DB에 없는 코드) 진입 시 `avatarBg(name)`가 `name=undefined`에서 `name.length` 읽다 Runtime TypeError. → **avatarBg에 빈값 가드**.
2. **네비**: 헤더 **홈/로고(=`/`)** 클릭 시 홈 첫 화면(주식 탭)으로 안 돌아옴(다른 탭이 그대로 남음). 원인: 탭이 **마운트 때 한 번만** `?tab`을 읽음 → 같은 `/`에서 쿼리만 바뀔 땐 무반응. → **탭을 URL과 반응형 동기화**(useSearchParams). 헤더는 이미 `/`로 링크돼 있어 컴포넌트만 고치면 됨.

## 전제 상태
- 현재 HEAD: STEP 264 적용 후(`14c1493`)
- 변경 **3파일**:
  - `lib/avatar.ts` (avatarBg 가드 1줄)
  - `components/home-v6/HomeRankingTabs.tsx` (탭 URL 반응형)
  - `app/page.tsx` (force-dynamic — useSearchParams 빌드 요건)

---

## 작업 1/3 — `lib/avatar.ts` (avatarBg 빈값 가드)

**찾기:**
```ts
export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
```
**바꾸기:**
```ts
export function avatarBg(name: string): string {
  const s = name || "";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
```
> 이름이 비어도 안 터지고 PALETTE[0] 반환. (avatarChar는 이미 "?" 폴백.)

---

## 작업 2/3 — `components/home-v6/HomeRankingTabs.tsx` (탭 URL 반응형)

**① import — 찾기:**
```tsx
import { useState, useEffect, Fragment, type ReactNode } from "react";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
```
**바꾸기:**
```tsx
import { useState, useEffect, Fragment, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarketClient, { type HoverStock } from "@/components/market/MarketClient";
```

**② 상태·동기화·selectTab — 찾기:**
```tsx
type TabKey = (typeof TABS)[number]["key"];


export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const [tab, setTab] = useState<TabKey>("stock");

  // 새로고침해도 현재 탭 유지 (URL ?tab=)
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.key === t)) setTab(t as TabKey);
  }, []);

  function selectTab(k: TabKey) {
    setTab(k);
    const p = new URLSearchParams(window.location.search);
    p.set("tab", k);
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }
```
**바꾸기:**
```tsx
type TabKey = (typeof TABS)[number]["key"];
const isTab = (t: string | null): t is TabKey => !!t && TABS.some((x) => x.key === t);

export default function HomeRankingTabs({ onHover, detailSlot }: { onHover?: (s: HoverStock) => void; detailSlot?: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabKey>(isTab(urlTab) ? urlTab : "stock");

  // URL ?tab 동기화 — 새로고침 시 탭 유지 + 헤더 홈/로고(=/) 클릭 시 '주식'으로 리셋
  useEffect(() => {
    const t = searchParams.get("tab");
    setTab(isTab(t) ? t : "stock");
  }, [searchParams]);

  function selectTab(k: TabKey) {
    setTab(k);
    const p = new URLSearchParams(Array.from(searchParams.entries()));
    if (k === "stock") p.delete("tab");
    else p.set("tab", k);
    const qs = p.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }
```
> 탭을 URL과 반응형으로 묶음. 탭 클릭 = `router.replace`(Next 라우터로 URL 갱신 → 홈/로고 클릭이 제대로 감지됨). 주식 탭은 `?tab` 제거(깨끗한 `/`). 홈/로고(=`/`) 클릭 → `?tab` 사라짐 → `useEffect`가 '주식'으로 리셋.

---

## 작업 3/3 — `app/page.tsx` (force-dynamic)

**찾기:**
```tsx
export const metadata = { title: "운종 — 투자상품에 속지 않게 돕는 곳" };
```
**바꾸기:**
```tsx
export const metadata = { title: "운종 — 투자상품에 속지 않게 돕는 곳" };
export const dynamic = "force-dynamic";
```
> `useSearchParams`가 정적 프리렌더에서 Suspense 요건을 트리거 → 홈을 동적 렌더로(홈은 어차피 클라 데이터 페치 위주라 영향 미미). 빌드 에러 방지.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ (exit 0) 확인 후:
```bash
cd ~/stock-terminal && git add lib/avatar.ts components/home-v6/HomeRankingTabs.tsx app/page.tsx && git commit -m "fix(v7): avatarBg 빈값 가드(종목상세 크래시) + 헤더 홈/로고 클릭 시 주식 탭 리셋(탭 URL 반응형) (STEP 265)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 (특히 useSearchParams Suspense 에러 없는지) / 커밋·push
- [ ] **dev 재시작** 후:
  - `/stock/126640` 진입 → **크래시 없이** 페이지 뜸(이름 없으면 "?" 아바타)
  - 홈에서 ETN/리츠 등 탭 이동 후 **헤더 '홈' 또는 'UNJONG 운종' 클릭 → 주식 탭으로 리셋**
  - **새로고침 시 현재 탭 유지**(예: `?tab=etn`)도 그대로 동작

## 주의·예상 이슈
- 탭 클릭이 `router.replace`로 바뀜 → URL `?tab=` 갱신, 데이터 재페치 없음(소프트 내비). 정상.
- 종목 상세에서 이름이 비는 건(126640 등 DB 미등록) 별개 이슈 — 크래시만 우선 차단. (필요 시 후속으로 `?name` 폴백.)
- **문서 TODO**(다음 갱신): STEP 265.

---
> STEP 265 = 아바타 크래시 가드 + 홈/로고 탭 리셋. 전제 STEP 264(`14c1493`).
