// 2026-04-18 세션 #15 (L) — /api/admin/partners/clicks/[id] DELETE
// partner_clicks 개별 레코드 삭제 (QA 데이터 정리용)
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
  return { ok: true as const };
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid click id' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('partner_clicks').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
