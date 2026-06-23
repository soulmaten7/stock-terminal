<!-- 2026-06-23 -->
# STEP 358 — [MVP 2.0] 리뷰 사후관리 (신고 + 관리자 숨김)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_358_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
'즉시공개' 리뷰의 사후관리 장치:
- **신고**: 사용자가 악성 리뷰 신고(욕설·허위·광고·도배·기타). 로그인 필수, 1인 1신고.
- **관리자 숨김**: `/admin`에서 리뷰 숨김/공개(`status`). 숨김 리뷰는 공개 목록·평균에서 제외.

> **DB는 이미 생성 완료** (Cowork이 MCP로 `room_reviews.report_count` + `room_review_reports` 테이블·RLS 추가).
> 변경: 신규 라우트 2 + 신규 컴포넌트 1 + `RoomReviews.tsx`·`app/admin/page.tsx` 편집.
> ⚠️ **새 API 라우트라 dev 서버 클린 재시작 필수.**

---

## 📄 1) 신규 `app/api/reviews/report/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS = ["욕설·비방", "허위·사실무근", "광고·스팸", "도배·중복", "기타"];

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: { review_id?: number; reason?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const review_id = Number(body.review_id);
  const reason = String(body.reason ?? "").trim();
  if (!review_id) return NextResponse.json({ error: "review_id 필요" }, { status: 400 });
  if (!REASONS.includes(reason)) return NextResponse.json({ error: "사유를 선택하세요" }, { status: 400 });

  const admin = createAdminClient();
  const { error: insErr } = await admin
    .from("room_review_reports")
    .upsert({ review_id, reporter_user_id: user.id, reason }, { onConflict: "review_id,reporter_user_id", ignoreDuplicates: true });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { count } = await admin
    .from("room_review_reports")
    .select("id", { count: "exact", head: true })
    .eq("review_id", review_id);
  await admin.from("room_reviews").update({ report_count: count ?? 0 }).eq("id", review_id);

  return NextResponse.json({ ok: true });
}
```

---

## 📄 2) 신규 `app/api/admin/reviews/route.ts`

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
  if (!id || !["hide", "show"].includes(action)) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("room_reviews")
    .update({ status: action === "hide" ? "hidden" : "visible" })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## 📄 3) 신규 `components/admin/AdminReviews.tsx`

```tsx
'use client';

import { useState } from 'react';

type Review = { id: number; target_id: string; nickname: string | null; rating: number; content: string | null; status: string; report_count: number; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminReviews({ initial }: { initial: Review[] }) {
  const [reviews, setReviews] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  async function setAction(id: number, action: 'hide' | 'show') {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) throw new Error();
      setReviews((prev) => prev.map((x) => (x.id === id ? { ...x, status: action === 'hide' ? 'hidden' : 'visible' } : x)));
    } catch {
      alert('처리 실패');
    } finally {
      setBusy(null);
    }
  }

  if (reviews.length === 0) {
    return <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 리뷰가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
        <thead className="bg-unjong-background text-xs text-unjong-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">작성자</th>
            <th className="px-3 py-2 text-left font-medium">별점</th>
            <th className="px-3 py-2 text-left font-medium">내용</th>
            <th className="px-3 py-2 text-left font-medium">신고</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} className="border-t border-unjong-border align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(r.created_at)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-unjong-primary">{r.nickname || '익명'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-amber-500">{'★'.repeat(r.rating)}</td>
              <td className="px-3 py-2 text-unjong-muted">{r.content || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">{r.report_count > 0 ? <span className="font-semibold text-red-500">{r.report_count}</span> : '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <span className={r.status === 'hidden' ? 'text-unjong-muted line-through' : 'font-medium text-emerald-600'}>{r.status === 'hidden' ? '숨김' : '공개'}</span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {r.status === 'hidden' ? (
                  <button type="button" disabled={busy === r.id} onClick={() => setAction(r.id, 'show')} className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40">공개</button>
                ) : (
                  <button type="button" disabled={busy === r.id} onClick={() => setAction(r.id, 'hide')} className="rounded-md border border-red-400/50 px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40">숨김</button>
                )}
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

## 📄 4) `components/toolbox/RoomReviews.tsx` — 신고 UI (3곳)

### 4-1) 신고 사유 상수
**찾기:**
```tsx
type Review = { id: number; rating: number; content: string | null; created_at: string; nickname: string; mine: boolean };
type Mine = { id: number; rating: number; content: string | null } | null;
```
**바꾸기:**
```tsx
type Review = { id: number; rating: number; content: string | null; created_at: string; nickname: string; mine: boolean };
type Mine = { id: number; rating: number; content: string | null } | null;

const REPORT_REASONS = ['욕설·비방', '허위·사실무근', '광고·스팸', '도배·중복', '기타'];
```

