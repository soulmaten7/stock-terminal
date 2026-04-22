import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

interface SymbolDef {
  symbol: string;
  label: string;
  section: '국내' | '미국' | '선물' | '환율' | '채권' | '원자재' | '아시아' | '유럽';
}

const SYMBOLS: SymbolDef[] = [
  // 국내
  { symbol: '^KS11',    label: 'KOSPI',        section: '국내' },
  { symbol: '^KS200',   label: 'KOSPI 200',    section: '국내' },
  { symbol: '^KQ11',    label: 'KOSDAQ',       section: '국내' },
  // 미국
  { symbol: '^GSPC',    label: 'S&P 500',      section: '미국' },
  { symbol: '^IXIC',    label: 'NASDAQ',       section: '미국' },
  { symbol: '^DJI',     label: 'DOW',          section: '미국' },
  { symbol: '^RUT',     label: 'Russell 2000', section: '미국' },
  { symbol: '^VIX',     label: 'VIX',          section: '미국' },
  // 선물
  { symbol: 'ES=F',     label: 'S&P 500 선물', section: '선물' },
  { symbol: 'NQ=F',     label: 'NASDAQ 선물',  section: '선물' },
  { symbol: 'YM=F',     label: 'DOW 선물',     section: '선물' },
  { symbol: 'RTY=F',    label: 'Russell 선물', section: '선물' },
  // 환율
  { symbol: 'USDKRW=X', label: 'USD/KRW',      section: '환율' },
  { symbol: 'USDJPY=X', label: 'USD/JPY',      section: '환율' },
  { symbol: 'EURUSD=X', label: 'EUR/USD',      section: '환율' },
  { symbol: 'GBPUSD=X', label: 'GBP/USD',      section: '환율' },
  { symbol: 'CNYKRW=X', label: 'CNY/KRW',      section: '환율' },
  // 채권
  { symbol: '^TNX',     label: '미국채 10Y',   section: '채권' },
  { symbol: '^FVX',     label: '미국채 5Y',    section: '채권' },
  { symbol: '^IRX',     label: '미국채 13W',   section: '채권' },
  { symbol: '^TYX',     label: '미국채 30Y',   section: '채권' },
  // 원자재
  { symbol: 'CL=F',     label: 'WTI 원유',     section: '원자재' },
  { symbol: 'BZ=F',     label: '브렌트유',     section: '원자재' },
  { symbol: 'GC=F',     label: '금 선물',      section: '원자재' },
  { symbol: 'SI=F',     label: '은 선물',      section: '원자재' },
  { symbol: 'NG=F',     label: '천연가스',     section: '원자재' },
  { symbol: 'HG=F',     label: '구리 선물',    section: '원자재' },
  // 아시아
  { symbol: '^N225',    label: '닛케이 225',   section: '아시아' },
  { symbol: '^HSI',     label: '항셍지수',     section: '아시아' },
  { symbol: '000001.SS',label: '상하이종합',   section: '아시아' },
  { symbol: '^TWII',    label: '대만 TAIEX',   section: '아시아' },
  // 유럽
  { symbol: '^GDAXI',   label: 'DAX',          section: '유럽' },
  { symbol: '^FTSE',    label: 'FTSE 100',     section: '유럽' },
  { symbol: '^FCHI',    label: 'CAC 40',       section: '유럽' },
  { symbol: '^STOXX50E',label: 'Euro Stoxx 50',section: '유럽' },
];

interface QuoteItem {
  section: string;
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export async function GET() {
  try {
    const symbols = SYMBOLS.map((s) => s.symbol);
    const quotes = await yahooFinance.quote(symbols);
    const arr = (Array.isArray(quotes) ? quotes : [quotes]) as Array<Record<string, unknown>>;

    const items: QuoteItem[] = SYMBOLS.map((s) => {
      const q = arr.find((r) => r.symbol === s.symbol);
      return {
        section: s.section,
        symbol: s.symbol,
        label: s.label,
        price: (q?.regularMarketPrice as number) ?? 0,
        change: (q?.regularMarketChange as number) ?? 0,
        changePercent: (q?.regularMarketChangePercent as number) ?? 0,
        fiftyTwoWeekHigh: (q?.fiftyTwoWeekHigh as number) ?? null,
        fiftyTwoWeekLow: (q?.fiftyTwoWeekLow as number) ?? null,
      };
    });

    return NextResponse.json(
      { items, updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } },
    );
  } catch (e) {
    console.error('[api/global]', e);
    return NextResponse.json({ items: [], error: 'fetch_failed' }, { status: 502 });
  }
}

export const revalidate = 60;
