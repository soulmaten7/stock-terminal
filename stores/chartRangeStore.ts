import { create } from "zustand";

export type ChartRange = "1d" | "1w" | "1m" | "3m" | "6m" | "1y";

interface ChartRangeState {
  range: ChartRange;
  setRange: (r: ChartRange) => void;
}

export const useChartRange = create<ChartRangeState>((set) => ({
  range: "1d",
  setRange: (range) => set({ range }),
}));
