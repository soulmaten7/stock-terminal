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
      name: 'selected-symbol',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
