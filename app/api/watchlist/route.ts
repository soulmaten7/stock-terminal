import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isActiveSymbol } from '@/lib/activeMarkets';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ watchlist: [], auth: false });

  const { data } = await supabase
    .from('watchlist')
    .select('symbol, name_ko, market, country')
    .eq('user_id', user.id)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  return NextResponse.json({ watchlist: data ?? [], auth: true });
}

export async function POST(req: NextRequest) {
  const { symbol, name_ko, market, country, add } = await req.json().catch(() => ({}));
  if (!symbol || !market || add === undefined) {
    return NextResponse.json({ error: 'symbol, market, add required' }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 심볼 패턴(=실제 시장) 기준으로 판정 — 클라가 보낸 country 필드보다 신뢰도 높음(STEP 799: JP/CN/VN/GB 신규 등록 차단).
  if (add && !isActiveSymbol(symbol)) {
    return NextResponse.json({ error: 'unsupported_market', reason: 'This market is not supported yet.' }, { status: 400 });
  }

  if (add) {
    await supabase.from('watchlist').upsert(
      { user_id: user.id, symbol, name_ko: name_ko ?? symbol, market, country: country ?? 'KR' },
      { onConflict: 'user_id,symbol,market' }
    );
  } else {
    await supabase.from('watchlist').delete()
      .eq('user_id', user.id).eq('symbol', symbol).eq('market', market);
  }
  return NextResponse.json({ ok: true, symbol, add });
}
