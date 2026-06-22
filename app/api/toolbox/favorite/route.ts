import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 즐겨찾기 토글
export async function POST(req: NextRequest) {
  const { linkId, favorite } = await req.json().catch(() => ({}));
  if (!linkId || favorite === undefined) {
    return NextResponse.json({ error: 'linkId and favorite required' }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (favorite) {
    await supabase.from('link_hub_favorites').upsert(
      { user_id: user.id, link_id: linkId },
      { onConflict: 'user_id,link_id' }
    );
  } else {
    await supabase.from('link_hub_favorites').delete().eq('user_id', user.id).eq('link_id', linkId);
  }
  return NextResponse.json({ ok: true, linkId, favorite });
}

// 즐겨찾기 목록 (커스텀 순서: position 우선, 신규는 뒤)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorites: [], auth: false });

  const { data: favs } = await supabase
    .from('link_hub_favorites')
    .select('link_id, position, created_at')
    .eq('user_id', user.id)
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  const ids = (favs ?? []).map((f: { link_id: number }) => f.link_id);
  if (ids.length === 0) return NextResponse.json({ favorites: [], auth: true });

  const { data: links } = await supabase
    .from('link_hub')
    .select('id, site_name, site_url, category')
    .in('id', ids);

  type L = { id: number; site_name: string; site_url: string; category: string };
  const byId = new Map<number, L>((links ?? []).map((l: L) => [l.id, l]));
  const favorites = ids
    .map((id: number) => byId.get(id))
    .filter((l): l is L => !!l)
    .map((l) => ({ id: l.id, name: l.site_name, url: l.site_url, category: l.category }));

  return NextResponse.json({ favorites, auth: true });
}

// 드래그 순서 저장 (order = link_id 배열)
export async function PUT(req: NextRequest) {
  const { order } = await req.json().catch(() => ({}));
  if (!Array.isArray(order)) return NextResponse.json({ error: 'order array required' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await Promise.all(
    order.map((linkId: number, i: number) =>
      supabase.from('link_hub_favorites').update({ position: i }).eq('user_id', user.id).eq('link_id', linkId)
    )
  );
  return NextResponse.json({ ok: true });
}
