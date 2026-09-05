<!-- 2026-06-20 -->
# STEP 316 — [신고 모더레이션 ②-c] 관리자 신고 확인/기각 (확인분만 공개 반영)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_316_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 315(`f2fc4d6`).

---

## 🎯 목표

신고 모더레이션 핵심 고리: 관리자가 `/admin`에서 신고를 **확인(confirmed) / 기각(dismissed)** 처리.
- 뷰는 이미 `status='confirmed'`만 공개 🚨에 카운트 → **관리자가 '확인'한 신고만 대중에 노출**
- 권한 검사: API에서 `role='admin'` 재확인 (서버 이중 방어)

> 신규 2파일(API·클라이언트 표) + `app/admin/page.tsx` 수정 1곳.

---

## 📄 파일 1 (신규) — `app/api/admin/reports/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "dismissed"];

export async function POST(req: NextRequest) {
  // 관리자만 — 세션 + role 재확인
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  let body: { id?: number; status?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = Number(body.id);
  const status = String(body.status ?? "");
  if (!id || !STATUSES.includes(status)) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("room_reports").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## 📄 파일 2 (신규) — `components/admin/AdminReports.tsx`

```tsx
'use client';

import { useState } from 'react';

type Report = { id: number; target_name: string; reason: string; content: string | null; status: string; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

const STATUS_LABEL: Record<string, string> = { pending: '대기', confirmed: '확인됨', dismissed: '기각됨' };

export default function AdminReports({ initial }: { initial: Report[] }) {
  const [reports, setReports] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    try {
      const r = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!r.ok) throw new Error();
      setReports((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch {
      alert('처리 실패');
    } finally {
      setBusy(null);
    }
  }

  if (reports.length === 0) {
    return <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 신고가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-unjong-border">
      <table className="w-full text-sm">
        <thead className="bg-unjong-background text-xs text-unjong-muted">
          <tr>
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">대상</th>
            <th className="px-3 py-2 text-left font-medium">사유</th>
            <th className="px-3 py-2 text-left font-medium">내용</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="border-t border-unjong-border align-top">
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(r.created_at)}</td>
              <td className="px-3 py-2 font-medium text-unjong-primary">{r.target_name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-unjong-primary">{r.reason}</td>
              <td className="px-3 py-2 text-unjong-muted">{r.content || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                <span className={r.status === 'confirmed' ? 'font-semibold text-emerald-600' : r.status === 'dismissed' ? 'text-unjong-muted line-through' : 'font-medium text-amber-600'}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={busy === r.id || r.status === 'confirmed'}
                    onClick={() => setStatus(r.id, 'confirmed')}
                    className="rounded-md border border-emerald-500/40 px-2 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40"
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    disabled={busy === r.id || r.status === 'dismissed'}
                    onClick={() => setStatus(r.id, 'dismissed')}
                    className="rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors hover:bg-unjong-background disabled:opacity-40"
                  >
                    기각
                  </button>
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

## 📄 파일 3 (수정) — `app/admin/page.tsx`

### 수정 3-1 — import 추가 (기존 import 블록 아래)

**찾기:**
```tsx
import { createAdminClient } from '@/lib/supabase/admin';
```
**바꾸기:**
```tsx
import { createAdminClient } from '@/lib/supabase/admin';
import AdminReports from '@/components/admin/AdminReports';
```

### 수정 3-2 — 신고 표를 클라이언트 컴포넌트로 교체

**찾기:**
```tsx
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🚨 신고 ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="rounded-lg border border-unjong-border bg-unjong-surface p-6 text-center text-sm text-unjong-muted">아직 신고가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-unjong-border">
            <table className="w-full text-sm">
              <thead className="bg-unjong-background text-xs text-unjong-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">접수</th>
                  <th className="px-3 py-2 text-left font-medium">대상</th>
                  <th className="px-3 py-2 text-left font-medium">사유</th>
                  <th className="px-3 py-2 text-left font-medium">내용</th>
                  <th className="px-3 py-2 text-left font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-unjong-border align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmt(r.created_at)}</td>
                    <td className="px-3 py-2 font-medium text-unjong-primary">{r.target_name}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-unjong-primary">{r.reason}</td>
                    <td className="px-3 py-2 text-unjong-muted">{r.content || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
```
**바꾸기:**
```tsx
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🚨 신고 ({reports.length})</h2>
        <AdminReports initial={reports} />
```

> ⚠️ 자가등록 표(아래쪽 `subs.map`)랑 `fmt` 함수는 그대로 둬. 신고 표만 교체.

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`):
1. soulmaten7(admin) 로그인 → `/admin` → 신고 표에 **상태 + [확인][기각] 버튼**.
2. 테스트 신고('LW주식공부')에서 **[확인]** 클릭 → 상태 '확인됨'(초록).
3. 리딩방 탭 새로고침 → 'LW주식공부'의 **🚨 1**이 공개로 뜸 (확인된 신고라서).
4. **[기각]** 누르면 다시 공개 카운트에서 빠짐.
5. (비admin이 `/api/admin/reports` 직접 호출해도 403).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(admin): 신고 확인/기각 처리 — 확인분만 공개 🚨 반영, 권한 재확인 (STEP 316)" && git push
```

---

> **한 줄 요약**: /admin에서 신고 확인/기각 → 확인된 신고만 공개 카운트 반영. 신고 모더레이션 루프 완성(남은 건 ②-b 본인 철회).
