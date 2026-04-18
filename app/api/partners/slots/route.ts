import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('partner_slots')
    .select('position, partner:partners!inner(id, slug, name, logo_url, description, category, cta_text, cta_url, country, is_active, priority)')
    .eq('slot_key', key)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const partners = (data || [])
    .map((r: any) => r.partner)
    .filter((p: any) => p?.is_active)
    .sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0));

  return NextResponse.json({ key, partners });
}
