# STEP 71 — 선택 종목 스토어 + 종합 탭 구조 골격

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** 직전 커밋 `fb0b6ac` (STEP 70 완료 — Section 1 3컬럼 + 우측 스켈레톤).

**목표:**
1. `selectedSymbol` Zustand 스토어 신규 생성
2. `WatchlistWidget` 항목 클릭 시 스토어 업데이트
3. `SnapshotHeader` 가 스토어를 구독하여 **종목명 / 코드만** 표시 (가격 등 시세 데이터는 STEP 72)
4. "종합" 탭 콘텐츠 영역에 **5개 블록 구조**를 박음 (블록 1 "핵심 투자지표"는 스냅샷 확장 스타일로 placeholder, 블록 2~5는 "Coming soon")

**범위 제한 (매우 중요):**
- 실제 시세·뉴스·공시·재무·수급 **데이터 fetch 금지** — STEP 72 이후 블록별 단계적 연결.
- 새 API 라우트 추가 금지.
- 기존 WatchlistWidget의 데이터 로직/스타일 건드리지 말 것 — **클릭 핸들러 연결만** 추가.

---

## 작업 0 — 현재 상태 파악 (필수 선행)

순서대로 실행 후 보고:

```bash
# 1) 기존 스토어 구조 확인
ls stores/

# 2) WatchlistWidget 위치와 내부 구조 확인
find components -name "WatchlistWidget*" -type f
```

**확인 항목:**
- `stores/` 안에 선택 종목 관련 스토어가 이미 있는지 (`selected*`, `symbol*`, `ticker*`)
- `WatchlistWidget` 컴포넌트에서 **각 종목 항목의 클릭 가능한 요소**(`<button>`, `<Link>`, `<div onClick>`) 확인
- 종목 코드·이름·시장(KR/US) 정보를 어디서 가져오는지

**중단 조건:**
- 동일 목적의 스토어가 이미 존재하면 **중단** 후 보고 (신설 대신 확장)
- WatchlistWidget 클릭 영역이 이미 다른 페이지 네비게이션(`router.push` 등)에 쓰이고 있으면 중단 후 보고

---

## 작업 1 — `stores/selectedSymbolStore.ts` 신규 생성

```ts
'use client';

import { create } from 'zustand';

export type Market = 'KR' | 'US';

export interface SelectedSymbol {
  code: string;      // 예: '005930' (KR), 'AAPL' (US)
  name: string;      // 종목명
  market: Market;
}

interface SelectedSymbolState {
  selected: SelectedSymbol | null;
  setSelected: (symbol: SelectedSymbol | null) => void;
}

export const useSelectedSymbolStore = create<SelectedSymbolState>((set) => ({
  selected: null,
  setSelected: (symbol) => set({ selected: symbol }),
}));
```

**주의:** 기존 다른 스토어(watchlistStore 등)와 충돌하지 않도록 파일명·export 이름 동일 중복 금지.

---

## 작업 2 — `WatchlistWidget` 에 클릭 핸들러 연결

**작업 0에서 확인한 구조에 따라 아래 두 경우로 분기:**

### Case A — 각 종목 항목이 `<Link href="/stocks/[code]">` 형태
- Link를 유지하되, `onClick` 핸들러를 추가로 부착:
  ```tsx
  import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
  // ...
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  <Link
    href={...}
    onClick={() => setSelected({ code: item.code, name: item.name, market: item.market })}
  >
  ```
- 기존 네비게이션 동작은 그대로 유지 (preventDefault 금지).

### Case B — 각 종목 항목이 단순 `<div>` 또는 `<button>`
- `onClick` 추가:
  ```tsx
  <button onClick={() => setSelected({ code: item.code, name: item.name, market: item.market })} ...>
  ```
- 기존 스타일/레이아웃 유지.

