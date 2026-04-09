import { create } from 'zustand';
import type { Watchlist } from '@/types/user';

interface WatchlistState {
  items: Watchlist[];
  setItems: (items: Watchlist[]) => void;
  addItem: (item: Watchlist) => void;
  removeItem: (id: number) => void;
}

export const useWatchlistStore = create<WatchlistState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
}));
