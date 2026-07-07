import { create } from "zustand";
import { useCountryStore } from "./countryStore";

type HomeResetState = { n: number; reset: () => void };

// 헤더 로고/'주식' 클릭 = 언어권 기본 홈으로 완전 리셋.
//   국가 → KR(한국어 기본·persist 덮어씀) · 탭 → 종목·상품(market) · 서브필터 → 주식(보드 리마운트).
//   n 증가를 ToolboxClient가 구독해 탭·서브·보드를 리셋한다.
export const useHomeReset = create<HomeResetState>((set) => ({
  n: 0,
  reset: () => {
    useCountryStore.getState().setCountry("KR");
    // localStorage 탭도 초기화 — 다른 페이지에서 로고로 홈 이동 시 새 마운트가 이 값을 읽음.
    try { localStorage.setItem("unjong_tab", "market"); } catch { /* SSR/비가용 무시 */ }
    set((s) => ({ n: s.n + 1 }));
  },
}));
