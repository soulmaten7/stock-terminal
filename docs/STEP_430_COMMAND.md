<!-- 2026-06-27 -->
# STEP 430 — [클레임 빌드 2단계] `/business` 페이지: 업체 검색 → 인증 신청

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_430_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
`BUSINESS_CLAIM_SPEC` 2단계 — 전용 비즈니스 센터 `/business`에서 **금감원 명부 검색 → 본인 업체 선택 → 인증 신청(claim)**. 신청 시 `business_members`(pending owner) + `business_claims`(pending) 생성. (관리자 승인 = 다음 STEP, owner 편집 = 그다음.)
- **전부 새 파일** → 기존 코드 무영향. (DB 4테이블은 Cowork이 MCP로 이미 생성.)

## 전제
- 최신 main. **새 API 라우트 2개** 생기므로 끝에 **클린 재시작 필요**(Turbopack 새 라우트 인식). **커밋 보류**(테스트 먼저).

---

## (1) 새 파일 — `app/api/business/search/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 금감원 명부(fss_advisors)에서 업체명/사업자번호로 검색 → 클레임 후보 반환
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const admin = createAdminClient();
  const digits = q.replace(/\D/g, "");
  let query = admin
    .from("fss_advisors")
    .select("biz_no, company_name, representative, valid_from, valid_to, address");
  if (digits.length >= 10) query = query.eq("biz_no", digits.slice(0, 10));
  else query = query.ilike("company_name", `%${q.replace(/[%,()]/g, "")}%`);
  const { data, error } = await query.limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data ?? [] });
}
```

## (2) 새 파일 — `app/api/business/claim/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let body: { biz_no?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const biz_no = String(body.biz_no ?? "").replace(/\D/g, "").slice(0, 10);
  if (biz_no.length !== 10) return NextResponse.json({ error: "사업자번호가 올바르지 않습니다." }, { status: 400 });

  const admin = createAdminClient();
  // 금감원 등록 업체만 클레임 가능
  const { data: biz } = await admin.from("fss_advisors").select("biz_no").eq("biz_no", biz_no).maybeSingle();
  if (!biz) return NextResponse.json({ error: "금감원 등록 명부에 없는 사업자번호입니다." }, { status: 400 });

  // 중복 방지
  const { data: existing } = await admin.from("business_members").select("status").eq("biz_no", biz_no).eq("user_id", user.id).maybeSingle();
  if (existing) return NextResponse.json({ error: "이미 신청했거나 등록된 업체입니다." }, { status: 409 });

  await admin.from("business_members").insert({ biz_no, user_id: user.id, role: "owner", status: "pending" });
  await admin.from("business_claims").insert({ biz_no, user_id: user.id, method: "doc", status: "pending" });
  return NextResponse.json({ ok: true });
}
```

## (3) 새 파일 — `app/business/page.tsx`
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessClaimClient from "@/components/business/BusinessClaimClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "내 업체·리딩방 관리" };

export default async function BusinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-unjong-primary">내 업체·리딩방 관리</h1>
      <p className="mb-6 text-sm leading-relaxed text-unjong-muted">
        금감원 등록 업체만 게재할 수 있어요. 본인 업체를 찾아 인증을 신청하면, 관리자 확인 후 직접 리딩방·채널 링크를 관리할 수 있습니다.
      </p>
      <BusinessClaimClient />
    </div>
  );
}
```

## (4) 새 파일 — `components/business/BusinessClaimClient.tsx`
```tsx
'use client';

import { useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';

type Biz = { biz_no: string; company_name: string; representative: string | null; valid_from: string | null; valid_to: string | null; address: string | null };

export default function BusinessClaimClient() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Biz[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Biz | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function search() {
    if (q.trim().length < 2) return;
    setSearching(true); setError(''); setSelected(null);
    try {
      const r = await fetch(`/api/business/search?q=${encodeURIComponent(q.trim())}`);
      const j = await r.json();
      setResults(j.results ?? []); setSearched(true);
    } catch { setError('검색에 실패했어요.'); }
    finally { setSearching(false); }
  }

  async function claim() {
    if (!selected) return;
    setClaiming(true); setError('');
    try {
      const r = await fetch('/api/business/claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ biz_no: selected.biz_no }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error === 'login_required' ? '로그인이 필요합니다.' : (j.error ?? '신청 실패'));
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : '신청 실패'); }
    finally { setClaiming(false); }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
        <ShieldCheck className="mx-auto mb-2 text-emerald-600" size={28} />
        <p className="text-sm font-semibold text-unjong-primary">인증 신청이 접수되었습니다.</p>
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">관리자가 금감원 등록·대표 본인 여부를 확인한 뒤 게재됩니다.<br />(다음 단계: 사업자등록증·대표 신분 확인)</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          placeholder="업체명 또는 사업자등록번호로 검색"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-20 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
        <button type="button" onClick={search} disabled={searching} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-unjong-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
          {searching ? '검색 중…' : '검색'}
        </button>
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      {searched && results.length === 0 ? (
        <p className="rounded-lg border border-unjong-border bg-unjong-background px-3 py-4 text-center text-sm text-unjong-muted">
          금감원 등록 명부에서 못 찾았어요. <strong className="text-unjong-primary">등록된 업체만</strong> 게재할 수 있습니다.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((b) => {
            const isSel = selected?.biz_no === b.biz_no;
            return (
              <li key={b.biz_no}>
                <button type="button" onClick={() => setSelected(b)} className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${isSel ? 'border-unjong-accent bg-unjong-accent/5' : 'border-unjong-border hover:bg-unjong-background'}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                    <span className="font-semibold text-unjong-primary">{b.company_name}</span>
                    <span className="text-xs text-unjong-muted">{b.biz_no}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-unjong-muted">대표 {b.representative ?? '—'} · 신고기간 {b.valid_from ?? '—'} ~ {b.valid_to ?? '—'}</p>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selected ? (
        <div className="rounded-xl border border-unjong-accent bg-unjong-accent/5 p-4">
          <p className="text-sm text-unjong-primary"><b>{selected.company_name}</b>의 대표/담당자이신가요?</p>
          <p className="mt-1 text-xs leading-relaxed text-unjong-muted">인증 신청 후 관리자가 등록·본인 확인을 거쳐 게재됩니다. 허위 신청은 제재될 수 있어요.</p>
          <button type="button" onClick={claim} disabled={claiming} className="mt-3 w-full rounded-lg bg-unjong-primary py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {claiming ? '신청 중…' : '이 업체로 인증 신청'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
```

---

## 빌드 검증 + 클린 재시작 (새 API 라우트 인식)
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; npm run build
```
빌드 통과해야 함(전부 새 파일·타입 OK). 통과하면 보고. **커밋은 보류**(사용자 확인 후).

## 확인 (사용자: `npm run dev` 후)
- `localhost:3333/business` 접속(로그인 필요) → 업체명/사업자번호 검색 → 금감원 명부 결과 → 선택 → "이 업체로 인증 신청" → "신청 접수" 메시지.
- (테스트는 아무 등록업체로 신청해도 됨 — pending 기록만 생김. 관리자 승인 화면은 다음 STEP.)
- 입구 버튼(리딩방 탭 '+리딩방 등록' → /business 연결)·관리자 승인·owner 편집 = 다음 STEP들.
