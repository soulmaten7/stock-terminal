import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { linkId } = await req.json().catch(() => ({}));
  if (!linkId) return NextResponse.json({ error: 'linkId required' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // insert 를 await — Node runtime 에서 응답 리턴 전에 완료 보장
  const { error } = await supabase.from('link_hub_clicks').insert({
    link_id: linkId,
    user_id: user?.id ?? null,
    referrer: req.headers.get('referer') ?? null,
    user_agent: req.headers.get('user-agent') ?? null,
  });

  // 클라이언트는 어차피 이미 새 탭으로 이동했으므로, 에러여도 200 반환 (로깅만)
  if (error) console.error('[toolbox/click] insert failed:', error.message);

  return NextResponse.json({ ok: true });
}
