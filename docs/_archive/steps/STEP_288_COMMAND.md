<!-- 2026-06-20 -->
# STEP 288 — [V7 ④-1] 리딩방·검증 1단계: 금감원 신고 유사투자자문 조회

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_288_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 287(`6a8a511`). 빌드 ✓.
- **데이터**: `fss_advisors` 테이블에 금감원 신고 유사투자자문업자 **1,738건**이 이미 매일 수집 중(크론 `fss-advisors`). RLS = public read(익명 조회 가능). 새 데이터 작업 없음.
- **설계 근거**: `docs/PRODUCT_SPEC_V7.md` §6. **1단계 = 사실 기반 조회 디렉토리**(자가 신원인증 등록·금감원 제보·정정폼은 2·3단계로 분리).

---

## 🎯 목표

게이트웨이 **리딩방·검증 탭**의 "준비 중" 자리를 **금감원 신고 유사투자자문·리딩방 조회 디렉토리**로 교체.
- 킬러 용도: *"누가 권유한 이 리딩방, 금감원에 신고된 곳인가?"* → 업체명·대표자 **검색**으로 즉시 확인.
- **사실만**: 업체명·대표·신고기간·연락처·홈페이지·지역. **출처(금감원)** 명시 + **강한 면책**(신고≠안전보증, 운종은 보증 안 함).
- 정렬 = 검색·조회 중심(빈 검색이면 최근 신고순 50). *광고·자가등록 랜덤정렬은 2단계.*

> 파일 3개: API 라우트 신규 + 컴포넌트 신규 + ToolboxClient 리딩방 탭 연결.

---

## 📄 파일 1 (신규 생성) — `app/api/advisors/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("q") ?? "").trim();
  // PostgREST or-필터 인젝션 방지: 한글·영숫자·공백·하이픈만 허용
  const q = raw.replace(/[^\p{L}\p{N}\s-]/gu, "").slice(0, 50);

  const supabase = await createClient();
  let query = supabase
    .from("fss_advisors")
    .select("biz_no, company_name, representative, valid_from, valid_to, homepage, phone, address", { count: "exact" });

  if (q) {
    query = query.or(`company_name.ilike.%${q}%,representative.ilike.%${q}%`);
  }

  const { data, count, error } = await query
    .order("valid_from", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data ?? [], total: count ?? 0, q });
}
```

---

## 📄 파일 2 (신규 생성) — `components/toolbox/AdvisorDirectory.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';

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
                {a.homepage ? (
                  <a
                    href={a.homepage}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex shrink-0 items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted transition-colors hover:border-unjong-accent hover:text-unjong-accent"
                  >
                    홈페이지 <ExternalLink size={11} />
                  </a>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-unjong-muted">
                <span>신고기간 {a.valid_from ?? '—'} ~ {a.valid_to ?? '—'}</span>
                {a.phone ? <span>☎ {a.phone}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

---

## 📄 파일 3 — `components/toolbox/ToolboxClient.tsx` (리딩방 탭 연결)

### (3-A) import 추가
**찾기:**
```tsx
import BrokerRanking from './BrokerRanking';
import YoutubeRanking, { type YtChannel } from './YoutubeRanking';
```
**바꾸기:**
```tsx
import BrokerRanking from './BrokerRanking';
import YoutubeRanking, { type YtChannel } from './YoutubeRanking';
import AdvisorDirectory from './AdvisorDirectory';
```

### (3-B) 리딩방 탭 렌더 — Placeholder → AdvisorDirectory(한국만)
**찾기:**
```tsx
        ) : activeTab === 'room' ? (
          <Placeholder emoji="📣" title="리딩방 검증 — 준비 중" desc="신원인증 등록 + 사실(등록/신고) 라벨" />
        ) : activeTab === 'broker' ? (
```
**바꾸기:**
```tsx
        ) : activeTab === 'room' ? (
          country === 'KR' ? (
            <AdvisorDirectory />
          ) : (
            <Placeholder emoji="🇺🇸" title="미국 — 준비 중" />
          )
        ) : activeTab === 'broker' ? (
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 홈 → **리딩방·검증 탭** → 면책 배너 + 검색창 + 최근 신고순 목록.
2. 검색창에 **`귀인마케팅`** → 해당 업체 카드(대표 박세인, 신고기간, ☎, 텔레그램 홈페이지 링크).
3. 검색창에 **`주식회사`** → 여러 건, "검색 결과 N건".
4. 없는 이름 검색 → "검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요."
5. **미국 토글** → 리딩방 탭 "미국 — 준비 중".

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방·검증 1단계 - 금감원 신고 유사투자자문 조회 디렉토리(사실 라벨+면책+검색) (V7 ④-1, STEP 288)" && git push
```

---

> **한 줄 요약**: 리딩방·검증 탭 1단계 = 이미 수집 중인 금감원 신고 유사투자자문 1,738건을 검색·조회. 사실(업체명·대표·신고기간·연락처·홈페이지·지역)만 + 출처 + "신고≠안전보증" 면책. 자가 신원인증 등록·제보·정정폼은 2·3단계.
