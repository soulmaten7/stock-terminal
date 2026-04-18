import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/stocks/compare?symbols=005930,000660,035420
 *
 * 2~5개 심볼을 받아 각 종목의 기본 정보·최신 재무 KPI·최근 6개월 일별 종가를 반환.
 * CompareTab 에서 KPI 테이블 + 정규화 퍼포먼스 라인차트 렌더용.
 */
export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get('symbols');
  if (!symbolsParam) {
    return NextResponse.json({ error: 'symbols 파라미터가 필요합니다' }, { status: 400 });
  }

  const symbols = symbolsParam
    .toUpperCase()
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length < 2) {
    return NextResponse.json(
      { error: '비교는 2개 이상 종목이 필요합니다' },
      { status: 400 }
    );
  }
  if (symbols.length > 5) {
    return NextResponse.json(
      { error: '최대 5개 종목까지 비교 가능합니다' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 1. stocks 기본 정보
  const { data: stocks } = await supabase
    .from('stocks')
    .select('id, symbol, name_ko, name_en, country, sector, industry, market_cap')
    .in('symbol', symbols);

  if (!stocks || stocks.length === 0) {
    return NextResponse.json({ error: '해당 종목을 찾을 수 없습니다' }, { status: 404 });
  }

  const stockIds = stocks.map((s: { id: string }) => s.id);

  // 2. 최신 재무 (각 stock 당 annual 우선, 없으면 quarterly 최신 1건)
  const { data: financials } = await supabase
    .from('financials')
    .select('stock_id, period_type, period_date, per, pbr, eps, bps, roe')
    .in('stock_id', stockIds)
    .order('period_date', { ascending: false });

  // 3. 최근 6개월 일별 종가
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const startDate = sixMonthsAgo.toISOString().slice(0, 10);

  const { data: prices } = await supabase
    .from('stock_prices')
    .select('stock_id, trade_date, close')
    .in('stock_id', stockIds)
    .gte('trade_date', startDate)
    .order('trade_date', { ascending: true });

  type Stock = {
    id: string;
    symbol: string;
    name_ko: string | null;
    name_en: string | null;
    country: string | null;
    sector: string | null;
    industry: string | null;
    market_cap: number | null;
  };
  type Fin = {
    stock_id: string;
    period_type: string;
    period_date: string;
    per: number | null;
    pbr: number | null;
    eps: number | null;
    bps: number | null;
    roe: number | null;
  };
  type Price = { stock_id: string; trade_date: string; close: number | null };

  const out = (stocks as Stock[]).map((s) => {
    const finForStock = ((financials as Fin[]) ?? []).filter((f) => f.stock_id === s.id);
    const latest = finForStock.find((f) => f.period_type === 'annual') ?? finForStock[0] ?? null;

    const pricesForStock = ((prices as Price[]) ?? []).filter((p) => p.stock_id === s.id);
    const latestPrice = pricesForStock[pricesForStock.length - 1]?.close ?? null;
    const firstPrice = pricesForStock[0]?.close ?? null;
    const perf6m =
      firstPrice && latestPrice && firstPrice !== 0
        ? ((latestPrice - firstPrice) / firstPrice) * 100
        : null;

    const roeValue =
      latest?.roe != null
        ? latest.roe
        : latest?.eps != null && latest?.bps != null && latest.bps !== 0
        ? (latest.eps / latest.bps) * 100
        : null;

    return {
      symbol: s.symbol,
      name: s.name_ko ?? s.name_en ?? s.symbol,
      sector: s.sector,
      industry: s.industry,
      country: s.country,
      marketCap: s.market_cap,
      kpis: {
        per: latest?.per ?? null,
        pbr: latest?.pbr ?? null,
        eps: latest?.eps ?? null,
        bps: latest?.bps ?? null,
        roe: roeValue,
      },
      price: {
        current: latestPrice,
        perf6m,
      },
      history: pricesForStock.map((p) => ({
        date: p.trade_date,
        close: p.close,
      })),
      meta: {
        latestFinancialPeriod: latest?.period_date ?? null,
        latestFinancialType: latest?.period_type ?? null,
        pricePoints: pricesForStock.length,
      },
    };
  });

  // 요청 순서 유지
  const ordered = symbols
    .map((sym) => out.find((s) => s.symbol === sym))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const notFound = symbols.filter((sym) => !ordered.find((s) => s.symbol === sym));

  return NextResponse.json({
    stocks: ordered,
    notFound,
    meta: {
      requested: symbols,
      found: ordered.length,
      dataStart: startDate,
    },
  });
}
