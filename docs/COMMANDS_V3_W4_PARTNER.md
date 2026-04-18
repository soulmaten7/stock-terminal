# W4 — Partner-Agnostic Landing 구현

## 목표
스펙 §10 "Phase 1 W4" 기반 Partner-Agnostic Lead Gen 수익 인프라 구축
- `/partner/[slug]` 동적 랜딩 페이지 + 리드 폼
- `partners` / `partner_slots` / `partner_leads` / `partner_clicks` 4개 테이블
- `<PartnerSlot>` 서버 컴포넌트 → 기존 홈/toolbox 의 `data-slot="..."` placeholder 실제 렌더
- `test` 파트너 1건 seed → `/partner/test` 로 E2E 검증
- 관리자 CRUD UI는 Phase 2 (MVP는 Supabase Studio + SQL seed로 해결)

## 범위 제외
- `/admin/partners` CRUD 페이지 (Phase 2)
- 리드 품질 스코어 / UTM 리포트 대시보드 (Phase 2)
- 리드 이메일 알림 (Phase 2)
- `data-slot="ticker-*"` 같은 마이크로 슬롯은 이번 MVP에서 제외 — 큰 슬롯 2곳만 (home-row3-left, toolbox-category-brokers)

---

## STEP 0 — 기존 슬롯 placeholder 파악
홈/toolbox 안에 이미 존재하는 `data-slot=` 또는 "Partner Slot" 텍스트 위치 파악 후 교체 계획 확정:

```bash
grep -rn "data-slot\|Partner Slot\|PARTNER SLOT" app/ components/ --include="*.tsx" --include="*.ts" | head -30
```

→ 결과를 근거로 STEP 5 에서 정확히 교체할 위치 결정.

## STEP 1 — DB 마이그레이션

파일: `supabase/migrations/010_partners.sql` 신규 생성.

