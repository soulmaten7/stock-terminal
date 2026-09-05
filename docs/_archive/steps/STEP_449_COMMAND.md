<!-- 2026-06-28 -->
# STEP 449 (A) — 관리자: 클레임 심사 컬럼 보강 + 금감원 조회 검색박스

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_449_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **클레임 심사 컬럼 보강** — 업체 인증 신청 표에 **대표(금감원)·개업일·진위확인(✓일치/✗불일치)** 추가. (서류 보기는 이미 있음.)
2. **🔎 금감원 조회 검색박스** — 관리자 페이지에 새 섹션: 사업자번호(또는 업체명)로 `fss_advisors` 조회 → **업체명·사업자번호·대표·연락처·신고기간** 표시. 미발견 = "미신고 — 게재 불가".

> (하이픈 통일 = 다음 STEP B. 여기선 raw 표시, 검색은 이미 `digits` 정규화됨.)

## 전제
- 최신 main(STEP 448 + 문서 daafa2a). 파일 4개. **`/api/business/search` 변경 + 새 컴포넌트 → 클린 재시작.**

---

## (1) `app/api/business/search/route.ts` — phone 추가
**찾기:**
```ts
    .select("biz_no, company_name, representative, valid_from, valid_to, address");
```
**바꾸기:**
```ts
    .select("biz_no, company_name, representative, phone, valid_from, valid_to, address");
```

---

## (2) `components/admin/AdminFssLookup.tsx` — 신규 생성
```tsx
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

type Fss = { biz_no: string; company_name: string; representative: string | null; phone: string | null; valid_from: string | null; valid_to: string | null; address: string | null };

export default function AdminFssLookup() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Fss[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function run() {
    const query = q.trim();
    if (query.length < 2) return;
    setLoading(true); setSearched(true);
    try {
      const r = await fetch(`/api/business/search?q=${encodeURIComponent(query)}`);
      const j = await r.json();
      setResults(j.results ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }

  return (
    <div className="rounded-lg border border-unjong-border bg-unjong-surface p-4">
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
          placeholder="사업자번호 또는 업체명으로 금감원 신고 조회 (하이픈 무관)"
          className="w-full rounded-lg border border-unjong-border bg-unjong-surface py-2.5 pl-9 pr-20 text-sm text-unjong-primary outline-none focus:border-unjong-accent"
        />
        <button type="button" onClick={run} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-unjong-primary px-3 py-1.5 text-xs font-semibold text-white">조회</button>
      </div>
      {loading ? (
        <p className="py-4 text-center text-sm text-unjong-muted">조회 중…</p>
      ) : searched && results.length === 0 ? (
        <p className="py-4 text-center text-sm text-unjong-muted">금감원 신고 목록에 없습니다. <b className="text-amber-600">미신고 — 게재 불가</b></p>
      ) : results.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-unjong-border">
          <table className="w-full text-sm">
            <thead className="bg-unjong-background text-xs text-unjong-muted">
              <tr>
                <th className="px-3 py-2 text-left font-medium">업체명</th>
                <th className="px-3 py-2 text-left font-medium">사업자번호</th>
                <th className="px-3 py-2 text-left font-medium">대표</th>
                <th className="px-3 py-2 text-left font-medium">연락처</th>
                <th className="px-3 py-2 text-left font-medium">신고기간</th>
              </tr>
            </thead>
            <tbody>
              {results.map((f) => (
                <tr key={f.biz_no} className="border-t border-unjong-border">
                  <td className="px-3 py-2 font-medium text-unjong-primary">{f.company_name}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{f.biz_no}</td>
                  <td className="px-3 py-2 text-xs text-unjong-primary">{f.representative || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{f.phone || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{f.valid_from ?? '—'} ~ {f.valid_to ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
```

---

## (3) `app/admin/page.tsx` — 4곳

### (3-a) import 추가
**찾기:**
```tsx
import AdminBusinessClaims from '@/components/admin/AdminBusinessClaims';
```
**바꾸기:**
```tsx
import AdminBusinessClaims from '@/components/admin/AdminBusinessClaims';
import AdminFssLookup from '@/components/admin/AdminFssLookup';
```

### (3-b) BizClaim 타입 보강
**찾기:**
```tsx
type BizClaim = { id: string; biz_no: string; company_name: string; contact: string | null; doc_signed: string | null; status: string; created_at: string };
```
**바꾸기:**
```tsx
type BizClaim = { id: string; biz_no: string; company_name: string; representative: string | null; contact: string | null; nts_valid: string | null; start_dt: string | null; doc_signed: string | null; status: string; created_at: string };
```

### (3-c) claims 쿼리 — nts_valid·start_dt·representative
**찾기:**
```tsx
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
**바꾸기:**
```tsx
  const { data: claimsData } = await admin.from('business_claims').select('id, biz_no, contact, doc_url, status, created_at, nts_valid, start_dt').order('created_at', { ascending: false }).limit(500);
  const claimRows = claimsData ?? [];
  const claimBizNos = [...new Set(claimRows.map((c) => c.biz_no as string))];
  const nameMap: Record<string, string> = {};
  const repMap: Record<string, string | null> = {};
  if (claimBizNos.length) {
    const { data: bizes } = await admin.from('fss_advisors').select('biz_no, company_name, representative').in('biz_no', claimBizNos);
    for (const b of bizes ?? []) { nameMap[b.biz_no as string] = b.company_name as string; repMap[b.biz_no as string] = (b.representative as string) ?? null; }
  }
  const claims: BizClaim[] = [];
  for (const c of claimRows) {
    let doc_signed: string | null = null;
    if (c.doc_url) {
      const { data: sig } = await admin.storage.from('business-docs').createSignedUrl(c.doc_url as string, 3600);
      doc_signed = sig?.signedUrl ?? null;
    }
    claims.push({ id: c.id as string, biz_no: c.biz_no as string, company_name: nameMap[c.biz_no as string] ?? (c.biz_no as string), representative: repMap[c.biz_no as string] ?? null, contact: (c.contact as string) ?? null, nts_valid: (c.nts_valid as string) ?? null, start_dt: (c.start_dt as string) ?? null, doc_signed, status: c.status as string, created_at: c.created_at as string });
  }
