import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 리딩방 즐겨찾기 토글
export async function POST(req: NextRequest) {
  const { biz_no, favorite } = await req.json().catch(() => ({}));
  if (!biz_no || favorite === undefined) return NextResponse.json({ error: 'biz_no and favorite required' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (favorite) {
    await supabase.from('room_favorites').upsert({ user_id: user.id, biz_no }, { onConflict: 'user_id,biz_no' });
  } else {
    await supabase.from('room_favorites').delete().eq('user_id', user.id).eq('biz_no', biz_no);
  }
  return NextResponse.json({ ok: true, biz_no, favorite });
}

// 내 리딩방 즐겨찾기 목록 (커스텀 순서)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ favorites: [], auth: false });

  const { data: favs } = await supabase
    .from('room_favorites')
    .select('biz_no, position, created_at')
    .eq('user_id', user.id)
    .order('position', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  const bizNos = (favs ?? []).map((f: { biz_no: string }) => f.biz_no);
  if (bizNos.length === 0) return NextResponse.json({ favorites: [], auth: true });

  const { data: rooms } = await supabase
    .from('advisor_directory')
    .select('biz_no, company_name, info_name, homepage, platform')
    .in('biz_no', bizNos);

  type R = { biz_no: string; company_name: string; info_name: string | null; homepage: string | null; platform: string };
  const byBiz = new Map<string, R>((rooms ?? []).map((r: R) => [r.biz_no, r]));
  const favorites = bizNos
    .map((b: string) => byBiz.get(b))
    .filter((r): r is R => !!r)
    .map((r) => ({ biz_no: r.biz_no, name: (r.info_name && r.info_name.trim()) || r.company_name, homepage: r.homepage, platform: r.platform }));
  return NextResponse.json({ favorites, auth: true });
}

// 드래그 순서 저장 (order = biz_no 배열)
export async function PUT(req: NextRequest) {
  const { order } = await req.json().catch(() => ({}));
  if (!Array.isArray(order)) return NextResponse.json({ error: 'order array required' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await Promise.all(
    order.map((biz_no: string, i: number) =>
      supabase.from('room_favorites').update({ position: i }).eq('user_id', user.id).eq('biz_no', biz_no)
    )
  );
  return NextResponse.json({ ok: true });
}
