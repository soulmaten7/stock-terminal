import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id');
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: alerts } = await supabase.from('alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  const { data: history } = await supabase.from('alert_history').select('*').eq('user_id', userId).eq('is_read', false).order('created_at', { ascending: false }).limit(20);

  return NextResponse.json({ alerts: alerts || [], unread: history || [] });
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, type, condition, target } = await request.json();
    if (!user_id || !type || !condition) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: existing } = await supabase.from('alerts').select('id').eq('user_id', user_id);
    const { data: user } = await supabase.from('users').select('role').eq('id', user_id).single();
    const role = (user as { role: string } | null)?.role || 'free';
    const limit = role === 'pro' || role === 'admin' ? 999 : 3;

    if ((existing?.length || 0) >= limit) {
      return NextResponse.json({ error: `알림은 최대 ${limit}개까지 설정할 수 있습니다. Pro 플랜으로 업그레이드하세요.` }, { status: 400 });
    }

    const { data } = await supabase.from('alerts').insert({ user_id, type, condition, target }).select().single();
    return NextResponse.json({ alert: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const supabase = createAdminClient();
  await supabase.from('alerts').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
