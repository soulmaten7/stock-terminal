import { create } from "zustand";

type HomeResetState = { n: number; reset: () => void };

// 헤더 홈/로고 클릭 시 n 증가 → 홈 랭킹 영역 key로 사용해 리마운트(전체 리셋)
export const useHomeReset = create<HomeResetState>((set) => ({
  n: 0,
  reset: () => set((s) => ({ n: s.n + 1 })),
}));
