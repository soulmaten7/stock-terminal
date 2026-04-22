import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 정렬 가능한 컬럼 화이트리스트 (SQL injection 방지)
const SORTABLE = new Set([
  'market_cap', 'per', 'pbr', 'roe', 'operating_margin',
  'return_3m', 'return_6m', 'return_12m',
  'value_pct', 'momentum_pct', 'quality_pct', 'composite_pct',
  'dividend_yield',
]);

function num(v: string | null): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const markets = (sp.get('market') ?? 'KOSPI,KOSDAQ').split(',').filter(Boolean);
  const q = sp.get('q')?.trim() ?? '';

  // 시총
  const minCap = num(sp.get('minCap'));
  const maxCap = num(sp.get('maxCap'));

  // 재무
  const minPER = num(sp.get('minPER'));
  const maxPER = num(sp.get('maxPER'));
  const minROE = num(sp.get('minROE'));

  // 팩터 퍼센타일
  const minComposite = num(sp.get('minComposite'));
  const minMomentum = num(sp.get('minMomentum'));
  const minQuality = num(sp.get('minQuality'));
  const minValue = num(sp.get('minValue'));

  // 배당
  const minYield = num(sp.get('minYield'));
  const maxPayout = num(sp.get('maxPayout'));

  // 페이지네이션 / 정렬
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const limit = Math.min(100, Math.max(10, Number(sp.get('limit') ?? 50)));

  const orderByRaw = sp.get('orderBy') ?? 'market_cap';
  const orderBy = SORTABLE.has(orderByRaw) ? orderByRaw : 'market_cap';
  const order = sp.get('order') === 'asc' ? 'asc' : 'desc';

  const supabase = await createClient();
  let query = supabase
    .from('stock_snapshot_v')
    .select(
      [
        'symbol', 'name_ko', 'market', 'market_cap', 'sector', 'industry',
        'per', 'pbr', 'roe', 'operating_margin',
        'return_3m', 'return_6m', 'return_12m',
        'value_pct', 'momentum_pct', 'quality_pct', 'composite_pct',
        'dividend_yield', 'payout_ratio', 'dividend_per_share', 'div_fiscal_year',
      ].join(','),
      { count: 'exact' }
    )
    .eq('is_active', true)
    .eq('country', 'KR')
    .in('market', markets);

  if (q) query = query.or(`name_ko.ilike.%${q}%,symbol.ilike.${q}%`);
  if (minCap != null && minCap > 0) query = query.gte('market_cap', minCap);
  if (maxCap != null && maxCap > 0) query = query.lte('market_cap', maxCap);

  if (minPER != null) query = query.gte('per', minPER);
  if (maxPER != null) query = query.lte('per', maxPER);
  if (minROE != null) query = query.gte('roe', minROE);

  if (minComposite != null) query = query.gte('composite_pct', minComposite);
  if (minMomentum != null) query = query.gte('momentum_pct', minMomentum);
  if (minQuality != null) query = query.gte('quality_pct', minQuality);
  if (minValue != null) query = query.gte('value_pct', minValue);

  if (minYield != null) query = query.gte('dividend_yield', minYield);
  if (maxPayout != null) query = query.lte('payout_ratio', maxPayout);

  const from = (page - 1) * limit;
  query = query
    .order(orderBy, { ascending: order === 'asc', nullsFirst: false })
    .range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    stocks: data ?? [],
    total: count ?? 0,
    page,
    limit,
    orderBy,
    order,
  });
}
