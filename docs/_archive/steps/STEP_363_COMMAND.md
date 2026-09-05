<!-- 2026-06-23 -->
# STEP 363 — [신뢰] 자가등록 승인제 (즉시 공개 → 관리자 승인 후 공개)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_363_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
'+리딩방 등록'(자가등록)이 **즉시 공개**(`status:'public'`)라 가짜·사칭 리딩방을 누구나 바로 올릴 수 있는 구멍 → **승인제**로. 신고 모더레이션(검토 후 공개)과 동일 원칙.
- 등록 시 `pending`(대기) → 관리자 `/admin`에서 **승인(→public)** 해야 공개. **반려(→rejected)** 가능.
- 등록자 안내: "관리자 검토 후 공개됩니다."

> 변경: 신규 2파일(`/api/admin/submissions` 라우트 · `AdminSubmissions` 컴포넌트) + 편집 3파일(submit 라우트 · admin 페이지 · 등록 모달).
> ⚠️ **새 API 라우트 → dev 서버 클린 재시작 필수.**

---

## 📄 1) `app/api/rooms/submit/route.ts` — 기본 상태 pending

**찾기:**
```ts
    user_id: user.id, fss_matched, fss_biz_no, status: "public",
```
**바꾸기:**
```ts
    user_id: user.id, fss_matched, fss_biz_no, status: "pending",
```

---

