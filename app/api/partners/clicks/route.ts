import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hashIp(ip: string | null) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip + (process.env.IP_HASH_SALT || 'stock-terminal-v3')).digest('hex').slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const partnerSlug = (body.slug ?? '').trim();
    const slotKey = body.slotKey ?? null;
    const sourcePage = body.sourcePage ?? null;
    if (!partnerSlug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

    const supabase = await createClient();
    const { data: p } = await supabase.from('partners').select('id').eq('slug', partnerSlug).eq('is_active', true).maybeSingle();
    if (!p) return NextResponse.json({ ok: true });

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ua = req.headers.get('user-agent') ?? null;

    await supabase.from('partner_clicks').insert({
      partner_id: p.id,
      slot_key: slotKey, source_page: sourcePage,
      ip_hash: hashIp(ip), user_agent: ua,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
