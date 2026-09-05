<!-- 2026-06-27 -->
# STEP 437 — [클레임 빌드 ④] owner 편집: 마이페이지 '내 업체' 탭

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_437_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
승인된(verified) 업체를 **마이페이지 '내 업체' 탭**에서 관리 — 링크(리딩방/유튜브/사이트) **추가·삭제** + **소개 편집**. 정책 반영: **1개 링크 무료, 2번째부터 유료(준비 중)**. owner 권한(verified 멤버)만 가능.

## 전제
- 최신 main + 클레임 빌드(미커밋). **새 API 2개 + 새 컴포넌트 1개 + 마이페이지 수정.** API 신규 → 클린 재시작. 커밋 보류.

---

## (1) 새 파일 — `app/api/business/mine/route.ts`
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 로그인 사용자의 verified 업체 + 소개 + 링크
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ businesses: [] }, { status: 401 });

  const admin = createAdminClient();
  const { data: members } = await admin.from("business_members").select("biz_no").eq("user_id", user.id).eq("status", "verified");
  const bizNos = [...new Set((members ?? []).map((m) => m.biz_no as string))];
  if (bizNos.length === 0) return NextResponse.json({ businesses: [] });

  const { data: fss } = await admin.from("fss_advisors").select("biz_no, company_name, representative").in("biz_no", bizNos);
  const info: Record<string, { company_name: string; representative: string | null }> = {};
  for (const f of fss ?? []) info[f.biz_no as string] = { company_name: f.company_name as string, representative: (f.representative as string) ?? null };

  const { data: listings } = await admin.from("business_listing").select("biz_no, intro").in("biz_no", bizNos);
  const introMap: Record<string, string> = {};
  for (const l of listings ?? []) introMap[l.biz_no as string] = (l.intro as string) ?? "";

  const { data: links } = await admin.from("business_links").select("id, biz_no, type, url, label, status").in("biz_no", bizNos).order("created_at", { ascending: true });
  const linksMap: Record<string, unknown[]> = {};
  for (const l of links ?? []) (linksMap[l.biz_no as string] ??= []).push(l);

  const businesses = bizNos.map((b) => ({
    biz_no: b,
    company_name: info[b]?.company_name ?? b,
    representative: info[b]?.representative ?? null,
    intro: introMap[b] ?? "",
    links: linksMap[b] ?? [],
  }));
  return NextResponse.json({ businesses });
}
```

## (2) 새 파일 — `app/api/business/manage/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_LINKS = 1; // 1개 무료 · 추가는 유료(결제 도입 시 상향)

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let body: { action?: string; biz_no?: string; type?: string; url?: string; label?: string; intro?: string; id?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const action = String(body.action ?? "");
  const biz_no = String(body.biz_no ?? "");

  const admin = createAdminClient();
  // verified owner만
  const { data: m } = await admin.from("business_members").select("id").eq("biz_no", biz_no).eq("user_id", user.id).eq("status", "verified").maybeSingle();
  if (!m) return NextResponse.json({ error: "이 업체의 인증된 담당자가 아닙니다." }, { status: 403 });

  if (action === "setIntro") {
    const intro = String(body.intro ?? "").trim().slice(0, 200);
    const { error } = await admin.from("business_listing").upsert({ biz_no, intro, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "biz_no" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "addLink") {
    const type = ["room", "youtube", "site"].includes(String(body.type)) ? String(body.type) : "site";
    const url = String(body.url ?? "").trim().slice(0, 300);
    const label = String(body.label ?? "").trim().slice(0, 60) || null;
    if (!/^https?:\/\//.test(url)) return NextResponse.json({ error: "http로 시작하는 링크를 입력해주세요." }, { status: 400 });
    const { count } = await admin.from("business_links").select("id", { count: "exact", head: true }).eq("biz_no", biz_no).eq("status", "active");
    if ((count ?? 0) >= FREE_LINKS) return NextResponse.json({ error: "1개 링크는 무료입니다. 추가 링크는 유료(준비 중)." }, { status: 402 });
    const { error } = await admin.from("business_links").insert({ biz_no, type, url, label, created_by: user.id, status: "active" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delLink") {
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ error: "bad_request" }, { status: 400 });
    const { error } = await admin.from("business_links").delete().eq("id", id).eq("biz_no", biz_no);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
```

## (3) 새 파일 — `components/business/MyBusinessClient.tsx`
```tsx
'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, Plus, ExternalLink } from 'lucide-react';

type Link = { id: string; type: string; url: string; label: string | null; status: string };
type Biz = { biz_no: string; company_name: string; representative: string | null; intro: string; links: Link[] };

const TYPE_LABEL: Record<string, string> = { room: '리딩방', youtube: '유튜브', site: '사이트' };
const FREE_LINKS = 1;

export default function MyBusinessClient() {
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/business/mine');
      const j = await r.json();
      setBusinesses(j.businesses ?? []);
    } catch { setBusinesses([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-unjong-muted">인증된 업체의 리딩방·채널 링크를 직접 관리하세요.</p>
        <a href="/business" className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white">+ 새 업체 인증</a>
      </div>
      {businesses.length === 0 ? (
        <div className="rounded-xl border border-unjong-border bg-unjong-surface p-8 text-center">
          <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요.</p>
          <a href="/business" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">업체 인증하기 →</a>
        </div>
      ) : (
        businesses.map((b) => <BizCard key={b.biz_no} biz={b} onChange={load} />)
      )}
    </div>
  );
}

function BizCard({ biz, onChange }: { biz: Biz; onChange: () => void }) {
  const [intro, setIntro] = useState(biz.intro);
  const [savingIntro, setSavingIntro] = useState(false);
  const [introMsg, setIntroMsg] = useState('');
  const [type, setType] = useState<'room' | 'youtube' | 'site'>('room');
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState('');

  const atLimit = biz.links.filter((l) => l.status === 'active').length >= FREE_LINKS;

  async function saveIntro() {
    setSavingIntro(true); setIntroMsg('');
    try {
      const r = await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setIntro', biz_no: biz.biz_no, intro }) });
      setIntroMsg(r.ok ? '저장됨' : '실패');
    } catch { setIntroMsg('실패'); }
    finally { setSavingIntro(false); }
  }
  async function addLink() {
    if (!/^https?:\/\//.test(url.trim())) { setErr('http로 시작하는 링크를 입력해주세요.'); return; }
    setAdding(true); setErr('');
    try {
      const r = await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addLink', biz_no: biz.biz_no, type, url: url.trim(), label: label.trim() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? '추가 실패');
      setUrl(''); setLabel(''); onChange();
    } catch (e) { setErr(e instanceof Error ? e.message : '추가 실패'); }
    finally { setAdding(false); }
  }
  async function delLink(id: string) {
    await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delLink', biz_no: biz.biz_no, id }) });
    onChange();
  }

  return (
    <div className="rounded-xl border border-unjong-border bg-unjong-surface p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-600" />
        <h3 className="font-bold text-unjong-primary">{biz.company_name}</h3>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600">인증됨</span>
        <span className="text-xs text-unjong-muted">{biz.biz_no}</span>
      </div>

      <label className="mb-1 block text-xs font-medium text-unjong-muted">소개</label>
      <div className="mb-1 flex gap-2">
        <textarea value={intro} onChange={(e) => { setIntro(e.target.value); setIntroMsg(''); }} rows={2} maxLength={200} placeholder="업체·리딩방 한 줄 소개" className="flex-1 resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
        <button type="button" onClick={saveIntro} disabled={savingIntro} className="shrink-0 self-start rounded-lg bg-unjong-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{savingIntro ? '저장…' : '저장'}</button>
      </div>
      {introMsg ? <p className="mb-3 text-[11px] text-emerald-600">{introMsg}</p> : <div className="mb-3" />}

      <label className="mb-1 block text-xs font-medium text-unjong-muted">링크 ({biz.links.length})</label>
      <ul className="mb-3 space-y-1.5">
        {biz.links.length === 0 ? <li className="text-xs text-unjong-muted">아직 등록된 링크가 없어요.</li> : null}
        {biz.links.map((l) => (
          <li key={l.id} className="flex items-center gap-2 rounded-lg border border-unjong-border px-3 py-2 text-sm">
            <span className="shrink-0 rounded bg-unjong-background px-1.5 py-0.5 text-[11px] font-medium text-unjong-muted">{TYPE_LABEL[l.type] ?? l.type}</span>
            <span className="min-w-0 flex-1 truncate text-unjong-primary">{l.label || l.url}</span>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-unjong-muted hover:text-unjong-accent"><ExternalLink size={14} /></a>
            <button type="button" onClick={() => delLink(l.id)} aria-label="삭제" className="shrink-0 text-unjong-muted hover:text-red-500"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>

      {atLimit ? (
        <p className="rounded-lg border border-dashed border-unjong-border px-3 py-2 text-center text-xs text-unjong-muted">1개 링크 무료 · <b className="text-unjong-primary">추가 링크는 유료</b> (준비 중)</p>
      ) : (
        <div className="space-y-2 rounded-lg border border-unjong-border bg-unjong-background p-3">
          <div className="flex gap-1">
            {(['room', 'youtube', 'site'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${type === t ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-surface'}`}>{TYPE_LABEL[t]}</button>
            ))}
          </div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="표시 이름 (선택)" className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
          {err ? <p className="text-xs text-red-500">{err}</p> : null}
          <button type="button" onClick={addLink} disabled={adding} className="flex items-center gap-1 rounded-lg bg-unjong-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><Plus size={13} /> {adding ? '추가 중…' : '링크 추가 (무료)'}</button>
        </div>
      )}
    </div>
  );
}
```

## (4) `app/mypage/page.tsx` — 4곳 (탭 추가)

### A. Tab 타입
**찾기:**
```tsx
type Tab = 'profile' | 'reports';
```
**바꾸기:**
```tsx
type Tab = 'profile' | 'reports' | 'business';
```

### B. import (아이콘 + 컴포넌트)
**찾기:**
```tsx
import { User, Siren, Trash2 } from 'lucide-react';
```
**바꾸기:**
```tsx
import { User, Siren, Trash2, Store } from 'lucide-react';
import MyBusinessClient from '@/components/business/MyBusinessClient';
```

### C. 탭 배열에 '내 업체' 추가
**찾기:**
```tsx
    { key: 'reports', label: '내 신고', icon: <Siren size={16} /> },
  ];
```
**바꾸기:**
```tsx
    { key: 'reports', label: '내 신고', icon: <Siren size={16} /> },
    { key: 'business', label: '내 업체', icon: <Store size={16} /> },
  ];
```

### D. '내 업체' 탭 렌더 (페이지 닫기 직전)
**찾기:**
```tsx
      )}
    </div>
  );
}
```
**바꾸기:**
```tsx
      )}

      {activeTab === 'business' && <MyBusinessClient />}
    </div>
  );
}
```

---

## 빌드 검증 + 클린 재시작 (새 API 라우트)
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; npm run build
```
빌드 통과해야 함. 커밋 보류.

## 확인 (사용자: `npm run dev`)
- 마이페이지 → **'내 업체' 탭** → **주식회사 이머니**(아까 승인한 verified 업체) 카드.
- **소개** 입력 → 저장 / **링크 추가**(리딩방·유튜브·사이트 + URL) → 추가됨 / 삭제 가능.
- 링크 **1개** 넣은 뒤엔 "추가 링크는 유료(준비 중)"로 바뀜(1무료 정책).
- 다음(⑤) = owner가 올린 링크를 **리딩방·검증 디렉토리에 게재**.