## 📄 2) 신규 `app/api/admin/submissions/route.ts`

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

  let body: { id?: number; action?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = Number(body.id);
  const action = String(body.action ?? "");
  if (!id || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("room_submissions")
    .update({ status: action === "approve" ? "public" : "rejected" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## 📄 3) 신규 `components/admin/AdminSubmissions.tsx`

```tsx
'use client';

import { useState } from 'react';

type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}
const STATUS_LABEL: Record<string, string> = { pending: '대기', public: '공개', rejected: '반려' };

export default function AdminSubmissions({ initial }: { initial: Submission[] }) {
  const [subs, setSubs] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  async function setAction(id: number, action: 'approve' | 'reject') {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) throw new Error();
      setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status: action === 'approve' ? 'public' : 'rejected' } : s)));
    } catch {
      alert('처리 실패');
    } finally {
      setBusy(null);
    }
  }

  if (subs.length === 0) {
    return <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 등록이 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
        <thead className="bg-unjong-background text-xs text-unjong-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">리딩방명</th>
            <th className="px-3 py-2 text-left font-medium">업체명</th>
            <th className="px-3 py-2 text-left font-medium">플랫폼</th>
            <th className="px-3 py-2 text-left font-medium">FSS대조</th>
            <th className="px-3 py-2 text-left font-medium">링크</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
          </tr>
        </thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.id} className="border-t border-unjong-border align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(s.created_at)}</td>
              <td className="px-3 py-2 font-medium text-unjong-primary">{s.room_name}</td>
              <td className="px-3 py-2 text-unjong-primary">{s.company_name || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-unjong-muted">{s.platform}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">{s.fss_matched ? '✅ 일치' : '—'}</td>
              <td className="max-w-[200px] truncate px-3 py-2 text-xs">
                <a href={s.homepage} target="_blank" rel="noopener noreferrer nofollow" className="text-unjong-accent hover:underline">{s.homepage}</a>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <span className={s.status === 'public' ? 'font-semibold text-emerald-600' : s.status === 'rejected' ? 'text-unjong-muted line-through' : 'font-medium text-amber-600'}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <div className="flex gap-1">
                  <button type="button" disabled={busy === s.id || s.status === 'public'} onClick={() => setAction(s.id, 'approve')} className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40">승인</button>
                  <button type="button" disabled={busy === s.id || s.status === 'rejected'} onClick={() => setAction(s.id, 'reject')} className="rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors hover:bg-unjong-background disabled:opacity-40">반려</button>
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

---

## 📄 4) `app/admin/page.tsx` — 3곳

### 4-1) import 추가
**찾기:**
```tsx
import AdminReports from '@/components/admin/AdminReports';
```
**바꾸기:**
```tsx
import AdminReports from '@/components/admin/AdminReports';
import AdminSubmissions from '@/components/admin/AdminSubmissions';
```

### 4-2) 미사용 `fmt` 제거 (자가등록 표를 컴포넌트로 빼면 안 쓰임 → 안 지우면 빌드 에러)
**찾기:**
```tsx
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

export default async function AdminPage() {
```
**바꾸기:**
```tsx
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };

export default async function AdminPage() {
```

### 4-3) 자가등록 섹션 = AdminSubmissions로 교체
**찾기:**
```tsx
      {/* 자가등록 */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">📝 자가등록 ({subs.length})</h2>
        {subs.length === 0 ? (
          <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 등록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-unjong-border">
            <table className="w-full text-sm">
              <thead className="bg-unjong-background text-xs text-unjong-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">접수</th>
                  <th className="px-3 py-2 text-left font-medium">리딩방명</th>
                  <th className="px-3 py-2 text-left font-medium">업체명</th>
                  <th className="px-3 py-2 text-left font-medium">플랫폼</th>
                  <th className="px-3 py-2 text-left font-medium">FSS대조</th>
                  <th className="px-3 py-2 text-left font-medium">링크</th>
                  <th className="px-3 py-2 text-left font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-t border-unjong-border align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(s.created_at)}</td>
                    <td className="px-3 py-2 font-medium text-unjong-primary">{s.room_name}</td>
                    <td className="px-3 py-2 text-unjong-primary">{s.company_name || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-unjong-muted">{s.platform}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs">{s.fss_matched ? '✅ 일치' : '—'}</td>
                    <td className="max-w-[220px] truncate px-3 py-2 text-xs">
                      <a href={s.homepage} target="_blank" rel="noopener noreferrer nofollow" className="text-unjong-accent hover:underline">{s.homepage}</a>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
```
**바꾸기:**
```tsx
      {/* 자가등록 */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">📝 자가등록 ({subs.length}) · 대기는 승인해야 공개</h2>
        <AdminSubmissions initial={subs} />
      </section>
```

---

## 📄 5) `components/toolbox/RoomSubmitModal.tsx` — 완료 문구

**찾기:**
```tsx
            <p className="text-sm font-medium text-unjong-primary">등록이 접수되었습니다.</p>
            <p className="mt-1 text-xs leading-relaxed text-unjong-muted">목록에 표시됩니다. (금감원 등록 확인 배지는 본인확인 도입 후 부여)</p>
```
**바꾸기:**
```tsx
            <p className="text-sm font-medium text-unjong-primary">등록 신청이 접수되었습니다.</p>
            <p className="mt-1 text-xs leading-relaxed text-unjong-muted">관리자 검토 후 공개됩니다. (금감원 등록 확인 배지는 본인확인 도입 후 부여)</p>
```

---

## ✅ 검증 (새 API 라우트 → 클린 재시작 필수)
```bash
npm run build
```
빌드 무에러. (admin 페이지 `fmt` 잔여 참조 0)

dev 서버 **클린 재시작**:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
1. (일반 로그인) 리딩방 → '+ 리딩방 등록' → 제출 → "관리자 검토 후 공개됩니다" → **목록에 바로 안 뜸**(대기).
2. (관리자) `/admin` → 📝 자가등록에 그 항목 **상태 '대기' + 승인/반려 버튼**. **승인** 누르면 상태 '공개' → 리딩방 목록에 등장.
3. **반려**하면 목록에 안 뜸.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/rooms/submit/route.ts app/api/admin/submissions components/admin/AdminSubmissions.tsx app/admin/page.tsx components/toolbox/RoomSubmitModal.tsx && git commit -m "feat(trust): 자가등록 승인제 — pending→관리자 승인 후 공개 + admin 승인/반려 (STEP 363)" && git push
```

---

> **한 줄 요약**: 자가등록을 즉시공개→승인제(pending→관리자 승인)로. 가짜 리딩방 즉시 노출 차단, 신고 모더레이션과 동일 원칙. 새 라우트라 **클린 재시작 필수**.
