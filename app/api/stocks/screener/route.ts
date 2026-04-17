import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const markets = (sp.get('market') ?? 'KOSPI,KOSDAQ').split(',').filter(Boolean);
  const q = sp.get('q')?.trim() ?? '';
  const minCap = Number(sp.get('minCap') ?? 0);
  const maxCap = Number(sp.get('maxCap') ?? 0);
  const page = Math.max(1, Number(sp.get('page') ?? 1));
  const limit = Math.min(100, Math.max(10, Number(sp.get('limit') ?? 50)));

  const supabase = await createClient();
  let query = supabase
    .from('stocks')
    .select('symbol, name_ko, market, market_cap, sector, industry', { count: 'exact' })
    .eq('is_active', true)
    .eq('country', 'KR')
    .in('market', markets);

  if (q) query = query.or(`name_ko.ilike.%${q}%,symbol.ilike.${q}%`);
  if (minCap > 0) query = query.gte('market_cap', minCap);
  if (maxCap > 0) query = query.lte('market_cap', maxCap);

  const from = (page - 1) * limit;
  query = query.order('market_cap', { ascending: false, nullsFirst: false }).range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    stocks: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