```sql
-- =============== partners: 파트너 기본 정보 ===============
CREATE TABLE IF NOT EXISTS public.partners (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  hero_image_url TEXT,
  description TEXT,
  category TEXT,                      -- 증권사 / 자산운용 / 은행 / 크립토 / 리서치 / etc
  cta_text TEXT DEFAULT '자세히 보기',
  cta_url TEXT,                       -- 외부 파트너 랜딩 URL (null 이면 내부 폼 전용)
  features JSONB,                     -- [{title, description}]
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,             -- 슬롯 내 정렬 (높을수록 우선)
  country TEXT,                       -- KR / US / GLOBAL
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_slug_active ON public.partners(slug) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_partners_country_active ON public.partners(country) WHERE is_active;

-- =============== partner_slots: 슬롯 키 → 파트너 매핑 ===============
CREATE TABLE IF NOT EXISTS public.partner_slots (
  id BIGSERIAL PRIMARY KEY,
  slot_key TEXT NOT NULL,             -- home-row3-left, toolbox-category-brokers, ...
  partner_id BIGINT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slot_key, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_slots_key_active ON public.partner_slots(slot_key, position) WHERE is_active;

-- =============== partner_leads: 리드 수집 ===============
CREATE TABLE IF NOT EXISTS public.partner_leads (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT REFERENCES public.partners(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT,
  source_slug TEXT,                   -- 방문자가 본 /partner/[slug]
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  consent_marketing BOOLEAN DEFAULT false,
  ip_hash TEXT,                       -- sha256 해시 (raw IP 저장 금지)
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_leads_partner_created ON public.partner_leads(partner_id, created_at DESC);

-- =============== partner_clicks: 클릭 추적 ===============
CREATE TABLE IF NOT EXISTS public.partner_clicks (
  id BIGSERIAL PRIMARY KEY,
  partner_id BIGINT NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  slot_key TEXT,                      -- null 이면 직접 /partner/[slug] 진입
  source_page TEXT,                   -- referer 경로 (예: /, /toolbox)
  ip_hash TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_clicks_partner_time ON public.partner_clicks(partner_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_slot_time ON public.partner_clicks(slot_key, clicked_at DESC);

-- =============== RLS ===============
ALTER TABLE public.partners        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_slots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_leads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_clicks  ENABLE ROW LEVEL SECURITY;

-- partners: is_active 만 읽기 공개, write 는 service_role
DROP POLICY IF EXISTS "partners_read_active" ON public.partners;
CREATE POLICY "partners_read_active"   ON public.partners      FOR SELECT USING (is_active);
DROP POLICY IF EXISTS "partners_service_all" ON public.partners;
CREATE POLICY "partners_service_all"   ON public.partners      FOR ALL TO service_role USING (true) WITH CHECK (true);

-- partner_slots: is_active 만 읽기 공개, write 는 service_role
DROP POLICY IF EXISTS "slots_read_active" ON public.partner_slots;
CREATE POLICY "slots_read_active"      ON public.partner_slots FOR SELECT USING (is_active);
DROP POLICY IF EXISTS "slots_service_all" ON public.partner_slots;
CREATE POLICY "slots_service_all"      ON public.partner_slots FOR ALL TO service_role USING (true) WITH CHECK (true);

-- partner_leads: 누구나 insert (anon 포함), select 는 service_role 만
DROP POLICY IF EXISTS "leads_insert_any" ON public.partner_leads;
CREATE POLICY "leads_insert_any"       ON public.partner_leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "leads_service_select" ON public.partner_leads;
CREATE POLICY "leads_service_select"   ON public.partner_leads FOR SELECT TO service_role USING (true);

-- partner_clicks: 누구나 insert, select 는 service_role 만
DROP POLICY IF EXISTS "clicks_insert_any" ON public.partner_clicks;
CREATE POLICY "clicks_insert_any"      ON public.partner_clicks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "clicks_service_select" ON public.partner_clicks;
CREATE POLICY "clicks_service_select"  ON public.partner_clicks FOR SELECT TO service_role USING (true);

-- =============== Test 파트너 seed ===============
INSERT INTO public.partners (slug, name, logo_url, description, category, cta_text, features, is_active, priority, country) VALUES
('test', '테스트 증권', 'https://placehold.co/240x80/0ABAB5/white?text=TEST+Securities',
 '국내 주식 수수료 업계 최저 + AI 기반 실시간 리서치 무료 제공',
 '증권사', '계좌 개설 문의하기',
 '[
    {"title":"수수료 0.015%","description":"국내 주식 거래 수수료 업계 최저 수준"},
    {"title":"AI 리서치 무료","description":"AI가 종목 분석 리포트를 매일 발행"},
    {"title":"24시간 상담","description":"카카오톡 · 전화 · 이메일 채널 지원"}
  ]'::jsonb,
 true, 100, 'KR')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  priority = EXCLUDED.priority,
  updated_at = now();

-- 슬롯 배치 (test 파트너 → 홈 Row3 좌측 + toolbox 증권사 카테고리 상단)
WITH p AS (SELECT id FROM public.partners WHERE slug='test')
INSERT INTO public.partner_slots (slot_key, partner_id, position, is_active)
SELECT 'home-row3-left', p.id, 1, true FROM p
ON CONFLICT (slot_key, partner_id) DO NOTHING;

WITH p AS (SELECT id FROM public.partners WHERE slug='test')
INSERT INTO public.partner_slots (slot_key, partner_id, position, is_active)
SELECT 'toolbox-category-brokers', p.id, 1, true FROM p
ON CONFLICT (slot_key, partner_id) DO NOTHING;
```

적용:

```bash
cat supabase/migrations/010_partners.sql | python3 scripts/sql-exec.py
```

확인:

```bash
echo "SELECT slug, name, is_active FROM public.partners; SELECT slot_key, partner_id, is_active FROM public.partner_slots;" | python3 scripts/sql-exec.py
```

기대: partners 1건, partner_slots 2건.

---

## STEP 2 — 백엔드 API (4개)

### 2-1. `app/api/partners/[slug]/route.ts` — 파트너 상세 조회

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('partners')
    .select('id, slug, name, logo_url, hero_image_url, description, category, cta_text, cta_url, features, country')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ partner: data });
}
```

### 2-2. `app/api/partners/slots/route.ts` — 슬롯 키별 파트너 리스트

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from('partner_slots')
    .select('position, partner:partners!inner(id, slug, name, logo_url, description, category, cta_text, cta_url, country, is_active, priority)')
    .eq('slot_key', key)
    .eq('is_active', true)
    .order('position', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // is_active 파트너만 필터 + priority desc
  const partners = (data || [])
    .map((r: any) => r.partner)
    .filter((p: any) => p?.is_active)
    .sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0));

  return NextResponse.json({ key, partners });
}
```

