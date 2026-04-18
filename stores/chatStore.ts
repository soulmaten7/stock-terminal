import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  user_id: string | null;
  content: string;
  stock_tags: string[];
  created_at: string;
  hidden: boolean;
};

type ChatState = {
  messages: ChatMessage[];
  filter: 'all' | 'watchlist' | 'hot';
  hotStocks: { symbol: string; count: number }[];
  isConnected: boolean;
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setFilter: (f: ChatState['filter']) => void;
  setHotStocks: (h: ChatState['hotStocks']) => void;
  setConnected: (v: boolean) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  filter: 'all',
  hotStocks: [],
  isConnected: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages.slice(-199), msg] })),
  setFilter: (filter) => set({ filter }),
  setHotStocks: (hotStocks) => set({ hotStocks }),
  setConnected: (isConnected) => set({ isConnected }),
}));
