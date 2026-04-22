import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchKisApi } from '@/lib/kis';

export const runtime = 'nodejs';

// 10분 인메모리 캐시 (KIS fallback 결과만)
interface CachedStock { data: unknown; cachedAt: number; }
const fallbackCache = new Map<string, CachedStock>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }

  const sym = symbol.toUpperCase();

  // 1. Supabase 먼저 조회
  const supabase = await createClient();
  const { data: supabaseStock } = await supabase
    .from('stocks')
    .select('id, symbol, name_ko, name_en, market, country, sector, industry, market_cap, is_active, created_at, updated_at')
    .eq('symbol', sym)
    .maybeSingle();

  if (supabaseStock) {
    return NextResponse.json({ stock: supabaseStock, source: 'supabase' });
  }

  // 2. KIS fallback — 6자리 숫자만 한국 종목으로 간주
  if (!/^[0-9]{6}$/.test(sym)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // 캐시 체크
  const cached = fallbackCache.get(sym);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json({ stock: cached.data, source: 'kis-cache' });
  }

  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-price',
      trId: 'FHKST01010100',
      params: { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: sym },
    });
    const o = data.output;
    if (!o || !o.hts_kor_isnm) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const syntheticStock = {
      id: null,
      symbol: sym,
      name_ko: o.hts_kor_isnm as string,
      name_en: null,
      market: 'KOSPI',
      country: 'KR',
      sector: null,
      industry: null,
      market_cap: o.hts_avls ? parseInt(o.hts_avls, 10) : null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    fallbackCache.set(sym, { data: syntheticStock, cachedAt: Date.now() });
    return NextResponse.json({ stock: syntheticStock, source: 'kis' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
