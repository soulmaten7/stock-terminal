import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

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
    await supabase.from('link_hub_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('link_id', linkId);
  }

  return NextResponse.json({ ok: true, linkId, favorite });
}

// 헤더 즐겨찾기 드롭다운 — 로그인 유저가 별표한 링크 목록
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorites: [], auth: false });

  const { data: favs } = await supabase
    .from('link_hub_favorites')
    .select('link_id')
    .eq('user_id', user.id);
  const ids = (favs ?? []).map((f: { link_id: number }) => f.link_id);
  if (ids.length === 0) return NextResponse.json({ favorites: [], auth: true });

  const { data: links } = await supabase
    .from('link_hub')
    .select('id, site_name, site_url, category')
    .in('id', ids);

  const favorites = (links ?? []).map((l: { id: number; site_name: string; site_url: string; category: string }) => ({
    id: l.id, name: l.site_name, url: l.site_url, category: l.category,
  }));
  return NextResponse.json({ favorites, auth: true });
}
