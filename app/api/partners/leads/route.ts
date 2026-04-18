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
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim();
    const phone = (body.phone ?? '').trim();
    const message = (body.message ?? '').trim();
    const sourceSlug = (body.sourceSlug ?? '').trim();
    const utmSource = (body.utmSource ?? '').trim();
    const utmMedium = (body.utmMedium ?? '').trim();
    const utmCampaign = (body.utmCampaign ?? '').trim();
    const consentMarketing = Boolean(body.consentMarketing);

    if (!name || name.length > 80) return NextResponse.json({ error: 'name required (≤80)' }, { status: 400 });
    if (!email && !phone) return NextResponse.json({ error: 'email or phone required' }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'invalid email' }, { status: 400 });
    if (phone && !/^[0-9+\-() ]{7,20}$/.test(phone)) return NextResponse.json({ error: 'invalid phone' }, { status: 400 });
    if (message.length > 1000) return NextResponse.json({ error: 'message too long' }, { status: 400 });

    const supabase = await createClient();

    let partnerId: number | null = null;
    if (sourceSlug) {
      const { data: p } = await supabase.from('partners').select('id').eq('slug', sourceSlug).eq('is_active', true).maybeSingle();
      partnerId = p?.id ?? null;
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ua = req.headers.get('user-agent') ?? null;

    const { error } = await supabase.from('partner_leads').insert({
      partner_id: partnerId,
      name, email: email || null, phone: phone || null, message: message || null,
      source_slug: sourceSlug || null,
      utm_source: utmSource || null, utm_medium: utmMedium || null, utm_campaign: utmCampaign || null,
      consent_marketing: consentMarketing,
      ip_hash: hashIp(ip), user_agent: ua,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'bad request' }, { status: 400 });
  }
}
