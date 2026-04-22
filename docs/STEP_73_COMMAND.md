# STEP 73 — 뉴스·공시·재무 탭 상세 콘텐츠 구현

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 72 완료 — 종합 탭 5블록 실데이터 연결, 뉴스·공시·재무 탭은 placeholder 상태.

**목표:**
우측 종목상세 패널의 3개 탭(뉴스 / 공시 / 재무)에 실제 리스트·테이블 UI 구현. 데이터 소스는 STEP 72에서 확인된 훅을 재활용.

**범위 제한:**
- 새 API 라우트 추가 금지 (기존 것만 재활용). 없는 블록은 TODO + placeholder.
- 무한 스크롤/페이지네이션 도입 금지 — 상위 N건 단순 fetch.
- 차트 라이브러리 추가 설치 금지 — 재무 탭도 순수 CSS/HTML 테이블로.

---

## 작업 0 — 전제 확인

```bash
# STEP 72 에서 확인된 뉴스/공시/재무 훅 파일명 재확인
ls components/dashboard/tabs/
grep -rn "useNews\|useFilings\|useDisclosures\|useFinancial" lib/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20
```

STEP 72 완료 보고서에서 기록된 블록별 (a/b/c) 상태를 그대로 사용. 소스 (c) 블록은 이번에도 placeholder.

---

## 작업 1 — `components/dashboard/tabs/NewsTab.tsx` 신규

```tsx
'use client';

import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
// TODO(STEP 73 작업 0에서 확인한 훅): import useNewsFeed ...

const MAX_ITEMS = 50;

export default function NewsTab() {
  const selected = useSelectedSymbolStore((s) => s.selected);

  if (!selected) {
    return <EmptyState message="좌측에서 종목을 선택하세요" />;
  }

  // TODO(data): 선택 종목 기준 뉴스 훅 연결. 없으면 아래 placeholder.
  // const { data: items, isLoading, error } = useNewsFeed({ code: selected.code, limit: MAX_ITEMS });

  // 일단 스켈레톤:
  return (
    <div className="py-3 space-y-2">
      <ListPlaceholder count={5} />
      <p className="text-[11px] text-[#BBB] text-center pt-4">
        뉴스 데이터 연결은 STEP 73 작업 0에서 확인된 훅으로 이어짐.
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-8 text-center text-xs text-[#999]">{message}</div>;
}

function ListPlaceholder({ count }: { count: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="border-b border-[#F0F0F0] pb-2 last:border-0">
          <div className="h-3 bg-[#F5F5F5] rounded w-5/6 mb-1" />
          <div className="h-2 bg-[#F5F5F5] rounded w-1/3" />
        </li>
      ))}
    </ul>
  );
}
```

**실제 훅 연결 시 치환:**

```tsx
if (isLoading) return <ListPlaceholder count={5} />;
if (error)     return <EmptyState message="뉴스를 불러오지 못했습니다" />;
if (!items?.length) return <EmptyState message="최근 뉴스가 없습니다" />;

return (
  <ul className="py-2 divide-y divide-[#F0F0F0]">
    {items.slice(0, MAX_ITEMS).map((n) => (
      <li key={n.id ?? n.url} className="py-2">
        <a href={n.url} target="_blank" rel="noopener noreferrer" className="block hover:bg-[#F9F9F9] -mx-2 px-2 py-1 rounded">
          <div className="text-xs text-black font-medium line-clamp-2 mb-0.5">{n.title}</div>
          <div className="text-[10px] text-[#999] flex gap-2">
            <span>{formatRelativeTime(n.publishedAt)}</span>
            <span>·</span>
            <span className="truncate">{n.source}</span>
          </div>
        </a>
      </li>
    ))}
  </ul>
);

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.floor((now - t) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR');
}
```

---

## 작업 2 — `components/dashboard/tabs/DisclosuresTab.tsx` 신규

구조는 NewsTab과 동일. 시장 분기(KR=DART, US=SEC) 추가:

