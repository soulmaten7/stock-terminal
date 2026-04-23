import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import yahooFinance from 'yahoo-finance2';

// US sector ETFs (SPDR)
const US_SECTOR_ETFS = [
  { symbol: 'XLK',  name: '기술' },
  { symbol: 'XLV',  name: '헬스케어' },
  { symbol: 'XLF',  name: '금융' },
  { symbol: 'XLY',  name: '소비재(임의)' },
  { symbol: 'XLP',  name: '소비재(필수)' },
  { symbol: 'XLE',  name: '에너지' },
  { symbol: 'XLI',  name: '산업재' },
  { symbol: 'XLB',  name: '소재' },
  { symbol: 'XLRE', name: '리츠' },
  { symbol: 'XLU',  name: '유틸리티' },
  { symbol: 'XLC',  name: '통신' },
];

// KRX sector ETFs (KODEX / TIGER 대표)
const KR_SECTOR_ETFS = [
  { symbol: '091160.KS', name: '반도체' },
  { symbol: '305720.KS', name: '2차전지' },
  { symbol: '091170.KS', name: '은행' },
  { symbol: '227550.KS', name: '자동차' },
  { symbol: '139220.KS', name: '건설' },
  { symbol: '102780.KS', name: '철강' },
  { symbol: '266370.KS', name: '바이오' },
  { symbol: '139250.KS', name: '소비재' },
  { symbol: '228800.KS', name: '조선' },
  { symbol: '261220.KS', name: '미디어' },
];

interface SectorRow { sector: string; change: number; count: number; }

let _krCache: { data: SectorRow[]; at: number } | null = null;
let _usCache: { data: SectorRow[]; at: number } | null = null;
const TTL = 5 * 60 * 1000;

async function getKrSectorsFromDB(): Promise<SectorRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('stock_snapshot_v')
    .select('sector, return_3m')
    .eq('is_active', true)
    .eq('country', 'KR')
    .not('sector', 'is', null)
    .not('return_3m', 'is', null);

  const map = new Map<string, number[]>();
  for (const row of data ?? []) {
    const s = row.sector as string;
    if (!map.has(s)) map.set(s, []);
    map.get(s)!.push(row.return_3m as number);
  }

  const result: SectorRow[] = [];
  map.forEach((vals, sector) => {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    result.push({ sector, change: Number(avg.toFixed(2)), count: vals.length });
  });
  result.sort((a, b) => b.change - a.change);
  return result;
}

async function getKrSectorsFromETF(): Promise<SectorRow[]> {
  const symbols = KR_SECTOR_ETFS.map((e) => e.symbol);
  const quotes = await yahooFinance.quote(symbols);
  const quoteArr = (Array.isArray(quotes) ? quotes : [quotes]) as Array<Record<string, unknown>>;
  return quoteArr.map((q, i) => ({
    sector: KR_SECTOR_ETFS[i]?.name ?? String(q.symbol ?? ''),
    change: Number((Number(q.regularMarketChangePercent ?? 0)).toFixed(2)),
    count: 1,
  })).sort((a, b) => b.change - a.change);
}

async function getKrSectors(): Promise<SectorRow[]> {
  if (_krCache && Date.now() - _krCache.at < TTL) return _krCache.data;

  let result = await getKrSectorsFromDB();

  if (result.length === 0) {
    console.log('[sectors] KR DB empty, falling back to ETF quotes');
    try {
      result = await getKrSectorsFromETF();
    } catch (e) {
      console.error('[sectors] KR ETF fallback failed:', e);
    }
  }

  _krCache = { data: result, at: Date.now() };
  return result;
}

async function getUsSectors(): Promise<SectorRow[]> {
  if (_usCache && Date.now() - _usCache.at < TTL) return _usCache.data;

  const symbols = US_SECTOR_ETFS.map((e) => e.symbol);
  const quotes = await yahooFinance.quote(symbols);
  const quoteArr = (Array.isArray(quotes) ? quotes : [quotes]) as Array<Record<string, unknown>>;

  const data: SectorRow[] = quoteArr.map((q, i) => ({
    sector: US_SECTOR_ETFS[i]?.name ?? String(q.symbol ?? ''),
    change: Number((Number(q.regularMarketChangePercent ?? 0)).toFixed(2)),
    count: 1,
  })).sort((a, b) => b.change - a.change);

  _usCache = { data, at: Date.now() };
  return data;
}

export async function GET(req: Request) {
  const market = new URL(req.url).searchParams.get('market') ?? 'KR';
  try {
    const data = market === 'US' ? await getUsSectors() : await getKrSectors();
    return NextResponse.json({ sectors: data, market });
  } catch (e) {
    console.error('[api/home/sectors] fatal:', e);
    return NextResponse.json({ sectors: [], market, error: String(e) }, { status: 500 });
  }
}
