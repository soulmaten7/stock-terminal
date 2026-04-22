import { NextResponse } from 'next/server';
import { fetchKisApi } from '@/lib/kis';
import themesData from '@/data/themes.json';

interface ThemeEntry { name: string; stocks: string[]; }

interface CachedResult {
  themes: Array<{ name: string; change: number; count: number; stocks: Array<{ symbol: string; name: string; change: number; price: number }> }>;
  updatedAt: number;
}
let cache: CachedResult | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

async function fetchStockPrice(symbol: string) {
  try {
    const data = await fetchKisApi({
      endpoint: '/uapi/domestic-stock/v1/quotations/inquire-price',
      trId: 'FHKST01010100',
      params: {
        FID_COND_MRKT_DIV_CODE: 'J',
        FID_INPUT_ISCD: symbol,
      },
    });
    const o = data.output;
    if (!o) return null;
    return {
      symbol,
      name: o.hts_kor_isnm as string,
      price: parseInt(o.stck_prpr, 10),
      change: parseFloat(o.prdy_ctrt),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  if (cache && Date.now() - cache.updatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      themes: cache.themes,
      cachedAt: new Date(cache.updatedAt).toISOString(),
      source: themesData.source,
    });
  }

  const allSymbols = Array.from(
    new Set((themesData.themes as ThemeEntry[]).flatMap((t) => t.stocks))
  );

  const prices = await Promise.all(allSymbols.map(fetchStockPrice));
  const priceMap = new Map<string, { name: string; price: number; change: number }>();
  prices.forEach((p) => { if (p) priceMap.set(p.symbol, { name: p.name, price: p.price, change: p.change }); });

  const themes = (themesData.themes as ThemeEntry[]).map((t) => {
    const resolvedStocks = t.stocks
      .map((sym) => {
        const info = priceMap.get(sym);
        return info ? { symbol: sym, name: info.name, price: info.price, change: info.change } : null;
      })
      .filter((s): s is { symbol: string; name: string; price: number; change: number } => s !== null);

    const avgChange = resolvedStocks.length > 0
      ? resolvedStocks.reduce((acc, s) => acc + s.change, 0) / resolvedStocks.length
      : 0;

    return {
      name: t.name,
      change: Number(avgChange.toFixed(2)),
      count: resolvedStocks.length,
      stocks: resolvedStocks,
    };
  });

  cache = { themes, updatedAt: Date.now() };

  return NextResponse.json({
    themes,
    cachedAt: new Date().toISOString(),
    source: themesData.source,
  });
}
