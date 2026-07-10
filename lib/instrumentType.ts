import YahooFinance from 'yahoo-finance2';

// 상품 유형 감지 — 종목(equity) vs 펀드형(ETF·ETN). ETF/ETN은 렌즈(기업재무) 대신 '구성' 뷰.
// KR = 네이버 integration stockEndType(etf/etn/stock) — 야후는 신형 영숫자 KRX 코드(0193T0 단일종목ETF) 미보유.
// US 등 = 야후 quoteType. 유형은 안 바뀌므로 인스턴스 캐시(콜드스타트당 1회).
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const _cache = new Map<string, 'fund' | 'equity'>();

function krCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase().replace(/\.(KS|KQ)$/, '');
  return /^\d[0-9A-Z]{5}$/.test(s) ? s : null;
}

export async function getInstrumentType(symbol: string): Promise<'fund' | 'equity'> {
  const key = symbol.toUpperCase();
  const cached = _cache.get(key);
  if (cached) return cached;
  try {
    const kc = krCode(symbol);
    if (kc) {
      // 한국: 네이버 stockEndType으로 etf/etn 판별(영숫자 코드 포함).
      const r = await fetch(`https://m.stock.naver.com/api/stock/${kc}/integration`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', Referer: 'https://m.stock.naver.com/' },
        signal: AbortSignal.timeout(6000),
      });
      const j = (await r.json()) as { stockEndType?: string };
      const t = String(j?.stockEndType ?? '').toLowerCase();
      const kind: 'fund' | 'equity' = t === 'etf' || t === 'etn' ? 'fund' : 'equity';
      _cache.set(key, kind);
      return kind;
    }
    const q = await yf.quote(symbol);
    const t = String((q as { quoteType?: string })?.quoteType ?? '').toUpperCase();
    const kind: 'fund' | 'equity' = t === 'ETF' || t === 'MUTUALFUND' ? 'fund' : 'equity';
    _cache.set(key, kind);
    return kind;
  } catch {
    return 'equity'; // 실패 시 종목으로(안전 폴백)
  }
}
