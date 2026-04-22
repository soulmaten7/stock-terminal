import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function formatKRW(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_0000_0000_0000) return `${(n / 1_0000_0000_0000).toFixed(1)}조`;
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(0)}억`;
  return n.toLocaleString('ko-KR');
}

function fmtNum(n: number | null | undefined, suffix = ''): string {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}${suffix}`;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 });

  const supabase = await createClient();

  // 1. stocks 기본 정보 + market_cap
  const { data: stock } = await supabase
    .from('stocks')
    .select('id, symbol, name_ko, name_en, market, country, sector, industry, market_cap')
    .eq('symbol', symbol.toUpperCase())
    .maybeSingle();

  if (!stock) {
    // KIS fallback — 6자리 한국 종목만
    if (!/^[0-9]{6}$/.test(symbol.toUpperCase())) {
      return NextResponse.json({ error: 'stock not found' }, { status: 404 });
    }
    try {
      const { fetchKisApi } = await import('@/lib/kis');
      const data = await fetchKisApi({
        endpoint: '/uapi/domestic-stock/v1/quotations/inquire-price',
        trId: 'FHKST01010100',
        params: { FID_COND_MRKT_DIV_CODE: 'J', FID_INPUT_ISCD: symbol.toUpperCase() },
      });
      const o = data.output;
      if (!o) return NextResponse.json({ error: 'not found' }, { status: 404 });

      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        name: o.hts_kor_isnm,
        market: 'KOSPI',
        country: 'KR',
        sector: null,
        industry: null,
        kpis: {
          marketCap: o.hts_avls ? formatKRW(parseInt(o.hts_avls, 10) * 100_000_000) : '—',
          per: fmtNum(parseFloat(o.per || '0') || null),
          pbr: fmtNum(parseFloat(o.pbr || '0') || null),
          eps: '—',
          bps: '—',
          roe: '—',
          dividendYield: '—',
          yearRange: o.stck_dryc_hgpr && o.stck_dryc_lwpr
            ? `${parseInt(o.stck_dryc_lwpr, 10).toLocaleString()} ~ ${parseInt(o.stck_dryc_hgpr, 10).toLocaleString()} KRW`
            : '—',
        },
        meta: {
          latestFinancialPeriod: null,
          latestFinancialType: 'KIS-live',
          priceDataPoints: 0,
        },
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  // 2. 최신 재무 지표 (annual 우선, 없으면 quarterly)
  const { data: fin } = await supabase
    .from('financials')
    .select('period_type, period_date, per, pbr, eps, bps, roe')
    .eq('stock_id', stock.id)
    .order('period_date', { ascending: false })
    .limit(5);

  const latest = (fin ?? []).find((f: { period_type: string }) => f.period_type === 'annual')
              ?? (fin ?? [])[0]
              ?? null;

  // 3. 52주 최고/최저 (stock_prices)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const { data: prices } = await supabase
    .from('stock_prices')
    .select('high, low')
    .eq('stock_id', stock.id)
    .gte('trade_date', oneYearAgo.toISOString().slice(0, 10));

  let yearHigh: number | null = null;
  let yearLow: number | null = null;
  if (prices && prices.length > 0) {
    yearHigh = Math.max(...prices.map((p: { high: number | null }) => p.high ?? 0));
    yearLow = Math.min(
      ...prices
        .filter((p: { low: number | null }) => p.low != null && p.low > 0)
        .map((p: { low: number }) => p.low)
    );
  }

  const currency = stock.country === 'KR' ? 'KRW' : 'USD';

  return NextResponse.json({
    symbol: stock.symbol,
    name: stock.name_ko ?? stock.name_en,
    market: stock.market,
    country: stock.country,
    sector: stock.sector,
    industry: stock.industry,
    kpis: {
      marketCap: stock.country === 'KR' ? formatKRW(stock.market_cap) : fmtNum(stock.market_cap, ' USD'),
      per: fmtNum(latest?.per),
      pbr: fmtNum(latest?.pbr),
      eps: fmtNum(latest?.eps),
      bps: fmtNum(latest?.bps),
      roe: (() => {
        if (latest?.roe != null) return fmtNum(latest.roe, '%');
        if (latest?.eps != null && latest?.bps != null && latest.bps !== 0)
          return fmtNum((latest.eps / latest.bps) * 100, '%');
        return '—';
      })(),
      dividendYield: '—',
      yearRange: yearHigh && yearLow
        ? `${yearLow.toLocaleString()} ~ ${yearHigh.toLocaleString()} ${currency}`
        : '—',
    },
    meta: {
      latestFinancialPeriod: latest?.period_date ?? null,
      latestFinancialType: latest?.period_type ?? null,
      priceDataPoints: prices?.length ?? 0,
    },
  });
}
