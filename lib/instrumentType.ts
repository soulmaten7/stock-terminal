import YahooFinance from 'yahoo-finance2';
import { createAdminClient } from '@/lib/supabase/admin';

// 상품 유형 감지 — 종목(equity) vs 펀드형(ETF·ETN). ETF/ETN은 렌즈(기업재무) 대신 '구성' 뷰.
// KR = 우리 스냅샷 테이블로 판별(kr_etp_snapshot=fund·kr_stock_snapshot=equity, 외부호출 없음). 미지 심볼만 네이버 폴백.
// US 등 = 야후 quoteType(us_stock_perf엔 ETN 혼재라 DB로 못 가름) → 캐시 + 봇 게이트로 외부호출 억제.
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

type Kind = 'fund' | 'equity';
// 🔴 STEP 828 §3: 상한+TTL 캐시 — 유형은 거의 불변이라 장기 TTL이 안전하고, 상한으로 무한 증가(메모리 누수)를 막는다.
const CACHE_CAP = 5000;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일
const _cache = new Map<string, { kind: Kind; at: number }>();

function cacheGet(key: string): Kind | undefined {
  const e = _cache.get(key);
  if (!e) return undefined;
  if (Date.now() - e.at > TTL_MS) { _cache.delete(key); return undefined; }
  return e.kind;
}
function cacheSet(key: string, kind: Kind): void {
  _cache.set(key, { kind, at: Date.now() });
  if (_cache.size > CACHE_CAP) {
    // 삽입순 Map — 가장 오래된 항목부터 초과분 제거.
    const excess = _cache.size - CACHE_CAP;
    let i = 0;
    for (const k of _cache.keys()) { _cache.delete(k); if (++i >= excess) break; }
  }
}

function krCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase().replace(/\.(KS|KQ)$/, '');
  return /^\d[0-9A-Z]{5}$/.test(s) ? s : null;
}

// opts.allowExternal=false → 외부 API를 절대 호출하지 않는다(봇·크롤러용). DB/캐시로만 판별, 미지면 안전 폴백('equity').
//   서버 HTML의 SEO(h1·JSON-LD)는 kind와 무관하므로 봇에 equity로 폴백해도 노출은 동일하다.
export async function getInstrumentType(symbol: string, opts: { allowExternal?: boolean } = {}): Promise<Kind> {
  const allowExternal = opts.allowExternal !== false;
  const key = symbol.toUpperCase();
  const cached = cacheGet(key);
  if (cached) return cached;

  const kc = krCode(symbol);
  // 🔴 STEP 828 §3: KR은 우리 스냅샷으로 먼저 판별 → 외부(네이버) 호출 제거. 두 테이블 모두 없을 때만 폴백.
  if (kc) {
    try {
      const sb = createAdminClient();
      const { data: etp } = await sb.from('kr_etp_snapshot').select('kind').eq('symbol', kc).maybeSingle();
      if (etp) { cacheSet(key, 'fund'); return 'fund'; }
      const { data: st } = await sb.from('kr_stock_snapshot').select('symbol').eq('symbol', kc).maybeSingle();
      if (st) { cacheSet(key, 'equity'); return 'equity'; }
    } catch {
      /* DB 실패 → 아래 외부 폴백(허용 시)으로 */
    }
  }

  if (!allowExternal) return 'equity'; // 봇·크롤러: 외부호출 없이 안전 폴백

  try {
    if (kc) {
      // 미지 KR 심볼만 네이버 stockEndType 폴백.
      const r = await fetch(`https://m.stock.naver.com/api/stock/${kc}/integration`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', Referer: 'https://m.stock.naver.com/' },
        signal: AbortSignal.timeout(6000),
      });
      const j = (await r.json()) as { stockEndType?: string };
      const t = String(j?.stockEndType ?? '').toLowerCase();
      const kind: Kind = t === 'etf' || t === 'etn' ? 'fund' : 'equity';
      cacheSet(key, kind);
      return kind;
    }
    const q = await yf.quote(symbol);
    const t = String((q as { quoteType?: string })?.quoteType ?? '').toUpperCase();
    const kind: Kind = t === 'ETF' || t === 'MUTUALFUND' ? 'fund' : 'equity';
    cacheSet(key, kind);
    return kind;
  } catch {
    return 'equity'; // 실패 시 종목으로(안전 폴백)
  }
}
