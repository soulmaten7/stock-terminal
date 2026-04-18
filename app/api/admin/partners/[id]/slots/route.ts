// 2026-04-18 세션 #15 (I) — /admin/partners/[id]/slots POST + DELETE
// 파트너별 슬롯 매핑 추가/제거 (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: '로그인 필요' };
  const admin = createAdminClient();
  const { data: row } = await admin.from('users').select('role').eq('id', user.id).single();
  const role = (row as { role?: string } | null)?.role;
  if (role !== 'admin') return { ok: false as const, status: 403, error: '관리자 권한 필요' };
  return { ok: true as const, userId: user.id };
}

const SLOT_KEY_RE = /^[a-z0-9-]+$/;

// POST body: { slot_key: string, position?: number, is_active?: boolean }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id: idStr } = await params;
  const partnerId = Number(idStr);
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return NextResponse.json({ error: 'invalid partner id' }, { status: 400 });
  }

  let body: { slot_key?: string; position?: number; is_active?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const slotKey = typeof body.slot_key === 'string' ? body.slot_key.trim() : '';
  if (!slotKey || !SLOT_KEY_RE.test(slotKey)) {
    return NextResponse.json({ error: 'slot_key는 소문자/숫자/하이픈만 허용' }, { status: 400 });
  }
  const position = typeof body.position === 'number' && Number.isFinite(body.position) ? body.position : 1;
  const isActive = body.is_active !== false;

  const admin = createAdminClient();
  // 파트너 존재 확인
  const { data: partner } = await admin.from('partners').select('id').eq('id', partnerId).single();
  if (!partner) return NextResponse.json({ error: 'partner not found' }, { status: 404 });

  const { data, error } = await admin
    .from('partner_slots')
    .insert({ slot_key: slotKey, partner_id: partnerId, position, is_active: isActive })
    .select('id, slot_key, partner_id, position, is_active, created_at')
    .single();

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: '이미 매핑된 슬롯입니다' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ slot: data });
}

// DELETE ?slot_key=xxx  또는  ?slot_id=NNN
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id: idStr } = await params;
  const partnerId = Number(idStr);
  if (!Number.isInteger(partnerId) || partnerId <= 0) {
    return NextResponse.json({ error: 'invalid partner id' }, { status: 400 });
  }

  const url = new URL(req.url);
  const slotKey = url.searchParams.get('slot_key');
  const slotIdStr = url.searchParams.get('slot_id');

  const admin = createAdminClient();
  let q = admin.from('partner_slots').delete().eq('partner_id', partnerId);
  if (slotIdStr) {
    const slotId = Number(slotIdStr);
    if (!Number.isInteger(slotId) || slotId <= 0) {
      return NextResponse.json({ error: 'invalid slot_id' }, { status: 400 });
    }
    q = q.eq('id', slotId);
  } else if (slotKey) {
    if (!SLOT_KEY_RE.test(slotKey)) {
      return NextResponse.json({ error: 'invalid slot_key' }, { status: 400 });
    }
    q = q.eq('slot_key', slotKey);
  } else {
    return NextResponse.json({ error: 'slot_key 또는 slot_id 필요' }, { status: 400 });
  }

  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
