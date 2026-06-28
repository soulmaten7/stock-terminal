<!-- 2026-06-28 -->
# STEP 457 — /advertise 광고 안내·문의 페이지 + 슬롯 리프레임 + 진입점

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_457_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **공개 페이지 `/advertise`** — 광고 가능 슬롯 소개 + §3 광고 원칙 + 문의 폼(비로그인도 제출). 제출 → `ad_inquiries` 저장.
2. **광고 슬롯 리프레임** — 가짜 광고주(토스증권·예시 리딩방)를 **"○○증권/○○리딩방 — 이 자리에 광고하세요 · 문의하기 →"** CTA로 교체. `/advertise?slot=…`로 링크. 공용 `AdSlotRow`. **맨 위 + 10개마다.**
3. **진입점** — 헤더 프로필 드롭다운에 **광고 문의** 추가 + **관리자 제거**. 푸터에 **광고 문의** 링크.

## 전제
- 최신 main(STEP 456, HEAD 2c9c590). 신규 파일 4 + 수정 4.
- **DB는 이미 적용됨** — `public.ad_inquiries` 테이블을 Cowork이 트릴리언(ccbwxcszdoyjxvckedfp)에 MCP로 생성 완료. (스키마 아래 참고용, 별도 작업 불필요)
- 새 라우트(`/advertise`, `/api/advertise/inquiry`) 생김 → **클린 재시작 필요**.

> 참고 — 이미 적용된 테이블 스키마:
> `ad_inquiries(id bigint PK, slot text, company text NOT NULL, contact_name, email, phone, message, status text default 'new', created_by uuid, created_at)`. RLS 켜짐·공개 정책 없음(서비스롤 전용).

---

## (1) NEW `app/api/advertise/inquiry/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLOTS = ["broker", "room", "other"];

