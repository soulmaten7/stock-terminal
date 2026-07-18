# STEP 748 — 헤더 로고 클릭: 국가 선택 유지 (로케일 홈 시장 강제 제거)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 3파일 소규모)

**전제 상태**: HEAD `4f364a2`(docs) · 코드 `e254c53` · 트리 클린

**버그(사용자 리포트·07-18)**: 헤더 로고(및 '주식' 메뉴) 클릭 시 **보던 국가가 로케일 홈 시장으로 강제 리셋**됨 — en에서 KR/JP 보드를 보다 로고를 누르면 무조건 US로, ko에서는 무조건 KR로 바뀜. 원인 = `homeResetStore.reset(home)`이 `setCountry(home)`으로 persist를 덮어쓰는 의도적 "완전 리셋" 설계(구 STEP의 결정) — 기대 동작과 어긋남.

**목표 동작**: 로고 클릭 = 그 언어권 홈 URL로 복귀(이건 i18n `Link href="/"`가 이미 처리) + 탭/서브필터만 홈 상태(종목·상품)로 리셋. **국가 선택은 유지**(첫 방문 로케일 디폴트 로직 `localeDefaultDone`은 별개·불변).

---

## 수정 1 — `stores/homeResetStore.ts` (국가 강제 제거)

파일 전체를 다음으로 교체:
```ts
import { create } from "zustand";

type HomeResetState = { n: number; reset: () => void };

// 헤더 로고/'주식' 클릭 = 홈 뷰 리셋 — 탭 → 종목·상품(market) · 서브필터 → 주식(보드 리마운트).
// ⚠️ 국가는 건드리지 않는다(STEP 748) — 사용자가 보던 국가 선택(persist)이 항상 이긴다.
//    (구 동작 = setCountry(로케일 홈)로 강제 리셋 → en에서 로고 클릭 시 무조건 US로 튀던 버그.)
// n 증가를 ToolboxClient가 구독해 탭·서브·보드를 리셋한다.
export const useHomeReset = create<HomeResetState>((set) => ({
  n: 0,
  reset: () => {
    // localStorage 탭도 초기화 — 다른 페이지에서 로고로 홈 이동 시 새 마운트가 이 값을 읽음.
    try { localStorage.setItem("unjong_tab", "market"); } catch { /* SSR/비가용 무시 */ }
    set((s) => ({ n: s.n + 1 }));
  },
}));
```
(`useCountryStore` import·`Country` 타입·`home` 인자 제거.)

## 수정 2 — `components/layout/Header.tsx`

```tsx
  const reset = useHomeReset((s) => s.reset);
  // 홈 리셋 = 그 언어권의 홈 시장으로(ko→KR · en→US). 스토어는 로케일을 모르니 여기서 넘긴다.
  // onClick에 reset을 그대로 넘기면 MouseEvent가 인자로 들어가므로 반드시 감싼다.
  const resetHome = () => reset(homeMarketFor(locale));
```
을 다음으로 교체:
```tsx
  const reset = useHomeReset((s) => s.reset);
  // 홈 리셋 = 뷰(탭·서브)만 홈으로. 국가 선택은 유지(STEP 748). 로케일 홈 URL 복귀는 Link href="/"가 담당.
  // onClick에 reset을 그대로 넘기면 MouseEvent가 인자로 들어가므로 반드시 감싼다.
  const resetHome = () => reset();
```
그리고 11행 import에서 `homeMarketFor` 제거(이 파일 내 다른 사용처 없음 — grep로 확인 후):
```tsx
import { homeMarketFor } from '@/stores/countryStore';
```
→ 이 import 라인 삭제(다른 심볼을 같은 라인에서 안 가져오면 라인 전체 삭제).

## 수정 3 — `components/toolbox/ToolboxClient.tsx` (낡은 주석만 현행화)

```tsx
  // 헤더 로고/'주식' 클릭 → 홈 리셋. 국가는 store가 KR로, 여기선 탭=종목·서브=모아보기로.
```
을 다음으로 교체 (코드 무변·주석만):
```tsx
  // 헤더 로고/'주식' 클릭 → 홈 뷰 리셋(탭=종목·서브=모아보기). 국가는 유지(STEP 748) — persist 선택이 이긴다.
```

---

## 검증

1. `npx tsc --noEmit` → 0 (인자 제거로 다른 호출부가 없는지 tsc가 보증 — `reset(` 호출부 grep도 1회: Header 외 없어야 함)
2. `npm run test` → 통과
3. `npm run build` → 성공
4. 로컬 육안(가능하면): `/en`에서 국가 Korea 선택 → 로고 클릭 → **Korea 유지**·탭은 종목으로 / ko에서 일본 선택 → 로고 클릭 → **일본 유지**. 첫 방문(localStorage 비움) en 디폴트 US는 그대로.

## 커밋

```bash
git add stores/homeResetStore.ts components/layout/Header.tsx components/toolbox/ToolboxClient.tsx docs/STEP_748_COMMAND.md
git commit -m "STEP 748: keep selected country on header logo click (drop locale-home force reset)"
git push
```

## 완료 보고 → Cowork에게
- tsc/vitest/build + 커밋 해시. 라이브 확인(클라 동작)은 Cowork/사용자가 브라우저로.