### 2-3. `app/api/partners/leads/route.ts` — 리드 생성

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
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

    const supabase = await createServerClient();

    // partner_id 조회 (source_slug 우선, 없으면 null)
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
```

### 2-4. `app/api/partners/clicks/route.ts` — 클릭 추적 (fire-and-forget)

```ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
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
    const slotKey = (body.slotKey ?? null);
    const sourcePage = (body.sourcePage ?? null);
    if (!partnerSlug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

    const supabase = await createServerClient();
    const { data: p } = await supabase.from('partners').select('id').eq('slug', partnerSlug).eq('is_active', true).maybeSingle();
    if (!p) return NextResponse.json({ ok: true }); // 조용히 무시 (스팸 방지)

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ua = req.headers.get('user-agent') ?? null;

    await supabase.from('partner_clicks').insert({
      partner_id: p.id,
      slot_key: slotKey, source_page: sourcePage,
      ip_hash: hashIp(ip), user_agent: ua,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // fire-and-forget — 절대 실패 안 함
  }
}
```

---

## STEP 3 — `/partner/[slug]` 랜딩 페이지

### 3-1. `app/partner/[slug]/page.tsx` (Server Component)

```tsx
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import PartnerLandingClient from '@/components/partners/PartnerLandingClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function PartnerLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createServerClient();
  const { data: partner } = await supabase
    .from('partners')
    .select('slug, name, logo_url, hero_image_url, description, category, cta_text, cta_url, features, country')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!partner) notFound();

  const utm = {
    source: String(sp.utm_source ?? ''),
    medium: String(sp.utm_medium ?? ''),
    campaign: String(sp.utm_campaign ?? ''),
  };

  return <PartnerLandingClient partner={partner} utm={utm} />;
}
```

### 3-2. `components/partners/PartnerLandingClient.tsx` (Client)

```tsx
'use client';

import { useState } from 'react';

type Feature = { title: string; description: string };
type Partner = {
  slug: string;
  name: string;
  logo_url?: string | null;
  hero_image_url?: string | null;
  description?: string | null;
  category?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  features?: Feature[] | null;
};