export async function POST(req: NextRequest) {
  let body: { slot?: string; company?: string; contact_name?: string; email?: string; phone?: string; message?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }

  const company = String(body.company ?? "").trim().slice(0, 100);
  const contact_name = String(body.contact_name ?? "").trim().slice(0, 60) || null;
  const email = String(body.email ?? "").trim().slice(0, 120) || null;
  const phone = String(body.phone ?? "").trim().slice(0, 30) || null;
  const message = String(body.message ?? "").trim().slice(0, 2000) || null;
  const slot = SLOTS.includes(String(body.slot ?? "")) ? String(body.slot) : "other";

  if (!company) return NextResponse.json({ error: "회사명을 입력해 주세요" }, { status: 400 });
  if (!email && !phone) return NextResponse.json({ error: "이메일 또는 연락처 중 하나는 입력해 주세요" }, { status: 400 });

  // 광고주는 비로그인일 수 있음 — 로그인 필수 아님. 로그인 상태면 user.id 기록.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { error } = await admin.from("ad_inquiries").insert({
    slot, company, contact_name, email, phone, message, created_by: user?.id ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

---

## (2) NEW `components/advertise/AdInquiryForm.tsx`
```tsx
'use client';

import { useState } from 'react';
import SelectDropdown from '@/components/toolbox/SelectDropdown';

const SLOT_OPTIONS = [
  { value: 'broker', label: '증권사 슬롯 (종목·상품)' },
  { value: 'room', label: '리딩방 슬롯 (리딩방·검증)' },
  { value: 'other', label: '기타 · 일반 문의' },
];

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-unjong-muted">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
    </div>
  );
}

export default function AdInquiryForm({ defaultSlot = 'other' }: { defaultSlot?: string }) {
  const [slot, setSlot] = useState(defaultSlot);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!company.trim()) { setError('회사명을 입력해 주세요'); return; }
    if (!email.trim() && !phone.trim()) { setError('이메일 또는 연락처 중 하나는 입력해 주세요'); return; }
    setSubmitting(true);
    try {
      const r = await fetch('/api/advertise/inquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, company, contact_name: contactName, email, phone, message }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? '제출 실패');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '제출 실패');
    } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
        <p className="text-sm font-bold text-unjong-primary">문의가 접수되었습니다.</p>
        <p className="mt-1 text-xs text-unjong-muted">담당자가 확인 후 입력하신 연락처로 회신드립니다.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-unjong-border bg-unjong-surface p-5">
      <div>
        <label className="mb-1 block text-xs font-medium text-unjong-muted">관심 광고 위치</label>
        <SelectDropdown value={slot} onChange={setSlot} options={SLOT_OPTIONS} placeholder="선택하세요" />
      </div>
      <Field label="회사명 *" value={company} onChange={setCompany} placeholder="예: ○○증권 / ○○리딩방" />
      <Field label="담당자" value={contactName} onChange={setContactName} placeholder="이름 (선택)" />
      <Field label="이메일" value={email} onChange={setEmail} placeholder="you@company.com" type="email" />
      <Field label="연락처" value={phone} onChange={setPhone} placeholder="010-0000-0000" />
      <div>
        <label className="mb-1 block text-xs font-medium text-unjong-muted">문의 내용</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="노출 희망 위치·예산·기간 등 자유롭게 적어주세요." className="w-full resize-none rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2 text-sm text-unjong-primary outline-none focus:border-unjong-accent" />
      </div>
      <p className="text-[11px] leading-relaxed text-unjong-muted">※ 광고는 노출(순위)일 뿐 사실·수익 보증이 아니며, 모든 광고엔 '광고' 라벨이 붙습니다. 유사투자자문 신고 + 운영자 인증을 마친 곳만 게재할 수 있습니다.</p>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <button type="submit" disabled={submitting} className="w-full rounded-lg bg-unjong-accent py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {submitting ? '제출 중…' : '광고 문의 보내기'}
      </button>
    </form>
  );
}
```

---

## (3) NEW `app/advertise/page.tsx`
```tsx
import type { Metadata } from "next";
import AdInquiryForm from "@/components/advertise/AdInquiryForm";

export const runtime = "nodejs";
export const metadata: Metadata = { title: "광고 안내·문의" };

const SLOTS = [
  { key: "broker", title: "증권사 슬롯", where: "종목·상품 탭 · 증권사 리스트 상단/중간", desc: "주식 정보를 찾는 사용자에게 계좌개설·이벤트를 노출합니다." },
  { key: "room", title: "리딩방 슬롯", where: "리딩방·검증 탭 · 리스트 상단/중간", desc: "유사투자자문 신고 + 운영자 인증을 마친 곳만 상단 노출이 가능합니다." },
];

const RULES = [
  "광고는 '노출(순위)'일 뿐, 사실·안전·수익을 보증하지 않습니다.",
  "유사투자자문 신고 + 운영자 인증을 마친 곳만 유료 광고가 가능합니다.",
  "모든 광고에는 '광고' 라벨이 항상 표시됩니다.",
  "콘텐츠 가이드라인(과장 수익률·허위 표시 금지)을 통과해야 합니다.",
];

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  const sp = await searchParams;
  const slot = ["broker", "room", "other"].includes(sp.slot ?? "") ? (sp.slot as string) : "other";
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-unjong-primary">트릴리언 광고 안내</h1>
      <p className="mt-2 text-sm leading-relaxed text-unjong-muted">흩어진 금융 정보를 한눈에 찾는 사용자에게, 가장 관련 높은 자리에서 정확히 노출하세요.</p>

      <h2 className="mb-3 mt-8 text-sm font-bold text-unjong-primary">광고 가능 위치</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {SLOTS.map((s) => (
          <div key={s.key} className="rounded-xl border border-unjong-border bg-unjong-surface p-4">
            <p className="text-sm font-bold text-unjong-primary">{s.title}</p>
            <p className="mt-0.5 text-[11px] font-medium text-unjong-accent">{s.where}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-unjong-muted">{s.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold text-unjong-primary">광고 원칙</h2>
      <ul className="space-y-2 rounded-xl border border-unjong-border bg-unjong-background p-4">
        {RULES.map((r, i) => (
          <li key={i} className="flex gap-2 text-xs leading-relaxed text-unjong-primary">
            <span className="shrink-0 text-unjong-accent">•</span><span>{r}</span>
          </li>
        ))}
      </ul>

      <h2 className="mb-3 mt-8 text-sm font-bold text-unjong-primary">광고 문의</h2>
      <AdInquiryForm defaultSlot={slot} />
    </div>
  );
}
```

---

## (4) NEW `components/toolbox/AdSlotRow.tsx`
```tsx
'use client';

import Link from 'next/link';
import { Megaphone, ChevronRight } from 'lucide-react';

// 공용 광고 슬롯 행 — 가짜 광고주 대신 '광고 문의하기' CTA(/advertise). 증권사·리딩방 공통.
export default function AdSlotRow({ slot, label }: { slot: 'broker' | 'room'; label: string }) {
  return (
    <Link
      href={`/advertise?slot=${slot}`}
      className="group flex items-center gap-3 border-b border-l-2 border-unjong-border border-l-unjong-accent bg-unjong-accent/[0.06] px-2 py-2.5 ring-1 ring-inset ring-unjong-accent/25 transition-colors hover:bg-unjong-accent/[0.12]"
    >
      <span className="shrink-0 rounded bg-unjong-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-accent">광고</span>
      <Megaphone size={16} className="shrink-0 text-unjong-accent" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{label} — 이 자리에 광고하세요</span>
        <span className="truncate text-[11px] text-unjong-muted">트릴리언 광고 문의하기</span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-unjong-accent">
        문의하기 <ChevronRight size={13} />
      </span>
    </Link>
  );
}
```

---

## (5) REPLACE `components/toolbox/BrokerRanking.tsx` (전체 교체)
```tsx
'use client';

import { Fragment } from 'react';
import ListRow from './ListRow';
import SectionHeader from './SectionHeader';
import AdSlotRow from './AdSlotRow';
import { BROKERS } from '@/lib/brokers';

const AD_EVERY = 10; // 맨 위 + 10개마다 광고 슬롯

export default function BrokerRanking({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <section className="min-w-0 text-sm">
      {!hideHeader && <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />}
      <div>
        <AdSlotRow slot="broker" label="○○증권" />
        {BROKERS.map((b, i) => (
          <Fragment key={b.rank}>
            <ListRow
              href={b.url}
              rank={b.rank}
              iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
              title={b.name}
              stat={b.share != null ? `${b.share}%` : undefined}
            />
            {(i + 1) % AD_EVERY === 0 && i + 1 < BROKERS.length ? <AdSlotRow slot="broker" label="○○증권" /> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
```

---

## (6) EDIT `components/toolbox/AdvisorDirectory.tsx` (3곳)

**6-1) import에서 Globe 제거** — 찾기:
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, Globe, ArrowUp, ArrowDown, UserCheck } from 'lucide-react';
```
바꾸기:
```tsx
import { ExternalLink, Search, Siren, X, ChevronLeft, ChevronRight, ShieldCheck, Star, ArrowUp, ArrowDown, UserCheck } from 'lucide-react';
```

**6-2) AdSlotRow import 추가** — 찾기:
```tsx
import SelectDropdown from './SelectDropdown';
```
바꾸기:
```tsx
import SelectDropdown from './SelectDropdown';
import AdSlotRow from './AdSlotRow';
```

**6-3) SponsoredRoomRow 함수 삭제(주석+AD_EVERY는 유지·교체)** — 찾기:
```tsx
// 🧪 TEST — 인피드 광고 행(리딩방 N개마다 1개, Coupang/Naver식). 광고라도 사실(금감원 배지)은 안 가림. 실제 광고주 아님 — 추후 DB 연동으로 교체.
const AD_EVERY = 10;
function SponsoredRoomRow() {
  return (
    <li className="flex items-center gap-3 border-b border-b-unjong-border border-l-2 border-l-unjong-accent bg-unjong-accent/[0.06] px-2 py-2.5 ring-1 ring-inset ring-unjong-accent/25">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 rounded bg-unjong-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-accent">광고</span>
        <Globe size={18} className="shrink-0 text-unjong-muted" />
        <span className="truncate text-sm font-semibold text-unjong-primary">예시 리딩방 (광고 미리보기)</span>
        <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="유사투자자문 신고" />
      </span>
      <a href="#" onClick={(e) => e.preventDefault()} aria-label="바로가기" className="flex shrink-0 items-center rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted">
        <ExternalLink size={12} />
      </a>
    </li>
  );
}
```
바꾸기:
```tsx
// 인피드 광고 슬롯 — '예시'가 아니라 '광고 문의하기' CTA(/advertise). 맨 위 + N개마다. (AdSlotRow 공용)
const AD_EVERY = 10;
```

**6-4) 광고행 렌더 교체(맨 위 포함)** — 찾기:
```tsx
                    {i > 0 && i % AD_EVERY === 0 ? <SponsoredRoomRow /> : null}
