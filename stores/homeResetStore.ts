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
