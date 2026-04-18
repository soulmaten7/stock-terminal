// 2026-04-18 세션 #15 (I) — /admin/partners/[id] PATCH + DELETE
// Partner 편집 (부분 필드) + 완전 삭제 (CASCADE: slots/clicks 제거, leads.partner_id=null)
// admin only

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

const SLUG_RE = /^[a-z0-9-]+$/;

type UpdatePayload = {
  slug?: string;
  name?: string;
  category?: string | null;
  country?: string | null;
  description?: string | null;
  logo_url?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  priority?: number;
  is_active?: boolean;
  features?: unknown;
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid partner id' }, { status: 400 });
  }

  let body: UpdatePayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (body.slug !== undefined) {
    const v = String(body.slug).trim();
    if (!SLUG_RE.test(v)) {
      return NextResponse.json({ error: 'slug는 소문자/숫자/하이픈만 허용' }, { status: 400 });
    }
    patch.slug = v;
  }
  if (body.name !== undefined) {
    const v = String(body.name).trim();
    if (!v) return NextResponse.json({ error: 'name 필수' }, { status: 400 });
    patch.name = v;
  }
  if (body.category !== undefined) patch.category = body.category || null;
  if (body.country !== undefined) patch.country = body.country || null;
  if (body.description !== undefined) patch.description = body.description || null;
  if (body.logo_url !== undefined) patch.logo_url = body.logo_url || null;
  if (body.cta_text !== undefined) patch.cta_text = body.cta_text || null;
  if (body.cta_url !== undefined) patch.cta_url = body.cta_url || null;
  if (body.priority !== undefined) {
    const n = Number(body.priority);
    if (!Number.isFinite(n)) return NextResponse.json({ error: 'priority 숫자여야' }, { status: 400 });
    patch.priority = n;
  }
  if (body.is_active !== undefined) patch.is_active = Boolean(body.is_active);
  if (body.features !== undefined) {
    // features: 이미 JSON 객체 또는 문자열 모두 허용
    let parsed: unknown = body.features;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return NextResponse.json({ error: 'features JSON 파싱 실패' }, { status: 400 });
      }
    }
    if (parsed !== null && !Array.isArray(parsed)) {
      return NextResponse.json({ error: 'features는 배열 또는 null 여야' }, { status: 400 });
    }
    patch.features = parsed;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: '수정할 필드 없음' }, { status: 400 });
  }
  patch.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('partners')
    .update(patch)
    .eq('id', id)
    .select('id, slug, name, category, country, description, logo_url, cta_text, cta_url, priority, is_active, features, created_at, updated_at')
    .single();

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json({ error: '같은 slug의 파트너가 이미 존재합니다' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({ partner: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid partner id' }, { status: 400 });
  }

  const admin = createAdminClient();
  // partner_slots / partner_clicks 는 ON DELETE CASCADE 로 자동 정리
  // partner_leads 는 ON DELETE SET NULL 로 보존됨 (리드 로그 유지)
  const { error } = await admin.from('partners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