```
바꾸기:
```tsx
                    {i % AD_EVERY === 0 ? <li><AdSlotRow slot="room" label="○○리딩방" /></li> : null}
```

---

## (7) EDIT `components/layout/Header.tsx` — 드롭다운: 광고 문의 추가 + 관리자 제거
찾기:
```tsx
                  <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>마이페이지</Link>
                  {user.role === 'admin' ? (
                    <Link href="/admin" className="block px-4 py-2.5 text-sm font-semibold text-unjong-accent hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>관리자</Link>
                  ) : null}
                  <div className="border-t border-unjong-border" />
```
바꾸기:
```tsx
                  <Link href="/mypage" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>마이페이지</Link>
                  <Link href="/advertise" className="block px-4 py-2.5 text-sm text-unjong-primary hover:bg-unjong-background" onClick={() => setProfileOpen(false)}>광고 문의</Link>
                  <div className="border-t border-unjong-border" />
```
> 관리자 링크 제거 = 일반 UI에서 admin 입구 숨김. /admin은 URL로만 접근(서버 role 체크는 유지). 전용 `/admin/login` 게이트는 STEP 458에서.

---

## (8) EDIT `components/layout/Footer.tsx` — 문의 칼럼에 광고 문의
찾기:
```tsx
            <ul className="space-y-2 text-sm text-white/80">
              <li>이메일: <a href="mailto:contact@onetrillion.app" className="transition-colors hover:text-[#2DD4BF]">contact@onetrillion.app</a></li>