export default function PartnerLandingClient({
  partner,
  utm,
}: {
  partner: Partner;
  utm: { source: string; medium: string; campaign: string };
}) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', consent: false });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setStatus('idle'); setErrMsg('');
    try {
      const r = await fetch('/api/partners/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, message: form.message,
          consentMarketing: form.consent,
          sourceSlug: partner.slug,
          utmSource: utm.source, utmMedium: utm.medium, utmCampaign: utm.campaign,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      setStatus('ok');
      setForm({ name: '', email: '', phone: '', message: '', consent: false });
    } catch (e: any) {
      setStatus('err'); setErrMsg(e?.message || '전송 실패');
    } finally {
      setLoading(false);
    }
  };

  const features = Array.isArray(partner.features) ? partner.features : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-4">
          {partner.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.logo_url} alt={partner.name} className="h-14 w-auto object-contain" />
          )}
          {partner.category && (
            <span className="text-xs font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-1 rounded">
              {partner.category}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-black mb-3">{partner.name}</h1>
        {partner.description && (
          <p className="text-base text-[#555555] leading-relaxed max-w-2xl">{partner.description}</p>
        )}
      </section>

      {/* Features */}
      {features.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-8 border-t border-[#E5E7EB]">
          <h2 className="text-lg font-bold text-black mb-6">핵심 혜택</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="border border-[#E5E7EB] rounded-xl p-5 bg-white">
                <h3 className="text-sm font-bold text-[#0ABAB5] mb-2">{f.title}</h3>
                <p className="text-sm text-[#555555] leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lead Form */}
      <section className="max-w-2xl mx-auto px-4 py-12 border-t border-[#E5E7EB]">
        <h2 className="text-xl font-bold text-black mb-2">{partner.cta_text || '상담 신청'}</h2>
        <p className="text-sm text-[#666666] mb-6">
          아래 정보를 남겨주시면 {partner.name} 담당자가 영업일 기준 1~2일 이내 연락드립니다.
        </p>

        {status === 'ok' ? (
          <div className="border border-[#0ABAB5] bg-[#0ABAB5]/10 rounded-lg p-6 text-center">
            <p className="text-base font-bold text-[#0ABAB5] mb-1">신청 완료</p>
            <p className="text-sm text-[#555555]">담당자가 곧 연락드립니다. 감사합니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">이름 *</label>
              <input
                type="text" required maxLength={80}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#0ABAB5]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">이메일</label>
                <input
                  type="email" maxLength={120}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#0ABAB5]"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">전화</label>
                <input
                  type="tel" maxLength={20}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#0ABAB5]"
                />
              </div>
            </div>
            <p className="text-xs text-[#999999]">이메일 또는 전화 중 하나 이상 입력</p>
            <div>
              <label className="block text-sm font-bold text-black mb-1">문의 내용</label>
              <textarea
                maxLength={1000} rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-[#0ABAB5] resize-none"
              />
            </div>
            <label className="flex items-start gap-2 text-xs text-[#666666]">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                className="mt-0.5"
              />
              <span>개인정보 수집·이용 및 마케팅 정보 수신에 동의합니다. (선택 사항이나, 상담 진행을 위해 필요)</span>
            </label>
            {status === 'err' && (
              <p className="text-sm text-[#FF3B30]">{errMsg}</p>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full bg-[#0ABAB5] hover:bg-[#099b96] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? '전송 중...' : (partner.cta_text || '상담 신청')}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
```

---

## STEP 4 — `<PartnerSlot>` 서버 컴포넌트

### 4-1. `components/partners/PartnerSlot.tsx` (Server Component)

```tsx
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';

type Partner = {
  id: number;
  slug: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  category?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
};

export default async function PartnerSlot({
  slotKey,
  className = '',
  variant = 'card',
}: {
  slotKey: string;
  className?: string;
  variant?: 'card' | 'compact';
}) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from('partner_slots')
    .select('position, partner:partners!inner(id, slug, name, logo_url, description, category, cta_text, cta_url, is_active, priority)')
    .eq('slot_key', slotKey)
    .eq('is_active', true)
    .order('position', { ascending: true })
    .limit(1);

  const row = (data || [])[0] as any;
  const partner = row?.partner as Partner | undefined;
  if (!partner) return null;

  const href = `/partner/${partner.slug}?utm_source=slot&utm_medium=${encodeURIComponent(slotKey)}`;

  if (variant === 'compact') {
    return (
      <Link href={href} className={`block border border-[#E5E7EB] hover:border-[#0ABAB5] rounded-lg p-3 bg-white transition-colors ${className}`}>
        <div className="flex items-center gap-3">
          {partner.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.logo_url} alt={partner.name} className="h-8 w-auto object-contain" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black truncate">{partner.name}</p>
            {partner.description && (
              <p className="text-xs text-[#666666] truncate">{partner.description}</p>
            )}
          </div>
          <span className="text-xs text-[#0ABAB5] font-bold flex-shrink-0">→</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`block border border-[#E5E7EB] hover:border-[#0ABAB5] rounded-xl p-5 bg-white transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {partner.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.logo_url} alt={partner.name} className="h-10 w-auto object-contain" />
        )}
        <span className="text-[10px] text-[#999999] font-bold flex-shrink-0">AD</span>
      </div>
      <h3 className="text-base font-bold text-black mb-1">{partner.name}</h3>
      {partner.description && (
        <p className="text-sm text-[#555555] leading-relaxed mb-3 line-clamp-3">{partner.description}</p>
      )}
      <span className="inline-block text-xs font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-3 py-1 rounded">
        {partner.cta_text || '자세히 보기'} →
      </span>
    </Link>
  );
}
```

---

## STEP 5 — 기존 placeholder 교체 (2곳)

### 5-1. 홈 Row3 좌측 `home-row3-left`
- STEP 0 grep 결과로 정확한 파일/위치 확인 후
- 기존 dashed placeholder div (예: `<div data-slot="home-row3-left">Partner Slot</div>`) 자리에
  ```tsx
  import PartnerSlot from '@/components/partners/PartnerSlot';
  ...
  <PartnerSlot slotKey="home-row3-left" />
  ```
- 만약 placeholder 가 이미 컴포넌트 (PartnerSlotPlaceholder 등) 로 추상화돼 있으면 그 내부를 `<PartnerSlot>` 로 교체

### 5-2. Toolbox 증권사 카테고리 `toolbox-category-brokers`
- `components/toolbox/CategorySection.tsx` 에 이미 있는 `PartnerSlotPlaceholder` 교체
- 카테고리 slug 가 `brokers` 인 경우만 렌더 (나머지 카테고리는 그대로 placeholder 유지 — Phase 2에서 채움)
- 조건부 렌더 예:
  ```tsx
  {slug === 'brokers' ? (
    <PartnerSlot slotKey={`toolbox-category-${slug}`} variant="compact" className="mb-3" />
  ) : (
    <div className="mb-3 border border-dashed border-[#E5E7EB] rounded-lg p-4 text-center text-xs text-[#999999]">
      Partner Slot — W4 구현 예정
    </div>
  )}
  ```

---

## STEP 6 — 빌드 + E2E 확인

```bash
npm run build
```

기대: 에러 0, `/partner/[slug]` 동적 라우트 컴파일, API 4개 등록.

```bash
# /partner/test 200 OK 확인
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3333/partner/test
# → 200

# 리드 POST 테스트
curl -s -X POST http://localhost:3333/api/partners/leads \
  -H "content-type: application/json" \
  -d '{"name":"테스트","email":"test@example.com","sourceSlug":"test","consentMarketing":true}' | jq
# → {"ok":true}

# DB 확인
echo "SELECT name, email, source_slug, created_at FROM public.partner_leads ORDER BY id DESC LIMIT 3;" | python3 scripts/sql-exec.py

# 슬롯 API
curl -s "http://localhost:3333/api/partners/slots?key=home-row3-left" | jq '.partners | length'
# → 1

# /partner/존재하지않음 → 404
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3333/partner/does-not-exist
# → 404
```

---

## STEP 7 — 대기 (Cowork Chrome MCP 검증)

검증 체크리스트:
- `/partner/test` → Hero + 3개 Features 카드 + 리드 폼 정상 렌더
- 폼에 이름/이메일 입력 후 제출 → "신청 완료" 상태 전환
- DB `partner_leads` 1건 새로 생성 확인
- 홈 Row3 좌측에 `<PartnerSlot>` 카드 (테스트 증권 로고 + 설명 + CTA) 렌더
- `/toolbox` 에서 "증권사" 또는 카테고리 slug=`brokers` 인 섹션 상단에 compact PartnerSlot 렌더
- 슬롯 카드 클릭 → `/partner/test?utm_source=slot&utm_medium=home-row3-left` 이동
- 콘솔 에러 0

---

## STEP 8 — git commit

```bash
git add supabase/migrations/010_partners.sql \
        app/partner \
        app/api/partners \
        components/partners \
        docs/COMMANDS_V3_W4_PARTNER.md \
        (수정된 홈/toolbox 컴포넌트들)

git commit -m "$(cat <<'EOF'
feat(W4): Partner-Agnostic Landing 인프라 구축

- DB 4테이블: partners / partner_slots / partner_leads / partner_clicks + RLS
- /partner/[slug] 동적 랜딩 + 리드 폼 + UTM 수집
- API 4개: slug 조회 / slots 조회 / leads POST / clicks POST
- PartnerSlot 서버 컴포넌트 (card / compact variant) + IP 해시 처리
- test 파트너 seed + 홈/toolbox 2개 슬롯 배치
- RLS: 누구나 leads/clicks insert, 조회는 service_role 만

Phase 2로 연기: /admin/partners CRUD UI, 리드 품질 스코어, 이메일 알림
EOF
)"
```

push 는 Cowork 검증 후.

---

## 참고 — 슬롯 키 규칙 (Phase 2 이후 확장용)

- `home-row<N>-<position>` — 홈 Bento Grid
- `toolbox-category-<slug>` — 도구함 카테고리 상단
- `stock-detail-<tab>` — 종목 상세 탭별
- `compare-result` — 비교 탭 결과 하단
- `news-sidebar` — 뉴스 탭 사이드바
