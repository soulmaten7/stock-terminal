import { create } from 'zustand';

export type Country = 'KR' | 'US';

interface CountryState {
  country: Country;
  setCountry: (country: Country) => void;
}

export const useCountryStore = create<CountryState>((set) => ({
  country: 'KR',
  setCountry: (country) => set({ country }),
}));
