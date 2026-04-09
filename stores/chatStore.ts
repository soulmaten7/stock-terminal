import { create } from 'zustand';
import type { ChatMessage, ChatRoom } from '@/types/chat';

interface ChatState {
  messages: ChatMessage[];
  currentRoom: ChatRoom;
  isOpen: boolean;
  onlineCount: number;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setRoom: (room: ChatRoom) => void;
  setOpen: (open: boolean) => void;
  setOnlineCount: (count: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentRoom: 'general',
  isOpen: false,
  onlineCount: 0,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages.slice(-49), message] })),
  setRoom: (currentRoom) => set({ currentRoom, messages: [] }),
  setOpen: (isOpen) => set({ isOpen }),
  setOnlineCount: (onlineCount) => set({ onlineCount }),
}));
