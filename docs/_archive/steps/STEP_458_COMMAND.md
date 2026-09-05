<!-- 2026-06-28 -->
# STEP 458 — /admin 탭형 재편 + 광고 문의 탭 + /admin/login 전용 게이트 + 푸터 관리자링크

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_458_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. `/admin`을 **탭형**으로: `[업체 클레임 | 신고 | 광고 문의 | 금감원 조회]` (지금 세로 나열 → 탭).
2. **광고 문의 탭** — `ad_inquiries` 접수 목록 + 상태 관리(신규/연락함/종료). (지금 /advertise 폼이 라이브라 문의가 들어와도 볼 데가 없음 → 누수 차단)
3. **`/admin/login` 전용 게이트** — 구글 로그인 → `role===admin`이면 `/admin` 통과, 아니면 "권한 없음". 일반 UI엔 관리자 입구 없음(457에서 드롭다운 제거됨).
4. **푸터 © 줄에 작은 "관리자" 링크** → `/admin/login` (메인 칼럼 아님, muted).

## 전제
- 최신 main. `ad_inquiries` 테이블 이미 존재(STEP 457). 콜백은 `?next=` 지원(확인됨).
- 신규 파일 4 + 수정 2. **새 라우트(`/admin/login`, `/api/admin/ad-inquiries`) → 클린 재시작.**

---

## (1) NEW `components/admin/AdminTabs.tsx`
```tsx
'use client';

import { useState, type ReactNode } from 'react';

export default function AdminTabs({ tabs }: { tabs: { key: string; label: string; node: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? '');
  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-unjong-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={`shrink-0 border-b-2 px-4 py-2.5 text-sm transition-colors ${
              active === t.key ? 'border-unjong-accent font-semibold text-unjong-primary' : 'border-transparent text-unjong-muted hover:text-unjong-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} className={active === t.key ? '' : 'hidden'}>
          {t.node}
        </div>
      ))}
    </div>
  );
}
```

---

## (2) NEW `components/admin/AdminAdInquiries.tsx`
```tsx
'use client';

import { useState } from 'react';

type Inquiry = { id: number; slot: string | null; company: string; contact_name: string | null; email: string | null; phone: string | null; message: string | null; status: string; created_at: string };

const SLOT_LABEL: Record<string, string> = { broker: '증권사', room: '리딩방', other: '기타' };
const STATUS: { key: string; label: string }[] = [
  { key: 'new', label: '신규' },
  { key: 'contacted', label: '연락함' },
  { key: 'closed', label: '종료' },
];

