<!-- 2026-06-28 -->
# STEP 455 — 이름 최종 확정 (제목 "리딩방 등록·관리" / 탭 "업체 인증 · 내 업체 관리")

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_455_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (최종 확정)
- 버튼·제목 = **"리딩방 등록·관리"**
- 탭 = **"업체 인증 | 내 업체 관리"**
- 카드 안쪽 = 유사투자자문 신고·등록업체·대표·사업자번호 (정확한 용어 그대로)

> STEP 454를 돌렸든 안 돌렸든 **같은 최종 상태**가 되게 page·BusinessHub는 전체 교체.

## 전제
- 최신 main(STEP 453 또는 454). 파일 3개, 클라이언트/서버 → **HMR/Fast Refresh**.

---

## (1) `app/business/page.tsx` — 전체 교체
**아래 내용으로 파일 전체 덮어써:**
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessHub from "@/components/business/BusinessHub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "리딩방 등록·관리 — 트릴리언" };

export default async function BusinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-unjong-primary">리딩방 등록·관리</h1>
      <p className="mb-6 text-sm leading-relaxed text-unjong-muted">
        금감원에 유사투자자문 신고된 업체만 게재할 수 있어요. 본인 업체를 인증하면, 관리자 확인 후 직접 리딩방·채널 링크를 관리할 수 있습니다.
      </p>
      <BusinessHub />
    </div>
  );
}
```

---

## (2) `components/business/BusinessHub.tsx` — 전체 교체
**아래 내용으로 파일 전체 덮어써:**
```tsx
'use client';

import { useEffect, useState } from 'react';
import { Store, ShieldCheck } from 'lucide-react';
import MyBusinessClient from './MyBusinessClient';
import BusinessClaimClient from './BusinessClaimClient';

type Tab = 'claim' | 'manage';

export default function BusinessHub() {
  const [tab, setTab] = useState<Tab>('claim');

  // 스마트 기본 탭: 인증된 업체 있으면 '관리'로
  useEffect(() => {
    let cancelled = false;
    fetch('/api/business/mine')
      .then((r) => r.json())
      .then((j) => { if (!cancelled && (j.businesses?.length ?? 0) > 0) setTab('manage'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'claim', label: '업체 인증', icon: <ShieldCheck size={16} /> },
    { key: 'manage', label: '내 업체 관리', icon: <Store size={16} /> },
  ];

  return (
    <div>
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-unjong-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition-colors ${
              tab === t.key ? 'border-unjong-accent font-semibold text-unjong-primary' : 'border-transparent text-unjong-muted hover:text-unjong-primary'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab === 'claim' ? <BusinessClaimClient /> : <MyBusinessClient />}
    </div>
  );
}
```

---

## (3) `components/business/MyBusinessClient.tsx` — 빈 상태 탭명 "업체 인증"으로
빈 상태 안내문의 탭 이름을 **"업체 인증"** 으로 맞춘다 (STEP 454를 돌렸다면 지금 "리딩방 등록"으로 되어 있을 수 있음 → "업체 인증"으로; 이미 "업체 인증"이면 변경 없음).

**최종 문장 (이 형태가 되도록):**
```tsx
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요. 위 <b className="text-unjong-primary">업체 인증</b> 탭에서 본인 업체를 찾아 인증하세요.</p>
```
> 즉 그 줄에서 `<b ...>리딩방 등록</b>` 이면 `<b ...>업체 인증</b>` 으로 교체. (이미 `업체 인증`이면 그대로 두면 됨.)

---

## 확인 (localhost, HMR — 새로고침)
- 디렉토리 버튼 **"리딩방 등록·관리"** → `/business` 제목도 **"리딩방 등록·관리"** (일치).
- 탭 = **[업체 인증 | 내 업체 관리]**.
- 인증된 업체 있는 계정 → 자동 "내 업체 관리" 탭 / 없는 계정 → "업체 인증" 탭.
- 카드 안쪽 정확한 용어 그대로.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 STEP 451~455 묶어 커밋.
