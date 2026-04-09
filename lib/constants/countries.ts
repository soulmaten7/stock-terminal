export const COUNTRIES = [
  { code: 'KR', name: '한국', flag: '🇰🇷', markets: ['KOSPI', 'KOSDAQ'] },
  { code: 'US', name: '미국', flag: '🇺🇸', markets: ['NASDAQ', 'NYSE'] },
] as const;

export const COUNTRY_MAP = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));
