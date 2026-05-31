import { create } from 'zustand';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  tier: 1 | 2 | 3;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tier: 1,
  isLoading: true,
  setUser: (user) => set({ user, tier: (user?.tier as 1 | 2 | 3) ?? 1 }),
  setLoading: (isLoading) => set({ isLoading }),
}));
