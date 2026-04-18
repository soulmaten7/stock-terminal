// 2026-04-18 세션 #15 (H) — /admin/partners/clicks API
// GET: partner_clicks 집계 (파트너/슬롯/일자별) — admin only

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ClickRow = {
  id: string | number;
  partner_id: number;
  slot_key: string | null;
  source_page: string | null;
  clicked_at: string;
};

type PartnerLite = { id: number; slug: string; name: string };

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

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const sp = req.nextUrl.searchParams;
  const partnerSlug = (sp.get('partner_slug') ?? '').trim();
  const slotKey = (sp.get('slot_key') ?? '').trim();
  const from = (sp.get('from') ?? '').trim(); // YYYY-MM-DD
  const to = (sp.get('to') ?? '').trim(); // YYYY-MM-DD

  const admin = createAdminClient();

  // 파트너 slug → id 변환
  let partnerIdFilter: number | null = null;
  if (partnerSlug) {
    const { data: p } = await admin.from('partners').select('id').eq('slug', partnerSlug).maybeSingle();
    if (!p) return NextResponse.json({ clicks: [], total: 0, bySlot: [], byPartner: [], byDay: [] });
    partnerIdFilter = (p as { id: number }).id;
  }

  // 클릭 row 가져오기
  let query = admin.from('partner_clicks').select('id, partner_id, slot_key, source_page, clicked_at').order('clicked_at', { ascending: false });
  if (partnerIdFilter !== null) query = query.eq('partner_id', partnerIdFilter);
  if (slotKey) query = query.eq('slot_key', slotKey);
  if (from) query = query.gte('clicked_at', from + 'T00:00:00Z');
  if (to) query = query.lte('clicked_at', to + 'T23:59:59Z');

  const { data, error } = await query.limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const clicks = (data ?? []) as ClickRow[];

  // 파트너 메타 메모리 조인
  const partnerIds = Array.from(new Set(clicks.map((c) => c.partner_id))).filter(Boolean);
  let partnerMap = new Map<number, PartnerLite>();
  if (partnerIds.length > 0) {
    const { data: partners } = await admin.from('partners').select('id, slug, name').in('id', partnerIds);
    (partners ?? []).forEach((p: unknown) => {
      const row = p as PartnerLite;
      partnerMap.set(row.id, row);
    });
  }

  // 리드 전환 집계 — 같은 기간/파트너의 리드 수 (CTR 대신 click→lead 전환율)
  let leadQuery = admin.from('partner_leads').select('id, partner_id, utm_medium, created_at');
  if (partnerIdFilter !== null) leadQuery = leadQuery.eq('partner_id', partnerIdFilter);
  if (from) leadQuery = leadQuery.gte('created_at', from + 'T00:00:00Z');
  if (to) leadQuery = leadQuery.lte('created_at', to + 'T23:59:59Z');
  const { data: leadsRaw } = await leadQuery.limit(5000);
  const leads = (leadsRaw ?? []) as Array<{ partner_id: number | null; utm_medium: string | null; created_at: string }>;

  // 집계: 슬롯별
  const bySlotMap = new Map<string, { slot: string; clicks: number; leads: number }>();
  clicks.forEach((c) => {
    const key = c.slot_key || '(null)';
    const row = bySlotMap.get(key) ?? { slot: key, clicks: 0, leads: 0 };
    row.clicks += 1;
    bySlotMap.set(key, row);
  });
  leads.forEach((l) => {
    const key = l.utm_medium || '(direct)';
    const row = bySlotMap.get(key);
    if (row) row.leads += 1;
    // utm_medium 이 클릭 slot_key 와 매칭되는 슬롯에만 계상 (슬롯 경유 리드만 집계)
  });
  const bySlot = Array.from(bySlotMap.values())
    .map((r) => ({ ...r, convRate: r.clicks > 0 ? r.leads / r.clicks : 0 }))
    .sort((a, b) => b.clicks - a.clicks);

  // 집계: 파트너별
  const byPartnerMap = new Map<number, { partner_id: number; slug: string; name: string; clicks: number; leads: number }>();
  clicks.forEach((c) => {
    const pmeta = partnerMap.get(c.partner_id);
    const row = byPartnerMap.get(c.partner_id) ?? {
      partner_id: c.partner_id,
      slug: pmeta?.slug ?? '(unknown)',
      name: pmeta?.name ?? '(unknown)',
      clicks: 0,
      leads: 0,
    };
    row.clicks += 1;
    byPartnerMap.set(c.partner_id, row);
  });
  leads.forEach((l) => {
    if (l.partner_id === null) return;
    const row = byPartnerMap.get(l.partner_id);
    if (row) row.leads += 1;
  });
  const byPartner = Array.from(byPartnerMap.values())
    .map((r) => ({ ...r, convRate: r.clicks > 0 ? r.leads / r.clicks : 0 }))
    .sort((a, b) => b.clicks - a.clicks);

  // 집계: 일자별 (YYYY-MM-DD, KST)
  const byDayMap = new Map<string, { date: string; clicks: number; leads: number }>();
  const dayKey = (iso: string) => {
    // KST 로 YYYY-MM-DD 추출
    const d = new Date(iso);
    const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 10);
  };
  clicks.forEach((c) => {
    const k = dayKey(c.clicked_at);
    const row = byDayMap.get(k) ?? { date: k, clicks: 0, leads: 0 };
    row.clicks += 1;
    byDayMap.set(k, row);
  });
  leads.forEach((l) => {
    const k = dayKey(l.created_at);
    const row = byDayMap.get(k) ?? { date: k, clicks: 0, leads: 0 };
    row.leads += 1;
    byDayMap.set(k, row);
  });
  const byDay = Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // 결과 (raw clicks 는 최근 100건만 — 페이지 스크롤 방지)
  const recent = clicks.slice(0, 100).map((c) => {
    const p = partnerMap.get(c.partner_id);
    return {
      id: c.id,
      partner_id: c.partner_id,
      partner_slug: p?.slug ?? null,
      partner_name: p?.name ?? null,
      slot_key: c.slot_key,
      source_page: c.source_page,
      clicked_at: c.clicked_at,
    };
  });

  return NextResponse.json({
    total: clicks.length,
    leadTotal: leads.length,
    bySlot,
    byPartner,
    byDay,
    recent,
  });
}