```tsx
'use client';

import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

const MAX_ITEMS = 50;

export default function DisclosuresTab() {
  const selected = useSelectedSymbolStore((s) => s.selected);

  if (!selected) {
    return <div className="py-8 text-center text-xs text-[#999]">좌측에서 종목을 선택하세요</div>;
  }

  // TODO(data): 시장별 공시 훅 연결
  // const { data: items, isLoading } = useDisclosures({ code: selected.code, market: selected.market, limit: MAX_ITEMS });
  const sourceLabel = selected.market === 'KR' ? 'DART' : 'SEC';

  return (
    <div className="py-3">
      <div className="text-[10px] text-[#999] mb-2">출처: {sourceLabel}</div>
      <ListPlaceholder count={5} />
      <p className="text-[11px] text-[#BBB] text-center pt-4">
        {sourceLabel} 공시 데이터 연결 — 기존 DartFilingsWidget 훅 재활용.
      </p>
    </div>
  );
}

function ListPlaceholder({ count }: { count: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="border-b border-[#F0F0F0] pb-2 last:border-0">
          <div className="h-3 bg-[#F5F5F5] rounded w-4/6 mb-1" />
          <div className="h-2 bg-[#F5F5F5] rounded w-1/4" />
        </li>
      ))}
    </ul>
  );
}
```

