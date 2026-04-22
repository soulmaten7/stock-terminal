# STEP 70 — Section 1 3컬럼 레이아웃 + 우측 컬럼 스켈레톤

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** 직전 커밋 `bea8001` (STEP 69 완료 — Dashboard Spec V3.2 Section 1 우측 컬럼 확정).

**목표:**
Dashboard Home(HomeClient)의 Section 1(최상단 메인 블록)을 3컬럼 레이아웃으로 재배치.
- 좌: 관심종목 (기존 컴포넌트 유지 또는 플레이스홀더)
- 중: 차트·호가·체결 세로 스택 (60% / 25% / 15%)
- 우: **신규** `<StockDetailPanel />` (스냅샷 헤더 + 탭 네비 + 플레이스홀더)

**범위 제한:**
- 탭별 실제 콘텐츠는 STEP 71 이후. 이번엔 스켈레톤만.
- Zustand 스토어 연결, 실제 데이터 바인딩 없음. UI 골격만.

---

## 작업 0 — 현재 구조 파악 (필수 선행)

다음을 순서대로 확인 후 보고:

```bash
# 1) HomeClient 파일 위치 확인
find app components -name "HomeClient.tsx" -type f

# 2) Section 1 관련 컴포넌트 추정 (차트/호가/체결)
grep -rn "차트\|Chart\|OrderBook\|호가\|체결\|Tick" app/ components/ --include="*.tsx" | head -30
```

**판단 기준:**
- HomeClient.tsx(또는 동등한 대시보드 홈 파일) 에서 최상단 메인 블록을 "Section 1"으로 본다.
- 기존에 차트/호가/체결 컴포넌트가 있으면 이름을 기록하고 그대로 재배치.
- 좌측 관심종목 컴포넌트가 이미 있으면 그대로 사용, 없으면 플레이스홀더로 대체.

**중단 조건:** HomeClient.tsx 위치를 못 찾거나 Section 1에 해당하는 블록이 불명확하면 **즉시 중단**하고 현재 파일 트리를 보고.

---

## 작업 1 — `components/dashboard/` 폴더 신규 생성

폴더가 없으면 생성.

```bash
mkdir -p components/dashboard
```

---

## 작업 2 — `components/dashboard/DetailTabs.tsx` 생성

```tsx
'use client';

export type DetailTab = 'overview' | 'news' | 'disclosures' | 'financials';

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'overview',    label: '종합' },
  { id: 'news',        label: '뉴스' },
  { id: 'disclosures', label: '공시' },
  { id: 'financials',  label: '재무' },
];

interface Props {
  activeTab: DetailTab;
  onChange: (tab: DetailTab) => void;
}

export default function DetailTabs({ activeTab, onChange }: Props) {
  return (
    <nav className="flex border-b border-[#E5E7EB] shrink-0" role="tablist">
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 h-10 text-xs transition-colors ${
              active ? 'text-[#0ABAB5] font-bold' : 'text-[#444] hover:text-black'
            }`}
          >
            {tab.label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0ABAB5]"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
```

---

## 작업 3 — `components/dashboard/SnapshotHeader.tsx` 생성

```tsx
'use client';

// TODO(STEP 71+): 선택된 종목 Zustand 스토어 연결, 실제 데이터 바인딩
export default function SnapshotHeader() {
  return (
    <header className="px-4 py-3 border-b border-[#E5E7EB] shrink-0 bg-white">
      <div className="flex items-baseline justify-between mb-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-black truncate">종목명</div>
          <div className="text-[11px] text-[#999]">000000</div>
        </div>
        <div className="text-right shrink-0 ml-3">
          <div className="text-lg font-bold text-black">--</div>
          <div className="text-[11px] text-[#999]">--%</div>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px] text-[#666]">
        <div><dt className="inline text-[#999]">시 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">고 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">저 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">거래량 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">시총 </dt><dd className="inline">--</dd></div>
        <div><dt className="inline text-[#999]">PER </dt><dd className="inline">--</dd></div>
      </dl>
    </header>
  );
}
```

---

## 작업 4 — `components/dashboard/StockDetailPanel.tsx` 생성

```tsx
'use client';

import { useState } from 'react';
import SnapshotHeader from './SnapshotHeader';
import DetailTabs, { type DetailTab } from './DetailTabs';

const TAB_LABEL: Record<DetailTab, string> = {
  overview:    '종합',
  news:        '뉴스',
  disclosures: '공시',
  financials:  '재무',
};

