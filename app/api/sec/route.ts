import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const formType = searchParams.get('form_type'); // 10-K, 10-Q, 8-K 등

  const userAgent = process.env.SEC_USER_AGENT || 'StockTerminal support@stockterminal.com';

  // mode=recent: 최근 주요 미국 공시 (ticker 불필요)
  if (searchParams.get('mode') === 'recent') {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 3);

      const startStr = startDate.toISOString().split('T')[0];
      const endStr = today.toISOString().split('T')[0];

      const params = new URLSearchParams({
        dateRange: 'custom',
        startdt: startStr,
        enddt: endStr,
        forms: '10-K,10-Q,8-K,S-1',
      });

      const res = await fetch(`https://efts.sec.gov/LATEST/search-index?${params}`, {
        headers: { 'User-Agent': userAgent, Accept: 'application/json' },
        next: { revalidate: 1800 },
      });

      if (!res.ok) {
        return NextResponse.json({ filings: [], error: `SEC API returned ${res.status}` });
      }

      const data = await res.json();
      const hits = data.hits?.hits || [];

      const filings = hits.slice(0, 20).map((hit: Record<string, unknown>) => {
        const src = (hit._source || {}) as Record<string, unknown>;
        const names = src.display_names as string[] | undefined;
        const tickers = src.tickers as string[] | undefined;
        return {
          company: names?.[0] || (src.entity_name as string) || 'Unknown',
          ticker: tickers?.[0] || '',
          form_type: (src.form_type as string) || '',
          filed_date: (src.file_date as string) || '',
          description: (src.display_date_filed as string) || '',
          url: `https://www.sec.gov/Archives/edgar/data/${(src.file_num as string) || ''}`,
        };
      });

      return NextResponse.json({ filings });
    } catch {
      return NextResponse.json({ filings: [], error: 'Failed to fetch SEC recent filings' });
    }
  }

  // ticker-specific filings
  if (!ticker) {
    return NextResponse.json({ error: 'ticker is required' }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({ query: ticker, dateRange: 'custom' });
    if (formType) params.set('forms', formType);

    const today = new Date();
    const startDate = new Date(today);
    startDate.setFullYear(startDate.getFullYear() - 1);
    params.set('startdt', startDate.toISOString().split('T')[0]);
    params.set('enddt', today.toISOString().split('T')[0]);

    const res = await fetch(`https://efts.sec.gov/LATEST/search-index?${params}`, {
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ filings: [], error: `SEC API returned ${res.status}` });
    }

    const data = await res.json();
    const hits = data.hits?.hits || [];

    const filings = hits.slice(0, 20).map((hit: Record<string, unknown>) => {
      const src = (hit._source || {}) as Record<string, unknown>;
      const names = src.display_names as string[] | undefined;
      const tickers = src.tickers as string[] | undefined;
      return {
        company: names?.[0] || (src.entity_name as string) || 'Unknown',
        ticker: tickers?.[0] || ticker,
        form_type: (src.form_type as string) || '',
        filed_date: (src.file_date as string) || '',
        url: `https://www.sec.gov/Archives/edgar/data/${(src.file_num as string) || ''}`,
      };
    });

    return NextResponse.json({ filings });
  } catch {
    return NextResponse.json({ filings: [], error: 'Failed to fetch SEC data' });
  }
}