export default function AdminAdInquiries({ initial }: { initial: Inquiry[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    const prev = rows;
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    try {
      const res = await fetch('/api/admin/ad-inquiries', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setRows(prev);
    } finally {
      setBusy(null);
    }
  }

  if (!rows.length) return <p className="py-8 text-center text-sm text-unjong-muted">접수된 광고 문의가 없습니다.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b border-unjong-border text-xs text-unjong-muted">
          <tr>
            <th className="py-2 pr-3">회사</th>
            <th className="py-2 pr-3">위치</th>
            <th className="py-2 pr-3">담당자</th>
            <th className="py-2 pr-3">연락처</th>
            <th className="py-2 pr-3">메시지</th>
            <th className="py-2 pr-3">상태</th>
            <th className="py-2">접수</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id} className="border-b border-unjong-border align-top">
              <td className="py-2 pr-3 font-medium text-unjong-primary">{q.company}</td>
              <td className="py-2 pr-3 text-unjong-muted">{q.slot ? (SLOT_LABEL[q.slot] ?? q.slot) : '—'}</td>
              <td className="py-2 pr-3 text-unjong-muted">{q.contact_name || '—'}</td>
              <td className="py-2 pr-3 text-unjong-muted">
                {q.email ? <div>{q.email}</div> : null}
                {q.phone ? <div>{q.phone}</div> : null}
                {!q.email && !q.phone ? '—' : null}
              </td>
              <td className="max-w-[16rem] whitespace-pre-wrap py-2 pr-3 text-unjong-primary">{q.message || '—'}</td>
              <td className="py-2 pr-3">
                <div className="flex gap-1">
                  {STATUS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      disabled={busy === q.id}
                      onClick={() => setStatus(q.id, s.key)}
                      className={`rounded px-2 py-0.5 text-[11px] transition-colors disabled:opacity-50 ${
                        q.status === s.key ? 'bg-unjong-accent text-white' : 'border border-unjong-border text-unjong-muted hover:text-unjong-primary'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </td>
              <td className="py-2 text-xs text-unjong-muted">{new Date(q.created_at).toLocaleDateString('ko-KR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## (3) NEW `app/api/admin/ad-inquiries/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["new", "contacted", "closed"];

export async function PATCH(req: NextRequest) {
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
  const { error } = await admin.from("ad_inquiries").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## (4) NEW `app/admin/login/page.tsx`
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'checking' | 'login' | 'denied'>('checking');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPhase('login'); return; }
      const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (me?.role === 'admin') router.replace('/admin');
      else setPhase('denied');
    })();
  }, [router]);

  const login = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/admin` },
    });
  };

  return (
    <div className="flex min-h-[calc(100svh_-_61px)] items-center justify-center bg-unjong-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-unjong-border bg-unjong-surface p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 text-unjong-accent" size={28} />
        <h1 className="text-lg font-bold text-unjong-primary">트릴리언 관리자</h1>
        <p className="mt-1 text-sm text-unjong-muted">관리자 전용 페이지입니다.</p>
        {phase === 'checking' ? (
          <p className="mt-6 text-sm text-unjong-muted">확인 중…</p>
        ) : phase === 'denied' ? (
          <p className="mt-6 text-sm text-unjong-danger">이 계정은 관리자 권한이 없습니다.</p>
        ) : (
          <button
            type="button"
            onClick={login}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-unjong-border bg-white py-3 font-semibold text-[#1f1f1f] transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
            </svg>
            {loading ? '이동 중…' : '관리자 Google 로그인'}
          </button>
        )}
        <a href="/" className="mt-4 inline-block text-xs text-unjong-muted hover:text-unjong-primary">← 홈으로</a>
      </div>
    </div>
  );
}
```

---

## (5) EDIT `app/admin/page.tsx` — 탭형으로

**5-A) import 추가** — 찾기:
```tsx
import AdminReports from '@/components/admin/AdminReports';
import AdminBusinessClaims from '@/components/admin/AdminBusinessClaims';
import AdminFssLookup from '@/components/admin/AdminFssLookup';
```
바꾸기:
```tsx
import AdminReports from '@/components/admin/AdminReports';
import AdminBusinessClaims from '@/components/admin/AdminBusinessClaims';
import AdminFssLookup from '@/components/admin/AdminFssLookup';
import AdminAdInquiries from '@/components/admin/AdminAdInquiries';
import AdminTabs from '@/components/admin/AdminTabs';
```

**5-B) AdInquiry 타입 추가** — 찾기:
```tsx
type BizClaim = { id: string; biz_no: string; company_name: string; representative: string | null; contact: string | null; nts_valid: string | null; start_dt: string | null; doc_signed: string | null; status: string; created_at: string };
```
바꾸기:
```tsx
type BizClaim = { id: string; biz_no: string; company_name: string; representative: string | null; contact: string | null; nts_valid: string | null; start_dt: string | null; doc_signed: string | null; status: string; created_at: string };
type AdInquiry = { id: number; slot: string | null; company: string; contact_name: string | null; email: string | null; phone: string | null; message: string | null; status: string; created_at: string };
```

