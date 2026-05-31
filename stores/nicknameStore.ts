"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";

type Store = {
  nickname: string;
  setNickname: (n: string) => void;
  ensureNickname: () => void;
};

function generateNickname(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `트레이더-${num}`;
}

// 초기값은 빈 문자열 — SSR/Hydration 일치를 위해 Math.random() 호출 금지.
// 클라이언트 마운트 후 useEffect 에서 ensureNickname() 호출하여 생성.
export const useNickname = create<Store>()(
  persist(
    (set, get) => ({
      nickname: "",
      setNickname: (n) => set({ nickname: n }),
      ensureNickname: () => {
        // 1. 로그인한 사용자면 DB 닉네임 우선
        const authUser = useAuthStore.getState().user;
        if (authUser?.nickname) {
          set({ nickname: authUser.nickname });
          return;
        }
        // 2. 로그인 X 면 localStorage 생성
        if (!get().nickname) {
          set({ nickname: generateNickname() });
        }
      },
    }),
    {
      name: "unjong-nickname",
    }
  )
);