**`market` 값 결정:**
- 기존 데이터에 시장 구분 필드가 있으면 그대로 사용.
- 없으면 종목코드 정규식으로 추정: `/^\d{6}$/` → `'KR'`, 그 외 → `'US'`
- 추정 로직은 WatchlistWidget 내부가 아닌, **별도 헬퍼 함수**로 추출 (예: 컴포넌트 하단 `function inferMarket(code: string): Market`)

---

## 작업 3 — `SnapshotHeader` 스토어 연결 (종목명·코드만)

`components/dashboard/SnapshotHeader.tsx` 교체:

```tsx
'use client';

import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

// TODO(STEP 72+): 시세·지표 데이터 페치 훅 연결
export default function SnapshotHeader() {
  const selected = useSelectedSymbolStore((s) => s.selected);

  return (
    <header className="px-4 py-3 border-b border-[#E5E7EB] shrink-0 bg-white">
      <div className="flex items-baseline justify-between mb-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-black truncate">
            {selected?.name ?? '종목을 선택하세요'}
          </div>
          <div className="text-[11px] text-[#999]">
            {selected?.code ?? '—'}
            {selected?.market && <span className="ml-1 text-[#BBB]">· {selected.market}</span>}
          </div>
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

**변경 요약:** 종목명·코드·시장 구분만 스토어에서 읽어 표시. 가격·등락·시고저 등은 여전히 `--` placeholder 유지.

---

## 작업 4 — "종합" 탭 콘텐츠 구조 골격

`components/dashboard/StockDetailPanel.tsx` 수정:
- "Coming soon" 단일 텍스트를 **탭별 콘텐츠 컴포넌트 라우팅**으로 교체
- `overview` 탭은 5개 블록 구조 렌더
- 나머지 탭은 기존처럼 단일 "Coming soon"

**신규 파일: `components/dashboard/tabs/OverviewTab.tsx`**

```tsx
'use client';

export default function OverviewTab() {
  return (
    <div className="divide-y divide-[#E5E7EB]">
      {/* 블록 1: 핵심 투자지표 */}
      <section className="py-3">
        <h4 className="text-[11px] font-bold text-[#444] mb-2 tracking-wide">핵심 투자지표</h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <Metric label="PER" value="--" />
          <Metric label="PBR" value="--" />
          <Metric label="시총" value="--" />
          <Metric label="배당수익률" value="--" />
          <Metric label="52주 신고" value="--" />
          <Metric label="52주 신저" value="--" />
        </dl>
      </section>

      {/* 블록 2: 투자자 수급 미니 (🇰🇷 전용, US 시 숨김) */}
      <ComingSoon title="투자자 수급 🇰🇷" note="외인 / 기관 / 개인 순매수 (STEP 72)" />

      {/* 블록 3: 뉴스 하이라이트 3건 */}
      <ComingSoon title="뉴스 하이라이트" note="최근 3건 (STEP 72)" />

      {/* 블록 4: 공시 하이라이트 3건 */}
      <ComingSoon title="공시 하이라이트" note="최근 3건 (STEP 72)" />

      {/* 블록 5: 재무 미니 */}
      <ComingSoon title="재무 미니" note="매출·영업이익 4분기 (STEP 72)" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-[#999]">{label}</dt>
      <dd className="font-medium text-black tabular-nums">{value}</dd>
    </div>
  );
}

function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <section className="py-3">
      <h4 className="text-[11px] font-bold text-[#444] mb-1 tracking-wide">{title}</h4>
      <p className="text-[11px] text-[#BBB]">{note}</p>
    </section>
  );
}
```

**`StockDetailPanel.tsx` 수정:**

```tsx
'use client';