```
바꾸기:
```tsx
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link href="/advertise" className="transition-colors hover:text-[#2DD4BF]">광고 문의</Link></li>
              <li>이메일: <a href="mailto:contact@onetrillion.app" className="transition-colors hover:text-[#2DD4BF]">contact@onetrillion.app</a></li>
```

---

## 확인 (새 라우트 생김 → 클린 재시작)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```
- **종목·상품 > 증권사**: 맨 위 + 10번째 뒤에 `[광고] ○○증권 — 이 자리에 광고하세요 · 문의하기 →`. 클릭 → `/advertise?slot=broker`.
- **리딩방·검증**: 맨 위 + 10개마다 `[광고] ○○리딩방 …`. 클릭 → `/advertise?slot=room`.
- **`/advertise`**: 슬롯 카드 2개 + 광고 원칙 4줄 + 문의 폼. 폼에 회사명+이메일/연락처 넣고 제출 → "문의가 접수되었습니다."
- **헤더 아바타 메뉴**: `마이페이지 / 광고 문의 / 로그아웃` (관리자 없음).
- **푸터 문의 칼럼**: "광고 문의" 링크.
- 제출 후 Cowork이 `ad_inquiries`에 행 들어왔는지 확인해줌.
- 빌드 에러 없음 (`npm run build`).

## 빌드·커밋
- 보류. 확인 후 STEP 457 커밋.
