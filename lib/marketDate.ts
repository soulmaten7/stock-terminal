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

// 시장 코드(KR/US/JP/CN/GB/VN…) → 그 시장 타임존.
const TZ_BY_MARKET: Record<string, string> = {
  KR: 'Asia/Seoul', US: 'America/New_York', JP: 'Asia/Tokyo',
  CN: 'Asia/Shanghai', HK: 'Asia/Hong_Kong', GB: 'Europe/London', VN: 'Asia/Ho_Chi_Minh',
};
// 시장 로컬 '오늘' YYYY-MM-DD — AsOfBadge가 UTC 대신 이걸로 비교해야 KST 새벽(UTC가 하루 뒤처짐)에
// 어제 데이터가 '오늘'로 오판돼 배지가 숨는 버그를 막는다(STEP 804 §3).
export function marketToday(market: string, at: Date = new Date()): string {
  const tz = TZ_BY_MARKET[(market || '').toUpperCase()] ?? 'America/New_York';
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}
