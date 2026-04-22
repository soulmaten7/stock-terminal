'use client';

import { create } from 'zustand';

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

export const useSelectedSymbolStore = create<SelectedSymbolState>((set) => ({
  selected: null,
  setSelected: (symbol) => set({ selected: symbol }),
}));