**실제 훅 연결 시 포맷:**
- 공시명 (text-xs, black, font-medium, line-clamp-2)
- 제출일 (text-[10px], #999, 상대 시간) · 제출자 (text-[10px], #999)
- 클릭 시 원문 새 탭

---

## 작업 3 — `components/dashboard/tabs/FinancialsTab.tsx` 신규

3개 서브 섹션. 각각 최근 4~5분기 테이블.

```tsx
'use client';

import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

export default function FinancialsTab() {
  const selected = useSelectedSymbolStore((s) => s.selected);

  if (!selected) {
    return <div className="py-8 text-center text-xs text-[#999]">좌측에서 종목을 선택하세요</div>;
  }

  // TODO(data): 재무 훅 연결
  // const { data } = useFinancials({ code: selected.code, market: selected.market });

  return (
    <div className="py-3 space-y-5">
      <Section title="손익계산서">
        <FinancialTable
          rows={[
            { label: '매출',     values: ['--', '--', '--', '--'] },
            { label: '영업이익', values: ['--', '--', '--', '--'] },
            { label: '순이익',   values: ['--', '--', '--', '--'] },
            { label: 'EPS',      values: ['--', '--', '--', '--'] },
          ]}
          periods={['24Q1', '24Q2', '24Q3', '24Q4']}
        />
      </Section>

      <Section title="재무상태표">
        <FinancialTable
          rows={[
            { label: '자산총계', values: ['--', '--', '--', '--'] },
            { label: '부채총계', values: ['--', '--', '--', '--'] },
            { label: '자본총계', values: ['--', '--', '--', '--'] },
          ]}
          periods={['24Q1', '24Q2', '24Q3', '24Q4']}
        />
      </Section>

      <Section title="현금흐름표">
        <FinancialTable
          rows={[
            { label: '영업활동', values: ['--', '--', '--', '--'] },
            { label: '투자활동', values: ['--', '--', '--', '--'] },
            { label: '재무활동', values: ['--', '--', '--', '--'] },
          ]}
          periods={['24Q1', '24Q2', '24Q3', '24Q4']}
        />
      </Section>

      <p className="text-[11px] text-[#BBB] text-center">
        재무 데이터 연결 — 기존 재무 훅 있으면 치환, 없으면 STEP 74 이후 API 보강.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="text-[11px] font-bold text-[#444] mb-2 tracking-wide">{title}</h4>
      {children}
    </section>
  );
}

function FinancialTable({
  rows,
  periods,
}: {
  rows: { label: string; values: string[] }[];
  periods: string[];
}) {
  return (
    <table className="w-full text-[11px] tabular-nums">
      <thead>
        <tr className="text-[#999]">
          <th className="text-left font-normal py-1"></th>
          {periods.map((p) => (
            <th key={p} className="text-right font-normal py-1">{p}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-t border-[#F0F0F0]">
            <td className="py-1.5 text-[#444]">{row.label}</td>
            {row.values.map((v, i) => (
              <td key={i} className="py-1.5 text-right text-black">{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**실제 훅 연결 시:**
- 매출/영업이익/순이익 등 금액 → `억`/`조` 단위 축약 포매터 적용
- EPS → 원/$ 원단위 유지
- 증감률 컬럼 추가 옵션 (YoY 또는 QoQ)

---

## 작업 4 — `StockDetailPanel` 탭 라우팅 확장

`components/dashboard/StockDetailPanel.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import SnapshotHeader from './SnapshotHeader';
import DetailTabs, { type DetailTab } from './DetailTabs';
import OverviewTab from './tabs/OverviewTab';
import NewsTab from './tabs/NewsTab';
import DisclosuresTab from './tabs/DisclosuresTab';
import FinancialsTab from './tabs/FinancialsTab';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

export default function StockDetailPanel() {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const selectedCode = useSelectedSymbolStore((s) => s.selected?.code);

  // 종목 변경 시 overview로 복귀 (STEP 72 에서 이미 도입)
  useEffect(() => { setActiveTab('overview'); }, [selectedCode]);

  return (
    <aside className="flex flex-col h-full bg-white border-l border-[#E5E7EB] min-w-0">
      <SnapshotHeader />
      <DetailTabs activeTab={activeTab} onChange={setActiveTab} />
      <div className="flex-1 overflow-y-auto px-4">
        {activeTab === 'overview'    && <OverviewTab onNavigateTab={setActiveTab} />}
        {activeTab === 'news'        && <NewsTab />}
        {activeTab === 'disclosures' && <DisclosuresTab />}
        {activeTab === 'financials'  && <FinancialsTab />}
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

---

## 작업 6 — 문서 4개 갱신

- `CLAUDE.md` 날짜
- `docs/CHANGELOG.md` 상단:
  ```
  - feat(dashboard): 뉴스·공시·재무 탭 상세 콘텐츠 (STEP 73)
  ```
- `session-context.md`: STEP 73 완료 블록 + TODO 갱신
- `docs/NEXT_SESSION_START.md`: 다음 = STEP 74

---

## 작업 7 — Git commit & push

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): 뉴스·공시·재무 탭 상세 콘텐츠 (STEP 73)

- NewsTab.tsx: 선택 종목 뉴스 리스트 (상위 50, 원문 새 탭)
- DisclosuresTab.tsx: KR=DART / US=SEC 공시 리스트
- FinancialsTab.tsx: 손익·재무상태·현금흐름 3섹션 4분기 테이블
- StockDetailPanel 탭 라우팅 확장 (overview/news/disclosures/financials)
- 데이터 소스 없는 블록은 스켈레톤 + TODO 유지

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 73 완료
- NewsTab / DisclosuresTab / FinancialsTab 3개 신규
- StockDetailPanel 탭 라우팅 확장
- 탭별 데이터 연결 상태:
  · 뉴스: (a/b/c) / <훅 이름>
  · 공시: (a/b/c) / <훅 이름>
  · 재무: (a/b/c) / <훅 이름>
- npm run build: 성공
- 4개 문서 갱신
- git commit: <hash>
- git push: success
```

---

## 주의사항

- **스크롤 영역** — 각 탭 컨테이너는 `StockDetailPanel` 부모가 `overflow-y-auto` 처리하므로 내부 자식은 자연스럽게 흐름.
- **line-clamp** — Tailwind 기본 지원 없으면 `@tailwindcss/line-clamp` 플러그인 필요. 없으면 `truncate` + `whitespace-nowrap` 2줄 처리 대안.
- **일자 포매팅** — 한국어 `toLocaleDateString('ko-KR')` 기본. 시장별 로케일 분기는 STEP 74 이후.
- **재무 포매터** — 금액 축약(`억`/`조`) 유틸이 기존 `lib/format.ts` 같은 곳에 있으면 재활용. 없으면 이번 파일 내부 로컬 헬퍼.