import { useState } from 'react';
import SnapshotHeader from './SnapshotHeader';
import DetailTabs, { type DetailTab } from './DetailTabs';
import OverviewTab from './tabs/OverviewTab';

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
      <div className="flex-1 overflow-y-auto px-4">
        {activeTab === 'overview' ? (
          <OverviewTab />
        ) : (
          <div className="text-center py-8 text-xs text-[#999]">
            Coming soon — {TAB_LABEL[activeTab]}
          </div>
        )}
      </div>
    </aside>
  );
}
```

---

## 작업 5 — 빌드 검증

```bash
npm run build
```

**에러 발생 시 즉시 중단**하고 로그 공유. 임의 수정 금지.

---

## 작업 6 — 스모크 테스트 (수동 UI 검증, 선택사항)

빌드 성공 후 `npm run dev` 로 홈 띄워서 확인 (터미널 로그만 보는 게 아니라면):
- 좌측 WatchlistWidget 항목 클릭 → 우측 SnapshotHeader 종목명/코드 갱신되는지
- "종합" 탭에 5개 블록 헤더 보이는지 (투자지표 + 4개 Coming soon)
- 뉴스/공시/재무 탭 클릭 시 기존 Coming soon 메시지 유지되는지

UI 확인 어려우면 **이 작업 스킵 가능** — 빌드 성공만으로 다음 단계 진행.

---

## 작업 7 — 문서 4개 갱신

- `CLAUDE.md` 상단 날짜 `2026-04-22` (이미 맞으면 스킵)
- `docs/CHANGELOG.md` 상단 엔트리 추가:
  ```
  - feat(dashboard): selectedSymbolStore + 종합 탭 5블록 구조 골격 (STEP 71)
  ```
- `session-context.md`:
  - STEP 71 완료 블록 추가
  - TODO 업데이트: "STEP 72 — 종합 탭 실데이터 연결 (투자지표·수급·뉴스·공시·재무 순차)"
- `docs/NEXT_SESSION_START.md`: 다음 할 일 = STEP 72, 최신 커밋 해시 반영

---

## 작업 8 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): selectedSymbolStore + 종합 탭 5블록 구조 골격 (STEP 71)

- stores/selectedSymbolStore.ts: 선택 종목 Zustand 스토어 (code/name/market)
- WatchlistWidget 클릭 시 스토어 업데이트 (네비게이션 동작은 유지)
- SnapshotHeader: 스토어 구독, 종목명/코드/시장 반영 (가격은 TODO)
- components/dashboard/tabs/OverviewTab.tsx 신설
- 종합 탭 = 5블록 구조 (투자지표 placeholder + 4 Coming soon)
- 뉴스/공시/재무 탭은 기존 Coming soon 유지

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 71 완료
- stores/selectedSymbolStore.ts 생성
- WatchlistWidget 클릭 핸들러 연결 (Case A/B 중 <?>)
- SnapshotHeader 스토어 연결 (종목명/코드/시장)
- components/dashboard/tabs/OverviewTab.tsx 신설
- StockDetailPanel 탭 라우팅 (overview만 실체, 나머지 placeholder)
- npm run build: 성공
- 4개 문서 갱신
- git commit: <hash>
- git push: success

다음 STEP 72: 종합 탭 실데이터 순차 연결
```

---

## 주의사항

- **스토어 중복 금지** — 이미 동일 목적 스토어가 있으면 작업 중단 후 보고.
- **WatchlistWidget 로직 보존** — 클릭 시 기존 네비게이션(다른 페이지 이동 등)이 동작했다면 그대로 유지. 스토어 업데이트만 병행.
- **데이터 fetch 금지** — 이번 STEP은 UI·상태 연결만. 실제 가격/뉴스/공시/재무 데이터 fetch 는 STEP 72 이후.
- **탭 전환 상태 초기화**: 종목 변경 시 activeTab을 'overview'로 초기화할지는 **이번 STEP에서 결정 안 함** (STEP 72에서 사용자 피드백 보고 결정).
- **시장 추정 헬퍼** `inferMarket` 은 향후 다른 곳에서도 쓸 수 있으니, STEP 72 이후 `lib/` 로 이동 검토. 이번엔 WatchlistWidget 내부 로컬 헬퍼로 OK.
