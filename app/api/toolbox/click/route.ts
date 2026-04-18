import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { linkId } = await req.json().catch(() => ({}));
  if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // fire-and-forget — 실패해도 200 반환
  void supabase.from('link_hub_clicks').insert({
    link_id: linkId,
    user_id: user?.id ?? null,
    referrer: req.headers.get('referer') ?? null,
    user_agent: req.headers.get('user-agent') ?? null,
  });

  return NextResponse.json({ ok: true });
}
