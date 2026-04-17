import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(50, Number(request.nextUrl.searchParams.get('limit') ?? 20));

  if (!q) {
    return NextResponse.json({ stocks: [] });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('stocks')
    .select('symbol, name_ko, market, market_cap, sector, industry')
    .eq('is_active', true)
    .or(`name_ko.ilike.%${q}%,symbol.ilike.${q}%`)
    .order('market_cap', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ stocks: data ?? [] });
}