**5-C) ad_inquiries fetch 추가** — 찾기:
```tsx
    claims.push({ id: c.id as string, biz_no: c.biz_no as string, company_name: nameMap[c.biz_no as string] ?? (c.biz_no as string), representative: repMap[c.biz_no as string] ?? null, contact: (c.contact as string) ?? null, nts_valid: (c.nts_valid as string) ?? null, start_dt: (c.start_dt as string) ?? null, doc_signed, status: c.status as string, created_at: c.created_at as string });
  }

  return (
```
바꾸기:
```tsx
    claims.push({ id: c.id as string, biz_no: c.biz_no as string, company_name: nameMap[c.biz_no as string] ?? (c.biz_no as string), representative: repMap[c.biz_no as string] ?? null, contact: (c.contact as string) ?? null, nts_valid: (c.nts_valid as string) ?? null, start_dt: (c.start_dt as string) ?? null, doc_signed, status: c.status as string, created_at: c.created_at as string });
  }

  // 광고 문의(ad_inquiries)
  const { data: inquiriesData } = await admin.from('ad_inquiries').select('*').order('created_at', { ascending: false }).limit(500);
  const inquiries = (inquiriesData ?? []) as AdInquiry[];

  return (
```

**5-D) return 본문 교체(탭)** — 찾기:
```tsx
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>
      <p className="mb-8 mt-1 text-sm text-unjong-muted">금감원 조회 · 신고 · 업체 인증 신청</p>

      {/* 금감원 신고 조회 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🔎 금감원 신고 조회 · 사업자번호로 등록 여부 확인</h2>
        <AdminFssLookup />
      </section>

      {/* 신고 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🚨 신고 ({reports.length})</h2>
        <AdminReports initial={reports} />
      </section>

      {/* 업체 인증 신청(클레임) */}
      <section>
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🛡 업체 인증 신청 ({claims.length}) · 서류 확인 후 승인하면 verified·게재</h2>
        <AdminBusinessClaims initial={claims} />
      </section>
    </div>
  );
}
```
바꾸기:
```tsx
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>
      <p className="mb-6 mt-1 text-sm text-unjong-muted">업체 클레임 · 신고 · 광고 문의 · 금감원 조회</p>
      <AdminTabs
        tabs={[
          { key: 'claims', label: `업체 클레임 (${claims.length})`, node: <AdminBusinessClaims initial={claims} /> },
          { key: 'reports', label: `신고 (${reports.length})`, node: <AdminReports initial={reports} /> },
          { key: 'inquiries', label: `광고 문의 (${inquiries.length})`, node: <AdminAdInquiries initial={inquiries} /> },
          { key: 'fss', label: '금감원 조회', node: <AdminFssLookup /> },
        ]}
      />
    </div>
  );
}
```

---

## (6) EDIT `components/layout/Footer.tsx` — © 줄에 작은 관리자 링크
찾기:
```tsx
          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/70">
            &copy; 2026 Trillion. All rights reserved.
          </div>
```
바꾸기:
```tsx
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 pt-4 text-center text-sm text-white/70">
            <span>&copy; 2026 Trillion. All rights reserved.</span>
            <Link href="/admin/login" className="text-white/40 transition-colors hover:text-white/70">관리자</Link>
          </div>
```

---

## 확인 (새 라우트 → 클린 재시작)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
- `/admin` → 상단 탭 `[업체 클레임 | 신고 | 광고 문의 | 금감원 조회]`. 탭 전환 시 내용만 바뀜(검색 상태 유지).
- **광고 문의 탭**: 접수 목록(없으면 "접수된 광고 문의가 없습니다"). 행마다 신규/연락함/종료 토글.
- **푸터 맨 아래 ©줄**: 작게 "관리자" → 클릭 시 `/admin/login`.
- `/admin/login`: 비로그인 → "관리자 Google 로그인" 버튼 / 관리자 계정 로그인 → `/admin` 직행 / 비관리자 → "권한 없음".
- 빌드 에러 없음 (`npm run build`).
- (Cowork이 빌드 확인 후 테스트 광고문의 1건 넣어 광고문의 탭·상태토글 검증하고 정리.)

## 빌드·커밋
- 보류. 확인 후 STEP 458·459 묶어 커밋.