### 4-2) 신고 상태 + 전송 함수
**찾기:**
```tsx
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
```
**바꾸기:**
```tsx
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [reportingId, setReportingId] = useState<number | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());

  async function sendReport(reviewId: number, reason: string) {
    setReportingId(null);
    setReportedIds((s) => new Set(s).add(reviewId));
    try {
      await fetch('/api/reviews/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, reason }),
      });
    } catch { /* 낙관적 유지 */ }
  }
```

### 4-3) 리뷰 항목에 신고 버튼/사유칩
**찾기:**
```tsx
              {rv.content ? <p className="mt-1 text-xs leading-relaxed text-unjong-muted">{rv.content}</p> : null}
            </li>
```
**바꾸기:**
```tsx
              {rv.content ? <p className="mt-1 text-xs leading-relaxed text-unjong-muted">{rv.content}</p> : null}
              {!rv.mine ? (
                reportedIds.has(rv.id) ? (
                  <span className="mt-1 inline-block text-[11px] text-unjong-muted">신고됨</span>
                ) : reportingId === rv.id ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {REPORT_REASONS.map((rs) => (
                      <button key={rs} type="button" onClick={() => sendReport(rv.id, rs)} className="rounded-md border border-unjong-border px-1.5 py-0.5 text-[11px] text-unjong-muted transition-colors hover:border-red-400 hover:text-red-500">{rs}</button>
                    ))}
                    <button type="button" onClick={() => setReportingId(null)} className="px-1 text-[11px] text-unjong-muted">취소</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => { if (!isLoggedIn) { onRequireLogin(); return; } setReportingId(rv.id); }} className="mt-1 text-[11px] text-unjong-muted hover:text-red-500">신고</button>
                )
              ) : null}
            </li>
```

---

## 📄 5) `app/admin/page.tsx` — 리뷰 관리 섹션 (4곳)

### 5-1) import
**찾기:**
```tsx
import AdminReports from '@/components/admin/AdminReports';
```
**바꾸기:**
```tsx
import AdminReports from '@/components/admin/AdminReports';
import AdminReviews from '@/components/admin/AdminReviews';
```

### 5-2) Review 타입
**찾기:**
```tsx
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };
```
**바꾸기:**
```tsx
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };
type Review = { id: number; target_id: string; nickname: string | null; rating: number; content: string | null; status: string; report_count: number; created_at: string };
```

### 5-3) 리뷰 조회
**찾기:**
```tsx
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(300);
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];
```
**바꾸기:**
```tsx
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(300);
  const { data: reviewsData } = await admin.from('room_reviews').select('id, target_id, nickname, rating, content, status, report_count, created_at').order('report_count', { ascending: false }).order('created_at', { ascending: false }).limit(300);
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];
  const reviews = (reviewsData ?? []) as Review[];
```

### 5-4) 섹션 추가 (자가등록 위)
**찾기:**
```tsx
      {/* 자가등록 */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">📝 자가등록 ({subs.length})</h2>
```
**바꾸기:**
```tsx
      {/* 리뷰 관리 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">⭐ 리뷰 ({reviews.length}) · 신고순</h2>
        <AdminReviews initial={reviews} />
      </section>

      {/* 자가등록 */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">📝 자가등록 ({subs.length})</h2>
```

---

## ✅ 검증 (새 API 라우트 → 클린 재시작 필수)
```bash
npm run build
```
빌드 무에러.

dev 서버 **클린 재시작**:
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
브라우저:
1. (일반 로그인) 리딩방 → 리뷰 목록에서 **내 것이 아닌** 리뷰에 '신고' → 사유 칩 클릭 → '신고됨'.
2. (관리자 계정) `/admin` → **⭐ 리뷰** 섹션, 신고수 많은 순. '숨김' 누르면 → 그 리뷰가 공개 목록·평균에서 사라짐.
3. '공개'로 되돌리면 다시 노출.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/api/reviews/report app/api/admin/reviews components/admin/AdminReviews.tsx components/toolbox/RoomReviews.tsx app/admin/page.tsx && git commit -m "feat(reviews): 사후관리 — 리뷰 신고 + 관리자 숨김/공개 (STEP 358)" && git push
```

---

> **한 줄 요약**: 리뷰 사후관리 — 사용자 신고(1인1회)+관리자 숨김. DB는 MCP로 완료, 이 STEP은 라우트 2+AdminReviews+RoomReviews/admin 편집. 새 라우트라 **클린 재시작 필수**.
