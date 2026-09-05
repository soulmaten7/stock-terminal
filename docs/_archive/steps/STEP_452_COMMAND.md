<!-- 2026-06-28 -->
# STEP 452 — /business 탭 구조 (내 업체 관리 | 새 업체 인증)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_452_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
`/business`의 [내 업체 관리] + [새 업체 인증] 상하 스택 → **탭 2개로 전환**. 기본 탭 = "내 업체 관리".

## 전제
- 최신 main(STEP 451 + 버튼 라벨 수정). 파일 3개. 새 컴포넌트 1개 → **HMR/Fast Refresh**(안 되면 재시작).

---

## (1) `components/business/BusinessHub.tsx` — 신규 생성
```tsx
'use client';

import { useState } from 'react';
import { Store, ShieldCheck } from 'lucide-react';
import MyBusinessClient from './MyBusinessClient';
import BusinessClaimClient from './BusinessClaimClient';

type Tab = 'manage' | 'claim';

export default function BusinessHub() {
  const [tab, setTab] = useState<Tab>('manage');
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'manage', label: '내 업체 관리', icon: <Store size={16} /> },
    { key: 'claim', label: '새 업체 인증', icon: <ShieldCheck size={16} /> },
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
      {tab === 'manage' ? <MyBusinessClient /> : <BusinessClaimClient />}
    </div>
  );
}
```

---

## (2) `app/business/page.tsx` — 전체 교체 (BusinessHub 사용)
**아래 내용으로 파일 전체 덮어써:**
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BusinessHub from "@/components/business/BusinessHub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "업체 인증·관리 — 트릴리언" };

export default async function BusinessPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-bold text-unjong-primary">업체 인증·관리</h1>
      <p className="mb-6 text-sm leading-relaxed text-unjong-muted">
        금감원에 유사투자자문 신고된 업체만 게재할 수 있어요. 본인 업체를 인증하면, 관리자 확인 후 직접 리딩방·채널 링크를 관리할 수 있습니다.
      </p>
      <BusinessHub />
    </div>
  );
}
```

---

## (3) `components/business/MyBusinessClient.tsx` — 빈 상태 안내 '아래'→'위 탭'
**찾기:**
```tsx
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요. 아래 <b className="text-unjong-primary">새 업체 인증</b>에서 본인 업체를 찾아 인증하세요.</p>
```
**바꾸기:**
```tsx
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요. 위 <b className="text-unjong-primary">새 업체 인증</b> 탭에서 본인 업체를 찾아 인증하세요.</p>
```

---

## 확인 (localhost)
- `/business`: 제목 "업체 인증·관리" 아래 **탭 2개 [내 업체 관리 | 새 업체 인증]**.
- "내 업체 관리" 탭(기본): 인증된 업체 카드(주식회사 이머니). 없으면 "위 새 업체 인증 탭에서 인증하세요".
- "새 업체 인증" 탭: 검색→신청.
- 탭 전환 잘 됨.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 단독 커밋.
