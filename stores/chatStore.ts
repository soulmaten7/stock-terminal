import { create } from 'zustand';

export type ChatMessage = {
  id: string;
  user_id: string | null;
  content: string;
  stock_tags: string[];
  created_at: string;
  hidden: boolean;
};

type ChatFilter = 'all' | 'watchlist' | 'hot' | 'symbol';

type ChatState = {
  messages: ChatMessage[];
  filter: ChatFilter;
  hotStocks: { symbol: string; count: number }[];
  isConnected: boolean;
  // FloatingChat 언리드 카운트 (패널 닫혀있을 때만 증가)
  unreadCount: number;
  panelOpen: boolean;
  // URL /stocks/[symbol] 에서 추출한 현재 활성 심볼. null 이면 필터에 $심볼 탭 안 보임.
  activeSymbol: string | null;
  // 사용자가 마지막으로 'symbol' 이외로 수동 선택한 필터. 종목 페이지 이탈 시 복원용.
  lastManualFilter: Exclude<ChatFilter, 'symbol'>;
  setMessages: (msgs: ChatMessage[]) => void;
  addMessage: (msg: ChatMessage) => void;
  setFilter: (f: ChatFilter) => void;
  setHotStocks: (h: ChatState['hotStocks']) => void;
  setConnected: (v: boolean) => void;
  setPanelOpen: (v: boolean) => void;
  markAsRead: () => void;
  setActiveSymbol: (symbol: string | null) => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  filter: 'all',
  hotStocks: [],
  isConnected: false,
  unreadCount: 0,
  panelOpen: false,
  activeSymbol: null,
  lastManualFilter: 'all',
  setMessages: (messages) => set({ messages }),
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages.slice(-199), msg],
      // 패널이 닫혀있을 때만 언리드 증가. 열려있으면 즉시 읽음 처리.
      unreadCount: s.panelOpen ? s.unreadCount : s.unreadCount + 1,
    })),
  setFilter: (filter) =>
    set((s) => ({
      filter,
      // 'symbol' 이외로 바꿀 때만 lastManualFilter 기억
      // → 종목 페이지 진입·이탈 시 사용자의 마지막 수동 선택 복원용
      lastManualFilter: filter === 'symbol' ? s.lastManualFilter : filter,
    })),
  setHotStocks: (hotStocks) => set({ hotStocks }),
  setConnected: (isConnected) => set({ isConnected }),
  setPanelOpen: (panelOpen) =>
    set((s) => ({
      panelOpen,
      // 열 때 언리드 리셋
      unreadCount: panelOpen ? 0 : s.unreadCount,
    })),
  markAsRead: () => set({ unreadCount: 0 }),
  setActiveSymbol: (symbol) =>
    set((s) => {
      // 종목 페이지 진입: filter 를 'symbol' 로 자동 전환
      // 단, 사용자가 이미 'symbol' 필터 중이었다면 lastManualFilter 는 건드리지 않음
      if (symbol) {
        return {
          activeSymbol: symbol,
          filter: 'symbol',
        };
      }
      // 종목 페이지 이탈: filter 를 'symbol' 이었을 경우에만 lastManualFilter 로 복원
      return {
        activeSymbol: null,
        filter: s.filter === 'symbol' ? s.lastManualFilter : s.filter,
      };
    }),
}));
