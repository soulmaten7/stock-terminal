<!-- 2026-06-27 -->
# STEP 438 — [클레임 빌드 ④-b] 링크추가(유료) 버튼 + 관리자 공유(위임 1명)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_438_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
'내 업체' 카드에 ① **'+ 링크 추가 (유료)' 버튼**(누르면 "결제 준비 중" — 결제 도입 시 결제창 연결) ② **관리자 공유**(owner가 이메일로 매니저 1명 초대 = 위임). 매니저는 소개·링크 관리 가능, 관리자 추가는 owner만.
- `business_members.email` 컬럼은 Cowork이 MCP로 이미 추가.

## 전제
- 최신 main + ④(미커밋). **API 2개 교체 + 컴포넌트 1개 교체.** API 변경 → 클린 재시작. 커밋 보류.

---

## (1) `app/api/business/mine/route.ts` — 전체 교체 (myRole + managers 추가)
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ businesses: [] }, { status: 401 });

  const admin = createAdminClient();
  const { data: members } = await admin.from("business_members").select("biz_no, role").eq("user_id", user.id).eq("status", "verified");
  const myRole: Record<string, string> = {};
  const bizNos: string[] = [];
  for (const m of members ?? []) { const b = m.biz_no as string; myRole[b] = m.role as string; if (!bizNos.includes(b)) bizNos.push(b); }
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

  const { data: mgrs } = await admin.from("business_members").select("id, biz_no, email, status").in("biz_no", bizNos).eq("role", "manager");
  const mgrMap: Record<string, unknown[]> = {};
  for (const m of mgrs ?? []) (mgrMap[m.biz_no as string] ??= []).push({ id: m.id, email: (m.email as string) ?? "", status: m.status });

  const businesses = bizNos.map((b) => ({
    biz_no: b,
    company_name: info[b]?.company_name ?? b,
    representative: info[b]?.representative ?? null,
    intro: introMap[b] ?? "",
    links: linksMap[b] ?? [],
    myRole: myRole[b],
    managers: mgrMap[b] ?? [],
  }));
  return NextResponse.json({ businesses });
}
```

## (2) `app/api/business/manage/route.ts` — 전체 교체 (addManager/removeManager 추가)
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MANAGERS = 1;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let body: { action?: string; biz_no?: string; type?: string; url?: string; label?: string; intro?: string; id?: string; email?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const action = String(body.action ?? "");
  const biz_no = String(body.biz_no ?? "");

  const admin = createAdminClient();
  const { data: me } = await admin.from("business_members").select("role").eq("biz_no", biz_no).eq("user_id", user.id).eq("status", "verified").maybeSingle();
  if (!me) return NextResponse.json({ error: "이 업체의 인증된 담당자가 아닙니다." }, { status: 403 });
  const isOwner = me.role === "owner";

  if (action === "setIntro") {
    const intro = String(body.intro ?? "").trim().slice(0, 200);
    const { error } = await admin.from("business_listing").upsert({ biz_no, intro, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "biz_no" });
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

  // 결제 성공 후 호출 (현재 UI 미사용 — 결제 도입 시 연결)
  if (action === "addLink") {
    const type = ["room", "youtube", "site"].includes(String(body.type)) ? String(body.type) : "site";
    const url = String(body.url ?? "").trim().slice(0, 300);
    const label = String(body.label ?? "").trim().slice(0, 60) || null;
    if (!/^https?:\/\//.test(url)) return NextResponse.json({ error: "올바른 링크가 필요합니다." }, { status: 400 });
    const { error } = await admin.from("business_links").insert({ biz_no, type, url, label, created_by: user.id, is_paid: true, status: "active" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "addManager") {
    if (!isOwner) return NextResponse.json({ error: "소유자만 관리자를 추가할 수 있어요." }, { status: 403 });
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });
    const { count } = await admin.from("business_members").select("id", { count: "exact", head: true }).eq("biz_no", biz_no).eq("role", "manager");
    if ((count ?? 0) >= MAX_MANAGERS) return NextResponse.json({ error: "관리자는 1명까지 공유할 수 있어요." }, { status: 400 });
    const { data: target } = await admin.from("users").select("id").eq("email", email).maybeSingle();
    if (!target) return NextResponse.json({ error: "해당 이메일로 가입한 사용자가 없어요." }, { status: 400 });
    if (target.id === user.id) return NextResponse.json({ error: "본인은 추가할 수 없어요." }, { status: 400 });
    const { error } = await admin.from("business_members").insert({ biz_no, user_id: target.id, role: "manager", status: "verified", email });
    if (error) return NextResponse.json({ error: "이미 등록된 사용자거나 추가 실패." }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  if (action === "removeManager") {
    if (!isOwner) return NextResponse.json({ error: "소유자만 가능해요." }, { status: 403 });
    const id = String(body.id ?? "");
    const { error } = await admin.from("business_members").delete().eq("id", id).eq("biz_no", biz_no).eq("role", "manager");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
```

