export async function fetchFredSeries(seriesId: string) {
  const res = await fetch(`/api/fred?series_id=${seriesId}`);
  return res.json();
}

// FRED 주요 시리즈 코드
export const FRED_SERIES = {
  FED_FUNDS_RATE: 'FEDFUNDS',    // 미국 기준금리
  CPI: 'CPIAUCSL',                // 미국 CPI
  GDP: 'GDP',                     // 미국 GDP
  UNEMPLOYMENT: 'UNRATE',         // 실업률
  SP500: 'SP500',                 // S&P 500
} as const;
