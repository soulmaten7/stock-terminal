// 2026-04-18 세션 #15 (F) — /admin/partners/leads API
// GET: 리드 목록 (필터: partner_slug, from, to, q) + JSON/CSV 출력
// admin only

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LeadRow = {
  id: string | number;
  partner_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source_slug: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  consent_marketing: boolean | null;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
};

type PartnerLite = { id: number; slug: string; name: string };

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
  return { ok: true as const };
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const sp = req.nextUrl.searchParams;
  const partnerSlug = sp.get('partner_slug')?.trim() || '';
  const from = sp.get('from')?.trim() || '';
  const to = sp.get('to')?.trim() || '';
  const q = sp.get('q')?.trim() || '';
  const format = (sp.get('format') || 'json').toLowerCase();
  const limitRaw = Number(sp.get('limit'));
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 && limitRaw <= 2000 ? limitRaw : 200;
  const offsetRaw = Number(sp.get('offset'));
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;

  const admin = createAdminClient();

  // 파트너 lookup (slug → id 해석)
  let partnerFilterId: number | null = null;
  if (partnerSlug) {
    const { data: p } = await admin.from('partners').select('id').eq('slug', partnerSlug).maybeSingle();
    if (!p) return NextResponse.json({ error: `partner slug '${partnerSlug}' 찾을 수 없음` }, { status: 404 });
    partnerFilterId = (p as { id: number }).id;
  }

  let query = admin
    .from('partner_leads')
    .select('id, partner_id, name, email, phone, message, source_slug, utm_source, utm_medium, utm_campaign, consent_marketing, ip_hash, user_agent, created_at', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (partnerFilterId != null) query = query.eq('partner_id', partnerFilterId);
  if (from) query = query.gte('created_at', `${from}T00:00:00Z`);
  if (to) query = query.lte('created_at', `${to}T23:59:59Z`);
  if (q) {
    // 이름·이메일·전화·문의 본문에 대한 ilike OR 검색
    const esc = q.replace(/[%,]/g, ' ').trim();
    if (esc) {
      query = query.or(`name.ilike.%${esc}%,email.ilike.%${esc}%,phone.ilike.%${esc}%,message.ilike.%${esc}%`);
    }
  }

  const { data: leads, error, count } = await query.range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 파트너 이름 조인 (Supabase .select with FK가 때때로 RLS로 막히니 별도 조회)
  const partnerIds = Array.from(new Set((leads as LeadRow[] | null || []).map((l) => l.partner_id).filter((x): x is number => x != null)));
  let partnersMap = new Map<number, PartnerLite>();
  if (partnerIds.length > 0) {
    const { data: partners } = await admin.from('partners').select('id, slug, name').in('id', partnerIds);
    (partners as PartnerLite[] | null || []).forEach((p) => partnersMap.set(p.id, p));
  }

  const enriched = (leads as LeadRow[] | null || []).map((l) => ({
    ...l,
    partner_slug: l.partner_id != null ? partnersMap.get(l.partner_id)?.slug ?? null : null,
    partner_name: l.partner_id != null ? partnersMap.get(l.partner_id)?.name ?? null : null,
  }));

  if (format === 'csv') {
    const headers = [
      'created_at', 'partner_slug', 'partner_name', 'name', 'email', 'phone',
      'message', 'source_slug', 'utm_source', 'utm_medium', 'utm_campaign',
      'consent_marketing',
    ];
    const body = [
      headers.join(','),
      ...enriched.map((l) =>
        [
          l.created_at,
          l.partner_slug ?? '',
          l.partner_name ?? '',
          l.name,
          l.email ?? '',
          l.phone ?? '',
          l.message ?? '',
          l.source_slug ?? '',
          l.utm_source ?? '',
          l.utm_medium ?? '',
          l.utm_campaign ?? '',
          l.consent_marketing ? 'true' : 'false',
        ].map(csvEscape).join(',')
      ),
    ].join('\n');

    const fname = `partner_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    // BOM for Excel Korean compatibility
    return new NextResponse('\ufeff' + body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fname}"`,
      },
    });
  }

  return NextResponse.json({ leads: enriched, total: count ?? enriched.length, limit, offset });
}
