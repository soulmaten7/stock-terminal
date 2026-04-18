// 2026-04-18 세션 #15 (E) — /admin/partners 최소 CRUD API
// GET: 전체 파트너 + 슬롯 매핑 반환 (admin only)
// POST: 신규 파트너 생성 + (선택) 슬롯 매핑 (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PartnerRow = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  country: string | null;
  description: string | null;
  logo_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  priority: number | null;
  is_active: boolean | null;
  features: unknown;
  created_at?: string;
};

type SlotRow = {
  slot_key: string;
  partner_id: string;
  position: number | null;
  is_active: boolean | null;
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: '로그인 필요' };

  const admin = createAdminClient();
  const { data: row } = await admin.from('users').select('role').eq('id', user.id).single();
  const role = (row as { role?: string } | null)?.role;
  if (role !== 'admin') return { ok: false as const, status: 403, error: '관리자 권한 필요' };
  return { ok: true as const, userId: user.id };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const admin = createAdminClient();
  const [{ data: partners, error: pErr }, { data: slots, error: sErr }] = await Promise.all([
    admin
      .from('partners')
      .select('id, slug, name, category, country, description, logo_url, cta_text, cta_url, priority, is_active, features, created_at')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false }),
    admin.from('partner_slots').select('slot_key, partner_id, position, is_active'),
  ]);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  const slotsByPartner = new Map<string, SlotRow[]>();
  (slots as SlotRow[] | null || []).forEach((s) => {
    const arr = slotsByPartner.get(s.partner_id) ?? [];
    arr.push(s);
    slotsByPartner.set(s.partner_id, arr);
  });

  const enriched = (partners as PartnerRow[] | null || []).map((p) => ({
    ...p,
    slots: slotsByPartner.get(p.id) ?? [],
  }));

  return NextResponse.json({ partners: enriched });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 JSON' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!slug || !name) return NextResponse.json({ error: 'slug, name 필수' }, { status: 400 });
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'slug은 영소문자/숫자/하이픈만 허용' }, { status: 400 });
  }

  // features JSON 검증 (문자열로 들어오면 파싱)
  let features: unknown = body.features ?? [];
  if (typeof features === 'string') {
    try {
      features = JSON.parse(features);
    } catch {
      return NextResponse.json({ error: 'features는 유효한 JSON이어야 함' }, { status: 400 });
    }
  }
  if (!Array.isArray(features)) {
    return NextResponse.json({ error: 'features는 배열이어야 함' }, { status: 400 });
  }

  const insertRow = {
    slug,
    name,
    category: (body.category as string | undefined) || null,
    country: (body.country as string | undefined) || 'KR',
    description: (body.description as string | undefined) || null,
    logo_url: (body.logo_url as string | undefined) || null,
    cta_text: (body.cta_text as string | undefined) || '자세히 보기',
    cta_url: (body.cta_url as string | undefined) || null,
    priority: typeof body.priority === 'number' ? body.priority : 50,
    is_active: body.is_active !== false,
    features,
  };

  const admin = createAdminClient();
  const { data: inserted, error: insErr } = await admin
    .from('partners')
    .insert(insertRow)
    .select()
    .single();

  if (insErr) {
    const msg = insErr.message.includes('duplicate') || insErr.code === '23505'
      ? `slug '${slug}' 이미 존재`
      : insErr.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 선택적 슬롯 매핑
  const slotKey = typeof body.slot_key === 'string' && body.slot_key.trim() ? body.slot_key.trim() : null;
  let slotResult: unknown = null;
  if (slotKey) {
    const position = typeof body.slot_position === 'number' ? body.slot_position : 1;
    const { data: slot, error: slotErr } = await admin
      .from('partner_slots')
      .insert({ slot_key: slotKey, partner_id: (inserted as { id: string }).id, position, is_active: true })
      .select()
      .single();
    if (slotErr) {
      // 파트너는 생성되었으나 슬롯 매핑 실패 — 경고만
      return NextResponse.json({
        partner: inserted,
        slot_warning: `슬롯 매핑 실패: ${slotErr.message}`,
      });
    }
    slotResult = slot;
  }

  return NextResponse.json({ partner: inserted, slot: slotResult });
}
