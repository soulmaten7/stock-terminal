"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Store = {
  nickname: string;
  setNickname: (n: string) => void;
};

function generateNickname(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `트레이더-${num}`;
}

export const useNickname = create<Store>()(
  persist(
    (set) => ({
      nickname: generateNickname(),
      setNickname: (n) => set({ nickname: n }),
    }),
    {
      name: "unjong-nickname",
    }
  )
);
