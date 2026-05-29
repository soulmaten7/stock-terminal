"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WatchlistItem = {
  code: string;
  name: string;
  market: "KOSPI" | "KOSDAQ" | "US";
};

const SEED_WATCHLIST: WatchlistItem[] = [
  { code: "005930", name: "삼성전자",         market: "KOSPI" },
  { code: "000660", name: "SK하이닉스",       market: "KOSPI" },
  { code: "035720", name: "카카오",           market: "KOSPI" },
  { code: "035420", name: "NAVER",            market: "KOSPI" },
  { code: "207940", name: "삼성바이오로직스", market: "KOSPI" },
  { code: "AAPL",   name: "Apple",            market: "US"    },
  { code: "TSLA",   name: "Tesla",            market: "US"    },
  { code: "NVDA",   name: "NVIDIA",           market: "US"    },
];

type Store = {
  items: WatchlistItem[];
  add: (item: WatchlistItem) => void;
  remove: (code: string) => void;
  clear: () => void;
  reset: () => void;
};

export const useWatchlist = create<Store>()(
  persist(
    (set, get) => ({
      items: SEED_WATCHLIST,
      add: (item) => {
        if (get().items.some((i) => i.code === item.code)) return;
        set({ items: [...get().items, item] });
      },
      remove: (code) => set({ items: get().items.filter((i) => i.code !== code) }),
      clear: () => set({ items: [] }),
      reset: () => set({ items: SEED_WATCHLIST }),
    }),
    { name: "unjong-watchlist" }
  )
);
