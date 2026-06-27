<!-- 2026-06-27 -->
# STEP 433 — [클레임 빌드 3-B] 관리자 인증 검토 화면 (서류 확인 → 승인=verified)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_433_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
`/admin`에 **업체 인증 신청(클레임) 검토 섹션** 추가 — 접수된 서류(비공개 버킷=서명 URL로 열람) + 연락처를 보고 **승인 → `business_members.status='verified'`** / **반려 → 멤버 삭제**. 기존 신고·자가등록 관리자 패턴 그대로 미러.

## 전제
- 최신 main + STEP 432분(미커밋). **새 API 라우트 1개** → 클린 재시작 필요. 커밋 보류.

---

## (1) 새 파일 — `app/api/admin/business-claims/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  let body: { id?: string; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = String(body.id ?? "");
  const action = String(body.action ?? "");
  if (!id || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { data: claim } = await admin.from("business_claims").select("biz_no, user_id").eq("id", id).maybeSingle();
  if (!claim) return NextResponse.json({ error: "신청을 찾을 수 없음" }, { status: 404 });

  if (action === "approve") {
    await admin.from("business_claims").update({ status: "approved", reviewed_by: user.id }).eq("id", id);
    await admin.from("business_members").update({ status: "verified" }).eq("biz_no", claim.biz_no).eq("user_id", claim.user_id);
  } else {
    await admin.from("business_claims").update({ status: "rejected", reviewed_by: user.id }).eq("id", id);
    await admin.from("business_members").delete().eq("biz_no", claim.biz_no).eq("user_id", claim.user_id);
  }
  return NextResponse.json({ ok: true });
}
```

## (2) 새 파일 — `components/admin/AdminBusinessClaims.tsx`
```tsx
'use client';

import { useState } from 'react';

type BizClaim = { id: string; biz_no: string; company_name: string; contact: string | null; doc_signed: string | null; status: string; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}
const STATUS_LABEL: Record<string, string> = { pending: '대기', approved: '승인', rejected: '반려' };

export default function AdminBusinessClaims({ initial }: { initial: BizClaim[] }) {
  const [claims, setClaims] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function setAction(id: string, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/business-claims', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) throw new Error();
      setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c)));
    } catch { alert('처리 실패'); }
    finally { setBusy(null); }
  }

  if (claims.length === 0) {
    return <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 인증 신청이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
        <thead className="bg-unjong-background text-xs text-unjong-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">업체명</th>
            <th className="px-3 py-2 text-left font-medium">사업자번호</th>
            <th className="px-3 py-2 text-left font-medium">연락처</th>
            <th className="px-3 py-2 text-left font-medium">서류</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id} className="border-t border-unjong-border align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(c.created_at)}</td>
              <td className="px-3 py-2 font-medium text-unjong-primary">{c.company_name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{c.biz_no}</td>
              <td className="px-3 py-2 text-xs text-unjong-primary">{c.contact || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                {c.doc_signed ? <a href={c.doc_signed} target="_blank" rel="noopener noreferrer" className="text-unjong-accent hover:underline">서류 보기</a> : '—'}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <span className={c.status === 'approved' ? 'font-semibold text-emerald-600' : c.status === 'rejected' ? 'text-unjong-muted line-through' : 'font-medium text-amber-600'}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <div className="flex gap-1">
                  <button type="button" disabled={busy === c.id || c.status === 'approved'} onClick={() => setAction(c.id, 'approve')} className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40">승인</button>
                  <button type="button" disabled={busy === c.id || c.status === 'rejected'} onClick={() => setAction(c.id, 'reject')} className="rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors hover:bg-unjong-background disabled:opacity-40">반려</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## (3) `app/admin/page.tsx` — 3곳 수정 (타입 + fetch + 섹션)

### A. import 추가
**찾기:**
```tsx
import AdminReports from '@/components/admin/AdminReports';
import AdminSubmissions from '@/components/admin/AdminSubmissions';
```
**바꾸기:**
```tsx
import AdminReports from '@/components/admin/AdminReports';
import AdminSubmissions from '@/components/admin/AdminSubmissions';
import AdminBusinessClaims from '@/components/admin/AdminBusinessClaims';
```

### B. 타입 + 클레임 fetch
**찾기:**
```tsx
type Report = { id: number; target_name: string; reason: string; content: string | null; status: string; created_at: string };
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };
```
**바꾸기:**
```tsx
type Report = { id: number; target_name: string; reason: string; content: string | null; status: string; created_at: string };
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };
type BizClaim = { id: string; biz_no: string; company_name: string; contact: string | null; doc_signed: string | null; status: string; created_at: string };
```

**찾기:**
```tsx
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];
```
**바꾸기:**
```tsx
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];

  // 업체 인증 신청(클레임) + 업체명 매핑 + 서류 서명 URL
  const { data: claimsData } = await admin.from('business_claims').select('id, biz_no, contact, doc_url, status, created_at').order('created_at', { ascending: false }).limit(500);
  const claimRows = claimsData ?? [];
  const claimBizNos = [...new Set(claimRows.map((c) => c.biz_no as string))];
  const nameMap: Record<string, string> = {};
  if (claimBizNos.length) {
    const { data: bizes } = await admin.from('fss_advisors').select('biz_no, company_name').in('biz_no', claimBizNos);
    for (const b of bizes ?? []) nameMap[b.biz_no as string] = b.company_name as string;
  }
  const claims: BizClaim[] = [];
  for (const c of claimRows) {
    let doc_signed: string | null = null;
    if (c.doc_url) {
      const { data: sig } = await admin.storage.from('business-docs').createSignedUrl(c.doc_url as string, 3600);
      doc_signed = sig?.signedUrl ?? null;
    }
    claims.push({ id: c.id as string, biz_no: c.biz_no as string, company_name: nameMap[c.biz_no as string] ?? (c.biz_no as string), contact: (c.contact as string) ?? null, doc_signed, status: c.status as string, created_at: c.created_at as string });
  }
```

### C. 섹션 추가 (자가등록 아래)
**찾기:**
```tsx
      {/* 자가등록 */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">📝 자가등록 ({subs.length}) · 대기는 승인해야 공개</h2>
        <AdminSubmissions initial={subs} />
      </section>
    </div>
```
**바꾸기:**
```tsx
      {/* 자가등록 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">📝 자가등록 ({subs.length}) · 대기는 승인해야 공개</h2>
        <AdminSubmissions initial={subs} />
      </section>

      {/* 업체 인증 신청(클레임) */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🛡 업체 인증 신청 ({claims.length}) · 서류 확인 후 승인하면 verified·게재</h2>
        <AdminBusinessClaims initial={claims} />
      </section>
    </div>
```

---

## 빌드 검증 + 클린 재시작 (새 API 라우트)
```bash
pkill -f "next dev" 2>/dev/null; rm -rf .next; npm run build
```
빌드 통과해야 함. 통과하면 보고. **커밋 보류.**

## 확인 (사용자: `npm run dev`, admin 계정으로)
- 먼저 `/business`에서 서류 첨부해 **인증 신청 1건** 해두기.
- `/admin` → 맨 아래 **"🛡 업체 인증 신청"** 섹션에 그 신청이 보임 → **'서류 보기'** 클릭하면 첨부 파일 열림(서명 URL).
- **승인** 누르면 상태 '승인' + 멤버 verified / **반려** 누르면 '반려' + 멤버 삭제.
- 다음 STEP(4) = 승인된 owner가 `/business`에서 **본인 리딩방·링크 직접 편집/게재**.