```

### (3-d) 금감원 조회 섹션 추가 (맨 위)
**찾기:**
```tsx
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>
      <p className="mb-8 mt-1 text-sm text-unjong-muted">신고·업체 인증 신청 현황 · 최신순</p>

      {/* 신고 */}
```
**바꾸기:**
```tsx
      <h1 className="text-xl font-bold text-unjong-primary">트릴리언 관리자</h1>
      <p className="mb-8 mt-1 text-sm text-unjong-muted">금감원 조회 · 신고 · 업체 인증 신청</p>

      {/* 금감원 신고 조회 */}
      <section className="mb-12">
        <h2 className="mb-3 text-base font-bold text-unjong-primary">🔎 금감원 신고 조회 · 사업자번호로 등록 여부 확인</h2>
        <AdminFssLookup />
      </section>

      {/* 신고 */}
```

---

## (4) `components/admin/AdminBusinessClaims.tsx` — 3곳

### (4-a) 타입 보강 + 헬퍼
**찾기:**
```tsx
type BizClaim = { id: string; biz_no: string; company_name: string; contact: string | null; doc_signed: string | null; status: string; created_at: string };
```
**바꾸기:**
```tsx
type BizClaim = { id: string; biz_no: string; company_name: string; representative: string | null; contact: string | null; nts_valid: string | null; start_dt: string | null; doc_signed: string | null; status: string; created_at: string };

function ntsBadge(v: string | null) {
  if (v === 'match') return <span className="font-medium text-emerald-600">✓ 일치</span>;
  if (v === 'mismatch') return <span className="font-medium text-red-500">✗ 불일치</span>;
  return <span className="text-unjong-muted">— 미확인</span>;
}
function fmtStartDt(s: string | null) {
  if (s && /^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return s || '—';
}
```

### (4-b) thead — 대표·개업일·진위확인 추가
**찾기:**
```tsx
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">업체명</th>
            <th className="px-3 py-2 text-left font-medium">사업자번호</th>
            <th className="px-3 py-2 text-left font-medium">연락처</th>
            <th className="px-3 py-2 text-left font-medium">서류</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
```
**바꾸기:**
```tsx
            <th className="px-3 py-2 text-left font-medium">접수</th>
            <th className="px-3 py-2 text-left font-medium">업체명</th>
            <th className="px-3 py-2 text-left font-medium">대표(금감원)</th>
            <th className="px-3 py-2 text-left font-medium">사업자번호</th>
            <th className="px-3 py-2 text-left font-medium">연락처</th>
            <th className="px-3 py-2 text-left font-medium">개업일</th>
            <th className="px-3 py-2 text-left font-medium">진위확인</th>
            <th className="px-3 py-2 text-left font-medium">서류</th>
            <th className="px-3 py-2 text-left font-medium">상태</th>
            <th className="px-3 py-2 text-left font-medium">처리</th>
```

### (4-c) tbody 행 — 대표·개업일·진위확인 셀 추가
**찾기:**
```tsx
              <td className="px-3 py-2 font-medium text-unjong-primary">{c.company_name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{c.biz_no}</td>
              <td className="px-3 py-2 text-xs text-unjong-primary">{c.contact || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                {c.doc_signed ? <a href={c.doc_signed} target="_blank" rel="noopener noreferrer" className="text-unjong-accent hover:underline">서류 보기</a> : '—'}
              </td>
```
**바꾸기:**
```tsx
              <td className="px-3 py-2 font-medium text-unjong-primary">{c.company_name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-primary">{c.representative || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{c.biz_no}</td>
              <td className="px-3 py-2 text-xs text-unjong-primary">{c.contact || '—'}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs text-unjong-muted">{fmtStartDt(c.start_dt)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">{ntsBadge(c.nts_valid)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-xs">
                {c.doc_signed ? <a href={c.doc_signed} target="_blank" rel="noopener noreferrer" className="text-unjong-accent hover:underline">서류 보기</a> : '—'}
              </td>
```

---

## 클린 재시작 (라우트 변경 + 새 컴포넌트)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

## 확인 (localhost)
- `/admin` 맨 위 **🔎 금감원 신고 조회**: "1078635691"(또는 "107-86-35691") 입력 → 조회 → **주식회사 이머니·대표 조용학·연락처·신고기간** 표시. 없는 번호 → "미신고 — 게재 불가".
- **🛡 업체 인증 신청** 표: 테스트 건이 **대표=조용학·개업일=2015-03-20·진위확인=✓ 일치** 로 보강돼 보임. (서류는 "—" — 테스트라 파일 없음.)
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 STEP B(하이픈 통일)까지 묶거나 단독 커밋.
