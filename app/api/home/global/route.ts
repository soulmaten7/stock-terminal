import { NextResponse } from 'next/server';

const SYMBOLS = [
  { symbol: '^KS11',    label: 'KOSPI' },
  { symbol: '^KQ11',    label: 'KOSDAQ' },
  { symbol: 'ES=F',     label: 'S&P 500 선물' },
  { symbol: 'NQ=F',     label: 'NASDAQ 선물' },
  { symbol: 'USDKRW=X', label: 'USD/KRW' },
  { symbol: 'USDJPY=X', label: 'USD/JPY' },
  { symbol: 'CL=F',     label: 'WTI 원유' },
  { symbol: '^TNX',     label: '미국채 10Y' },
];

const YF_URL =
  'https://query1.finance.yahoo.com/v7/finance/quote?symbols=' +
  SYMBOLS.map((s) => encodeURIComponent(s.symbol)).join(',');

interface QuoteItem {
  label: string;
  symbol: string;
  price: string;
  change: string;
  up: boolean;
}

function fmt(n: number, digits = 2): string {
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: digits });
  return n.toFixed(digits);
}

export async function GET() {
  try {
    const res = await fetch(YF_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StockTerminal/1.0)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`Yahoo Finance ${res.status}`);

    const json = await res.json();
    const results: Record<string, unknown>[] = json?.quoteResponse?.result ?? [];

    const labelMap = Object.fromEntries(SYMBOLS.map((s) => [s.symbol, s.label]));

    const items: QuoteItem[] = results.map((q) => {
      const price = (q.regularMarketPrice as number) ?? 0;
      const changePct = (q.regularMarketChangePercent as number) ?? 0;
      const sym = q.symbol as string;
      const label = labelMap[sym] ?? sym;
      const isYield = sym === '^TNX';

      return {
        label,
        symbol: sym,
        price: isYield ? `${fmt(price, 3)}%` : fmt(price),
        change: `${changePct >= 0 ? '+' : ''}${fmt(changePct, 2)}%`,
        up: changePct >= 0,
      };
    });

    // preserve original order
    const ordered = SYMBOLS.map((s) => items.find((i) => i.symbol === s.symbol)).filter(Boolean) as QuoteItem[];

    return NextResponse.json(
      { items: ordered },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
    );
  } catch (e) {
    console.error('[api/home/global]', e);
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
