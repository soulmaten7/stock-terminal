// 심볼 접미사 → 시장 타임존 → 그 시장의 오늘 날짜(YYYY-MM-DD).
// 캐시 as_of를 시장 로컬 날짜로 맞춰, 각 탭 브리핑이 자기 시장 하루 주기로 롤오버되게.
export function marketTz(symbol: string): string {
  const s = (symbol || '').toUpperCase();
  if (/\.(KS|KQ)$/.test(s) || /^\d{6}$/.test(s)) return 'Asia/Seoul';
  if (/\.T$/.test(s)) return 'Asia/Tokyo';
  if (/\.(SS|SZ)$/.test(s)) return 'Asia/Shanghai';
  if (/\.HK$/.test(s)) return 'Asia/Hong_Kong';
  if (/\.L$/.test(s)) return 'Europe/London';
  if (/\.VN$/.test(s)) return 'Asia/Ho_Chi_Minh';
  return 'America/New_York';
}

// 그 시장 타임존 기준 '오늘' YYYY-MM-DD. en-CA 로케일 = ISO 형식(YYYY-MM-DD).
export function marketDate(symbol: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: marketTz(symbol),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}
