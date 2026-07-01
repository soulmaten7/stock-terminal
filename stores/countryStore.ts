import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Country = 'KR' | 'US' | 'JP' | 'CN';

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
    { name: 'trillion-country' }
  )
);
