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
  // FloatingChat 언리드 카운트 (패널 닫혀있을 때만 증가)
  unreadCount: number;
  panelOpen: boolean;
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setFilter: (f: ChatState['filter']) => void;
  setHotStocks: (h: ChatState['hotStocks']) => void;
  setConnected: (v: boolean) => void;
  setPanelOpen: (v: boolean) => void;
  markAsRead: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  filter: 'all',
  hotStocks: [],
  isConnected: false,
  unreadCount: 0,
  panelOpen: false,
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages.slice(-199), msg],
      // 패널이 닫혀있을 때만 언리드 증가. 열려있으면 즉시 읽음 처리.
      unreadCount: s.panelOpen ? s.unreadCount : s.unreadCount + 1,
    })),
  setFilter: (filter) => set({ filter }),
  setHotStocks: (hotStocks) => set({ hotStocks }),
  setConnected: (isConnected) => set({ isConnected }),
  setPanelOpen: (panelOpen) =>
    set((s) => ({
      panelOpen,
      // 열 때 언리드 리셋
      unreadCount: panelOpen ? 0 : s.unreadCount,
    })),
  markAsRead: () => set({ unreadCount: 0 }),
}));
