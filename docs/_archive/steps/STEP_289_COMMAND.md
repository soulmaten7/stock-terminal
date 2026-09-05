<!-- 2026-06-20 -->
# STEP 289 — [V7 ④-2] 리딩방·검증: 신고 기능 (🚨 신고 → DB 접수)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_289_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 288(`09a4069`). 빌드 ✓.
- **사전 작업(완료, DB 직접)**: `room_reports` 테이블 생성 끝. RLS on + 정책 없음 → **서버 라우트(service role)로만 기록**, 익명 직접 insert 차단(스팸 방지). 조회는 관리자(대시보드)만.
- **설계 방침**: 기능부터 완성. **로그인·본인확인·메일 알림은 나중 레이어**(지금은 자리만).

---

## 🎯 목표

리딩방·검증 카드마다 **🚨 신고 버튼** → 누르면 사유·내용 입력 모달 → 제출하면 **`room_reports` 테이블에 접수**. 관리자(너)가 DB에서 확인.

> 파일 2개: 신고 접수 API 신규 + AdvisorDirectory 전체 교체(신고 버튼·모달 추가).

---

## 📄 파일 1 (신규 생성) — `app/api/reports/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASONS = ["허위·과장 수익률", "환불 거부", "미등록·사칭 의심", "리딩방 먹튀(잠적)", "불법 추천·미신고 자문", "기타"];

