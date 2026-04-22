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

interface SectorRow { sector: string; change: number; count: number; }

let _krCache: { data: SectorRow[]; at: number } | null = null;
let _usCache: { data: SectorRow[]; at: number } | null = null;
const TTL = 5 * 60 * 1000;

async function getKrSectors(): Promise<SectorRow[]> {
  if (_krCache && Date.now() - _krCache.at < TTL) return _krCache.data;

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
    return NextResponse.json({ sectors: [], market, error: String(e) }, { status: 500 });
  }
}
