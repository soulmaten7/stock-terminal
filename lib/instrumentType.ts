import YahooFinance from 'yahoo-finance2';

// 상품 유형 감지 — 종목(equity) vs 펀드형(ETF·ETN·뮤추얼펀드). ETF/ETN은 렌즈(기업재무) 대신 '구성' 뷰.
// Yahoo quoteType 기준(ETF는 자기 재무 없음). 유형은 안 바뀌므로 인스턴스 캐시(콜드스타트당 1회).
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const _cache = new Map<string, 'fund' | 'equity'>();

export async function getInstrumentType(symbol: string): Promise<'fund' | 'equity'> {
  const key = symbol.toUpperCase();
  const cached = _cache.get(key);
  if (cached) return cached;
  try {
    const q = await yf.quote(symbol);
    const t = String((q as { quoteType?: string })?.quoteType ?? '').toUpperCase();
    const kind: 'fund' | 'equity' = t === 'ETF' || t === 'MUTUALFUND' ? 'fund' : 'equity';
    _cache.set(key, kind);
    return kind;
  } catch {
    return 'equity'; // 실패 시 종목으로(안전 폴백)
  }
}