export async function POST(req: NextRequest) {
  let body: { target_type?: string; target_id?: string; target_name?: string; reason?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const target_name = String(body.target_name ?? "").trim().slice(0, 200);
  const reason = String(body.reason ?? "").trim();
  const content = String(body.content ?? "").trim().slice(0, 2000);
  const target_id = String(body.target_id ?? "").trim().slice(0, 100) || null;
  const target_type = String(body.target_type ?? "fss_advisor").trim().slice(0, 40);

  if (!target_name || !REASONS.includes(reason)) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("room_reports").insert({
    target_type,
    target_id,
    target_name,
    reason,
    content: content || null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## 📄 파일 2 (전체 교체) — `components/toolbox/AdvisorDirectory.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Search, Siren, X } from 'lucide-react';

type Advisor = {
  biz_no: string;
  company_name: string;
  representative: string | null;
  valid_from: string | null;
  valid_to: string | null;
  homepage: string | null;
  phone: string | null;
  address: string | null;
};

const REASONS = ['허위·과장 수익률', '환불 거부', '미등록·사칭 의심', '리딩방 먹튀(잠적)', '불법 추천·미신고 자문', '기타'];

// 주소 → 시·도 + 시·군·구 (앞 2토큰)
function region(address: string | null): string {
  if (!address) return '';
  return address.split(' ').slice(0, 2).join(' ');
}

export default function AdvisorDirectory() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Advisor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // 신고 모달 상태
  const [reporting, setReporting] = useState<Advisor | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/advisors?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setResults(j.results ?? []);
        setTotal(j.total ?? 0);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function openReport(a: Advisor) {
    setReporting(a);
    setReportReason('');
    setReportContent('');
    setReportDone(false);
    setReportError('');
  }

  async function submitReport() {
    if (!reporting || !reportReason) return;
    setReportSubmitting(true);
    setReportError('');
    try {
      const r = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: 'fss_advisor',
          target_id: reporting.biz_no,
          target_name: reporting.company_name,
          reason: reportReason,
          content: reportContent,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? '제출 실패');
      setReportDone(true);
    } catch (e) {
      setReportError(e instanceof Error ? e.message : '제출 실패');
    } finally {
      setReportSubmitting(false);
    }
  }

  return (
    <section className="min-w-0">
      {/* 면책 배너 */}
      <div className="mb-3 rounded-xl border border-unjong-border bg-unjong-background p-3">
        <p className="text-sm font-bold text-unjong-primary">금융감독원 신고 유사투자자문·리딩방 조회</p>
        <p className="mt-1 text-xs leading-relaxed text-unjong-muted">
          출처: 금융감독원 금융소비자포털 ‘파인’ (매일 갱신).{' '}
          ‘신고’는 정부의 안전 보증·인증이 아닙니다. 운종은 어떤 업체의 안전성·수익성도 보증하지 않으며,
          사실(신고 여부·기간·연락처)만 제공합니다. 판단은 이용자 몫이며,{' '}
          <strong className="text-unjong-primary">신고되지 않은 익명 리딩방은 특히 주의</strong>하세요.
        </p>
      </div>

      {/* 검색창 */}
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="업체명 또는 대표자 검색 (예: 귀인마케팅)"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-3 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
      </div>

      <p className="mb-2 px-1 text-xs text-unjong-muted">
        {q
          ? `‘${q}’ 검색 결과 ${total.toLocaleString()}건`
          : `전체 ${total.toLocaleString()}개 신고 업체 · 최근 신고순`}
        {!loading && results.length < total ? ` (상위 ${results.length}개 표시)` : ''}
      </p>

      {/* 결과 */}
      {loading ? (
        <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>
      ) : results.length === 0 ? (
        <p className="py-10 text-center text-sm text-unjong-muted">
          검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.
        </p>
      ) : (
        <ul className="space-y-1">
          {results.map((a) => (
            <li key={a.biz_no} className="rounded-lg border border-unjong-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-unjong-primary">{a.company_name}</p>
                  <p className="mt-0.5 text-xs text-unjong-muted">
                    대표 {a.representative ?? '—'}
                    {region(a.address) ? ` · ${region(a.address)}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {a.homepage ? (
                    <a
                      href={a.homepage}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-unjong-accent hover:text-unjong-accent"
                    >
                      홈페이지 <ExternalLink size={11} />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openReport(a)}
                    title="신고하기"
                    aria-label="신고하기"
                    className="flex items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-red-400 hover:text-red-500"
                  >
                    <Siren size={12} /> 신고
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-unjong-muted">
                <span>신고기간 {a.valid_from ?? '—'} ~ {a.valid_to ?? '—'}</span>
                {a.phone ? <span>☎ {a.phone}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 신고 모달 */}
      {reporting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-unjong-primary">신고하기</h3>
                <p className="mt-0.5 truncate text-xs text-unjong-muted">{reporting.company_name}</p>
              </div>
              <button type="button" onClick={() => setReporting(null)} aria-label="닫기" className="text-unjong-muted hover:text-unjong-primary">
                <X size={18} />
              </button>
            </div>

            {reportDone ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-unjong-primary">신고가 접수되었습니다.</p>
                <p className="mt-1 text-xs text-unjong-muted">확인 후 필요 시 금융감독원에 전달됩니다.</p>
                <button type="button" onClick={() => setReporting(null)} className="mt-4 rounded-lg bg-unjong-primary px-4 py-2 text-sm font-semibold text-white">
                  닫기
                </button>
              </div>
            ) : (
              <>
                <label className="mb-1 block text-xs font-medium text-unjong-muted">신고 사유</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
                >
                  <option value="">선택하세요</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <label className="mb-1 block text-xs font-medium text-unjong-muted">상세 내용 (선택)</label>
                <textarea
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  rows={4}
                  placeholder="구체적인 피해 내용·정황을 적어주세요."
                  className="mb-1 w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
                />
                <p className="mb-3 text-[11px] leading-relaxed text-unjong-muted">
                  허위 신고는 무고가 될 수 있습니다. 사실에 근거해 작성해주세요. (로그인·본인확인은 추후 적용 예정)
                </p>

                {reportError ? <p className="mb-2 text-xs text-red-500">{reportError}</p> : null}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setReporting(null)} className="flex-1 rounded-lg border border-unjong-border py-2 text-sm font-medium text-unjong-muted hover:bg-unjong-background">
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={!reportReason || reportSubmitting}
                    className="flex-1 rounded-lg bg-unjong-primary py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {reportSubmitting ? '제출 중…' : '신고하기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (lucide `Siren`·`X` import 포함).

개발 서버(`npm run dev`, 포트 3333):
1. 리딩방·검증 탭 → 각 카드 우측에 **🚨 신고** 버튼.
2. 신고 클릭 → 모달(사유 선택 + 내용) → **신고하기** → "신고가 접수되었습니다."
3. 사유 안 고르면 신고 버튼 비활성.
4. (선택) 취소/X로 닫힘.

> 접수 확인은 내가 Supabase `room_reports` 테이블에서 직접 조회해줄게(실행 후 알려줘).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방·검증 신고 기능 - 카드별 신고 버튼+모달, /api/reports로 room_reports 접수 (V7 ④-2, STEP 289)" && git push
```

---

> **한 줄 요약**: 리딩방·검증 카드마다 🚨 신고 버튼 → 사유·내용 모달 → `/api/reports`가 `room_reports`에 접수(서버 service role, 익명 직접쓰기 차단). 로그인·본인확인·메일은 다음 레이어.
