import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Country = 'KR' | 'US' | 'JP' | 'CN' | 'VN' | 'GB';

// 로케일의 '홈 시장' — 그 언어 사용자가 기본으로 보게 될 국가탭.
// ko → KR(현행), en → US. 국가탭 순서와 첫 방문 기본값 둘 다 이 값을 쓴다.
// 여긴 로케일→시장 매핑의 단일 진실원. 새 로케일을 붙이면 여기에 한 줄 추가.
export const HOME_MARKET: Record<string, Country> = { ko: 'KR', en: 'US' };
export const homeMarketFor = (locale: string): Country => HOME_MARKET[locale] ?? 'KR';

// persist 키 — "저장된 선택이 있는가"를 밖에서 확인해야 해서 상수로 노출.
// (있으면 = 사용자가 국가를 고른 적 있음 → 로케일 기본값이 그 선택을 덮으면 안 된다)
export const COUNTRY_STORAGE_KEY = 'trillion-country';

interface CountryState {
  country: Country;
  setCountry: (country: Country) => void;
}

export const useCountryStore = create<CountryState>()(
  persist(
    (set) => ({
      country: 'KR',
      setCountry: (country) => set({ country }),
    }),
    { name: COUNTRY_STORAGE_KEY }
  )
);
