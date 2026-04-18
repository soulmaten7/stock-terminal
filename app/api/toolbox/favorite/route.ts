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
