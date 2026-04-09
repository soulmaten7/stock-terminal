export async function fetchEcosIndicator(statCode: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams({ stat_code: statCode });
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const res = await fetch(`/api/ecos?${params}`);
  return res.json();
}

// 한국은행 주요 통계코드
export const ECOS_STAT_CODES = {
  BASE_RATE: '722Y001', // 기준금리
  CPI: '901Y009',       // 소비자물가지수
  GDP: '200Y002',       // 국내총생산
  EXCHANGE: '731Y001',  // 환율
} as const;
