<!-- 2026-06-28 -->
# STEP 453 — /business 탭 순서·이름·스마트 기본탭

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_453_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. 탭 순서 뒤집기 → **[업체 인증 | 내 업체 관리]** (인증 먼저, 제목 "업체 인증·관리"와 일치 + 자연 흐름).
2. 이름 **"새 업체 인증" → "업체 인증"** ("새"는 새로 만드는 게 아니라 오해 — 신고된 업체를 본인 것으로 인증).
3. **스마트 기본탭**: 인증된 업체 있으면 '내 업체 관리', 없으면 '업체 인증'.

## 전제
- 최신 main(STEP 452). 파일 2개, 클라이언트 → **HMR(새로고침)**.

---

## (1) `components/business/BusinessHub.tsx` — 전체 교체
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

## (2) `components/business/MyBusinessClient.tsx` — 빈 상태 안내 '새 업체 인증'→'업체 인증'
**찾기:**
```tsx
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요. 위 <b className="text-unjong-primary">새 업체 인증</b> 탭에서 본인 업체를 찾아 인증하세요.</p>
```
**바꾸기:**
```tsx
        <p className="text-sm text-unjong-muted">아직 인증한 업체가 없어요. 위 <b className="text-unjong-primary">업체 인증</b> 탭에서 본인 업체를 찾아 인증하세요.</p>
```

---

## 확인 (localhost, HMR — 새로고침)
- `/business`: 탭이 **[업체 인증 | 내 업체 관리]** 순서, "새" 빠짐.
- 인증된 업체 있는 계정(주식회사 이머니) → 열면 **자동으로 "내 업체 관리"** 탭.
- 인증된 업체 없는 계정 → **"업체 인증"** 탭이 기본.
- 탭 전환 정상.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 확인 후 STEP 451~453 묶어 커밋(또는 단독).
