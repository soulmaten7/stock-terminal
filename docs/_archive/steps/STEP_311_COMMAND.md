<!-- 2026-06-20 -->
# STEP 311 — [운영] 관리자 페이지 `/admin` (신고·자가등록 목록)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_311_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 310. 빌드 ✓.
- **전제**: 본인 계정(`soulmaten7`) `users.role = 'admin'` (확인 완료).

---

## 🎯 목표

Supabase Table Editor 대신, **앱 안에서 신고·자가등록을 한눈에** 보는 **관리자 전용 페이지** `/admin`.
- 로그인 + `role='admin'` 만 접근. 아니면 "권한 없음".
- `room_reports`(신고) + `room_submissions`(자가등록)를 표로. (읽기는 admin 권한이 필요하니 서버에서 service role로.)
- 접근: 배포주소/`admin` (로컬 `http://localhost:3333/admin`).

> 신규 파일 1개.

---

## 📄 파일 (신규 생성) — `app/admin/page.tsx`

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: '운종 관리자' };

type Report = { id: number; target_name: string; reason: string; content: string | null; status: string; created_at: string };
type Submission = { id: number; room_name: string; company_name: string | null; platform: string; homepage: string; fss_matched: boolean; status: string; created_at: string };

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
}

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: me } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="text-lg font-bold text-unjong-primary">접근 권한이 없습니다</p>
        <p className="mt-2 text-sm text-unjong-muted">관리자만 볼 수 있는 페이지예요.</p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: reportsData } = await admin.from('room_reports').select('*').order('created_at', { ascending: false }).limit(300);
  const { data: subsData } = await admin.from('room_submissions').select('*').order('created_at', { ascending: false }).limit(300);
  const reports = (reportsData ?? []) as Report[];
  const subs = (subsData ?? []) as Submission[];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-xl font-bold text-unjong-primary">운종 관리자</h1>
      <p className="mb-8 mt-1 text-sm text-unjong-muted">신고·자가등록 접수 현황 · 최신순</p>

      {/* 신고 */}
      <section className="mb-12">
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
      </section>

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
    </div>
  );
}
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (`/admin` 라우트 잡히는지).

개발 서버(`npm run dev`, 포트 3333):
1. **로그인(soulmaten7)** 상태로 `http://localhost:3333/admin` → **신고 표**(방금 'LW주식공부' 테스트 신고 보임) + **자가등록 표**(데모 행 보임).
2. **로그아웃** 또는 다른 계정 → "접근 권한이 없습니다".

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(admin): /admin 관리자 페이지 — 신고·자가등록 목록(role=admin 전용) (STEP 311)" && git push
```

---

> **한 줄 요약**: role='admin' 전용 `/admin` 페이지에서 신고·자가등록을 표로 한눈에. (대시보드 대신 앱 내 운영 화면)