export default function StockDetailPanel() {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  return (
    <aside className="flex flex-col h-full bg-white border-l border-[#E5E7EB] min-w-0">
      <SnapshotHeader />
      <DetailTabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto p-4">
        {/* TODO(STEP 71+): 탭별 실제 콘텐츠 — 종합/뉴스/공시/재무 */}
        <div className="text-center py-8 text-xs text-[#999]">
          Coming soon — {TAB_LABEL[activeTab]}
        </div>
      </div>
    </aside>
  );
}
```

---

## 작업 5 — HomeClient.tsx Section 1 3컬럼 레이아웃 변경

**현재 Section 1 구조 파악 후, 아래 구조로 재배치:**

```tsx
{/* Section 1 — 3컬럼 (좌:관심종목 / 중:차트·호가·체결 / 우:종목 상세) */}
<section className="grid grid-cols-[280px_1fr_360px] gap-0 h-[680px] border border-[#E5E7EB] bg-white">
  {/* 좌 — 관심종목 */}
  <div className="border-r border-[#E5E7EB] min-w-0 overflow-hidden">
    {/* 기존 관심종목 컴포넌트 그대로. 없으면 플레이스홀더: */}
    {/* <div className="p-4 text-xs text-[#999]">관심종목 (STEP 71+)</div> */}
  </div>

  {/* 중 — 차트 60% / 호가 25% / 체결 15% */}
  <div className="flex flex-col min-w-0 overflow-hidden">
    <div className="basis-[60%] shrink-0 border-b border-[#E5E7EB] min-h-0 overflow-hidden">
      {/* 기존 차트 컴포넌트 */}
    </div>
    <div className="basis-[25%] shrink-0 border-b border-[#E5E7EB] min-h-0 overflow-hidden">
      {/* 기존 호가창 컴포넌트 (없으면 플레이스홀더) */}
    </div>
    <div className="basis-[15%] shrink-0 min-h-0 overflow-hidden">
      {/* 기존 체결창 컴포넌트 (없으면 플레이스홀더) */}
    </div>
  </div>

  {/* 우 — 종목 상세 (신규) */}
  <StockDetailPanel />
</section>
```

**수정 규칙:**
- 기존 차트·호가·체결 컴포넌트 이름을 작업 0에서 확인한 대로 그대로 사용 (주석 위치에 배치).
- 이미 존재하는 컴포넌트를 제거하거나 개명하지 말 것. **재배치만** 한다.
- import 최상단에 `import StockDetailPanel from '@/components/dashboard/StockDetailPanel';` 추가.
- 기존 Section 2 이하는 건드리지 말 것.

**좌측 관심종목 처리:**
- HomeClient에 기존 관심종목 컴포넌트가 임포트돼 있으면 그대로 좌측 div 안에 넣는다.
- 없으면 `<div className="p-4 text-xs text-[#999]">관심종목 (STEP 71+)</div>` 플레이스홀더.

**빈 플레이스홀더가 필요한 경우 공통 포맷:**
```tsx
<div className="h-full flex items-center justify-center text-[11px] text-[#BBB]">
  [플레이스홀더 — 영역명]
</div>
```

---

## 작업 6 — 빌드 검증

```bash
npm run build
```

**에러 발생 시 즉시 중단**하고 로그 공유. 임의 수정 금지.

**경고 확인:**
- Section 1 높이 `h-[680px]` 고정 — 추후 반응형 검토 필요하지만 이번엔 고정.
- 기존 컴포넌트 이름이 다르거나 JSX 구조가 예상과 달라 적용이 애매하면 즉시 중단 후 현 파일 내용 보고.

---

## 작업 7 — 문서 4개 갱신

- `CLAUDE.md` 상단 날짜 `2026-04-22` 확인 (오늘이면 스킵)
- `docs/CHANGELOG.md` 상단에 엔트리 추가:
  ```
  - feat(dashboard): Section 1 3컬럼 레이아웃 + 우측 종목상세 패널 스켈레톤 (STEP 70)
  ```
- `session-context.md`:
  - STEP 70 완료 블록 추가
  - TODO 업데이트: "STEP 71 — 우측 컬럼 탭별 실제 콘텐츠 (종합 탭 먼저)"
- `docs/NEXT_SESSION_START.md`: 다음 할 일 = STEP 71, 최신 커밋 해시 반영

---

## 작업 8 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): Section 1 3컬럼 + 우측 종목상세 패널 스켈레톤 (STEP 70)

- components/dashboard/ 폴더 신설
- StockDetailPanel.tsx: 우측 컬럼 컨테이너 (스냅샷+탭+플레이스홀더)
- SnapshotHeader.tsx: 상단 ~100px 고정 스냅샷 (데이터 TODO)
- DetailTabs.tsx: 탭 네비 바 (종합/뉴스/공시/재무, 하단 2px 틸 바)
- HomeClient Section 1 = 3컬럼 grid (280 / 1fr / 360)
- 중앙 컬럼 세로 스택 60% / 25% / 15%
- 탭 콘텐츠와 스토어 연결은 STEP 71 이후

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 70 완료
- components/dashboard/ 폴더 생성
- StockDetailPanel.tsx / SnapshotHeader.tsx / DetailTabs.tsx 신규
- HomeClient Section 1 = 3컬럼 grid 적용
- 중앙 컬럼 60/25/15 세로 분할
- 기존 컴포넌트 배치: 좌=<...> / 중(차트)=<...> / 중(호가)=<...> / 중(체결)=<...>
- npm run build: 성공
- 4개 문서 날짜/엔트리/TODO 갱신
- git commit: <hash>
- git push: success
```

빌드 실패 또는 기존 구조 불명확 시 즉시 중단, 로그/현 상태 보고.

---

## 주의사항

- **기존 로직/상태 수정 금지** — 이번엔 순수 레이아웃 재배치 + 신규 컴포넌트 3개만.
- **TopNav / TickerBar / Header 건드리지 말 것** — STEP 68 결과 그대로 유지.
- **탭 콘텐츠 실제 구현 금지** — "Coming soon" 플레이스홀더 유지. STEP 71 예약.
- **높이 고정(680px)**: 추후 반응형 필요하지만 이번엔 안전하게 고정값.
- **반응형 브레이크포인트**: 1280px 미만 테스트는 STEP 72 이후 별도.
