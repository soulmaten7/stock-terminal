import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

const SYMBOLS = [
  { symbol: '^KS11',    label: 'KOSPI' },
  { symbol: '^KS200',   label: 'KOSPI 200' },
  { symbol: '^KQ11',    label: 'KOSDAQ' },
  { symbol: 'ES=F',     label: 'S&P 500 선물' },
  { symbol: 'NQ=F',     label: 'NASDAQ 선물' },
  { symbol: 'USDKRW=X', label: 'USD/KRW' },
  { symbol: 'USDJPY=X', label: 'USD/JPY' },
  { symbol: 'CL=F',     label: 'WTI 원유' },
  { symbol: '^TNX',     label: '미국채 10Y' },
];

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
    const symbols = SYMBOLS.map((s) => s.symbol);
    const quotes = await yahooFinance.quote(symbols);
    const resultsArr = (Array.isArray(quotes) ? quotes : [quotes]) as Array<Record<string, unknown>>;

    const labelMap = Object.fromEntries(SYMBOLS.map((s) => [s.symbol, s.label]));

    const items: QuoteItem[] = resultsArr.map((q) => {
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

    const ordered = SYMBOLS.map((s) => items.find((i) => i.symbol === s.symbol)).filter(Boolean) as QuoteItem[];

    return NextResponse.json(
      { items: ordered },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=10' } },
    );
  } catch (e) {
    console.error('[api/home/global]', e);
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}

export const revalidate = 30;
