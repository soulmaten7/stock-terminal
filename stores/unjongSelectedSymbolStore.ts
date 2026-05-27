'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UnjongSymbolMarket = 'KOSPI' | 'KOSDAQ' | 'US' | 'ETF';

export type UnjongSelectedSymbol = {
  code: string;
  name: string;
  price?: string;
  changePct?: number;
  market?: UnjongSymbolMarket;
};

type Store = {
  selectedSymbol: UnjongSelectedSymbol | null;
  setSelectedSymbol: (symbol: UnjongSelectedSymbol | null) => void;
};

export const useUnjongSelectedSymbol = create<Store>()(
  persist(
    (set) => ({
      selectedSymbol: {
        code: '005930',
        name: '삼성전자',
        price: '78,400',
        changePct: 1.42,
        market: 'KOSPI',
      },
      setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),
    }),
    {
      name: 'unjong-selected-symbol',
    }
  )
);