## (3) `components/business/MyBusinessClient.tsx` — 전체 교체
```tsx
'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, ExternalLink, Plus, UserPlus, X } from 'lucide-react';

type Link = { id: string; type: string; url: string; label: string | null; status: string };
type Manager = { id: string; email: string; status: string };
type Biz = { biz_no: string; company_name: string; representative: string | null; intro: string; links: Link[]; myRole: string; managers: Manager[] };

const TYPE_LABEL: Record<string, string> = { room: '리딩방', youtube: '유튜브', site: '사이트' };

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
  if (businesses.length === 0) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-8 text-center">
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요.</p>
        <a href="/business" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">업체 인증하기 →</a>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-unjong-muted">인증된 업체의 소개·링크·관리자를 관리하세요.</p>
      {businesses.map((b) => <BizCard key={b.biz_no} biz={b} onChange={load} />)}
    </div>
  );
}

function BizCard({ biz, onChange }: { biz: Biz; onChange: () => void }) {
  const isOwner = biz.myRole === 'owner';
  const [intro, setIntro] = useState(biz.intro);
  const [savingIntro, setSavingIntro] = useState(false);
  const [introMsg, setIntroMsg] = useState('');
  const [payNote, setPayNote] = useState(false);
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrErr, setMgrErr] = useState('');
  const [mgrBusy, setMgrBusy] = useState(false);

  async function saveIntro() {
    setSavingIntro(true); setIntroMsg('');
    try { const r = await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'setIntro', biz_no: biz.biz_no, intro }) }); setIntroMsg(r.ok ? '저장됨' : '실패'); }
    catch { setIntroMsg('실패'); } finally { setSavingIntro(false); }
  }
  async function delLink(id: string) {
    await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delLink', biz_no: biz.biz_no, id }) });
    onChange();
  }
  async function addManager() {
    if (!mgrEmail.trim()) { setMgrErr('이메일을 입력해주세요.'); return; }
    setMgrBusy(true); setMgrErr('');
    try {
      const r = await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'addManager', biz_no: biz.biz_no, email: mgrEmail.trim() }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? '추가 실패');
      setMgrEmail(''); onChange();
    } catch (e) { setMgrErr(e instanceof Error ? e.message : '추가 실패'); }
    finally { setMgrBusy(false); }
  }
  async function removeManager(id: string) {
    await fetch('/api/business/manage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'removeManager', biz_no: biz.biz_no, id }) });
    onChange();
  }

  return (
    <div className="rounded-xl border border-unjong-border bg-unjong-surface p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ShieldCheck size={16} className="text-emerald-600" />
        <h3 className="font-bold text-unjong-primary">{biz.company_name}</h3>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-600">인증됨</span>
        {!isOwner ? <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[11px] text-unjong-muted">관리자</span> : null}
        <span className="text-xs text-unjong-muted">{biz.biz_no}</span>
      </div>

      <label className="mb-1 block text-xs font-medium text-unjong-muted">소개</label>
      <div className="mb-1 flex gap-2">
        <textarea value={intro} onChange={(e) => { setIntro(e.target.value); setIntroMsg(''); }} rows={2} maxLength={200} placeholder="업체·리딩방 한 줄 소개" className="flex-1 resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
        <button type="button" onClick={saveIntro} disabled={savingIntro} className="shrink-0 self-start rounded-lg bg-unjong-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{savingIntro ? '저장…' : '저장'}</button>
      </div>
      {introMsg ? <p className="mb-3 text-[11px] text-emerald-600">{introMsg}</p> : <div className="mb-3" />}

      <label className="mb-1 block text-xs font-medium text-unjong-muted">게재 링크 ({biz.links.length})</label>
      <ul className="mb-2 space-y-1.5">
        {biz.links.length === 0 ? <li className="text-xs text-unjong-muted">아직 게재된 링크가 없어요.</li> : null}
        {biz.links.map((l) => (
          <li key={l.id} className="flex items-center gap-2 rounded-lg border border-unjong-border px-3 py-2 text-sm">
            <span className="shrink-0 rounded bg-unjong-background px-1.5 py-0.5 text-[11px] font-medium text-unjong-muted">{TYPE_LABEL[l.type] ?? l.type}</span>
            <span className="min-w-0 flex-1 truncate text-unjong-primary">{l.label || l.url}</span>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-unjong-muted hover:text-unjong-accent"><ExternalLink size={14} /></a>
            <button type="button" onClick={() => delLink(l.id)} aria-label="삭제" className="shrink-0 text-unjong-muted hover:text-red-500"><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      {payNote ? (
        <p className="mb-4 rounded-lg border border-dashed border-unjong-accent/40 bg-unjong-accent/5 px-3 py-2.5 text-center text-xs leading-relaxed text-unjong-muted">결제 기능 <b className="text-unjong-accent">준비 중</b>입니다 — 곧 링크당 과금으로 게재할 수 있어요.</p>
      ) : (
        <button type="button" onClick={() => setPayNote(true)} className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-unjong-accent py-2 text-sm font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white">
          <Plus size={14} /> 링크 추가 <span className="text-[11px]">(유료 · 링크당)</span>
        </button>
      )}

      {isOwner ? (
        <div className="border-t border-unjong-border pt-3">
          <label className="mb-1.5 block text-xs font-medium text-unjong-muted">관리자 공유 (1명까지)</label>
          {biz.managers.length > 0 ? (
            biz.managers.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-lg border border-unjong-border px-3 py-2 text-sm">
                <UserPlus size={13} className="shrink-0 text-unjong-muted" />
                <span className="min-w-0 flex-1 truncate text-unjong-primary">{m.email}</span>
                <button type="button" onClick={() => removeManager(m.id)} aria-label="해제" className="shrink-0 text-unjong-muted hover:text-red-500"><X size={14} /></button>
              </div>
            ))
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input value={mgrEmail} onChange={(e) => { setMgrEmail(e.target.value); setMgrErr(''); }} placeholder="공유할 사람의 가입 이메일" className="min-w-0 flex-1 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
                <button type="button" onClick={addManager} disabled={mgrBusy} className="shrink-0 rounded-lg bg-unjong-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{mgrBusy ? '추가…' : '공유'}</button>
              </div>
              {mgrErr ? <p className="text-xs text-red-500">{mgrErr}</p> : <p className="text-[11px] text-unjong-muted">공유받은 사람도 이 업체의 소개·링크를 관리할 수 있어요(가입 계정 필요).</p>}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
```

---

## 빌드 검증 + 클린 재시작 (API 변경)
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; npm run build
```
빌드 통과 → 보고. 커밋 보류.

## 확인 (사용자)
- 마이페이지 → 내 업체 → **'+ 링크 추가 (유료)'** 버튼 → 누르면 "결제 준비 중" 안내.
- **관리자 공유** → 가입된 다른 이메일 입력 → 공유 → 그 사람이 매니저로 추가됨(1명 한도). 해제도 가능.
  - (테스트: 다른 가입 계정 이메일이 있어야 됨. 없으면 "가입자가 없어요" — 정상.)
- 다음(⑤) = owner/매니저가 게재한 링크를 리딩방·검증 디렉토리에 표시(테스트 링크는 Cowork이 MCP로).
