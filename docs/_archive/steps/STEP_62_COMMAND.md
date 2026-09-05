# STEP 62 — NewsFeedWidget + /news 폴리싱

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표:**
1. `NewsFeedWidget` 위젯: 종목 태그 하이라이트, 소스별 배지 색상 확장, 'href 파라미터로 소스/타입 프리셋' 지원.
2. `/news` 페이지: 기간 필터 세그먼트(1h/24h/7d) + 중요 공시만 토글 추가, 정렬 옵션(시간/중요도).
3. 위젯 클릭 → `/news?source=한국경제` 형식으로 프리셋 이동.

**전제 상태 (직전 커밋):** STEP 61 완료 (사이드바 5그룹)

---

## 1. NewsFeedWidget 개선 — `components/widgets/NewsFeedWidget.tsx`

전체 파일을 아래 내용으로 교체:

```typescript
'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface NewsItem {
  source: string;
  title: string;
  link: string;
  pubDate: string;
  timeAgo: string;
  stockTags?: string[];
}

const SOURCE_COLOR: Record<string, string> = {
  '한국경제': 'bg-[#0066CC]/10 text-[#0066CC]',
  '매일경제': 'bg-[#CC0000]/10 text-[#CC0000]',
  '이데일리': 'bg-[#009900]/10 text-[#009900]',
  '서울경제': 'bg-[#6600CC]/10 text-[#6600CC]',
  '연합뉴스': 'bg-[#FF6600]/10 text-[#FF6600]',
  '조선비즈': 'bg-[#333]/10 text-[#333]',
};

interface Props { size?: 'default' | 'large' }

export default function NewsFeedWidget({ size = 'default' }: Props = {}) {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/home/news')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="뉴스 속보" subtitle="한경 · 매경 · 이데일리" href="/news" size={size}>
      {loading && (
        <div className="flex items-center justify-center h-24 text-xs text-[#999]">로딩 중…</div>
      )}
      {error && (
        <div className="flex items-center justify-center h-24 text-xs text-[#FF3B30]">
          뉴스를 불러오지 못했습니다
        </div>
      )}
      {!loading && !error && (
        <ul aria-label="뉴스 목록" className="divide-y divide-[#F0F0F0]">
          {items.length === 0 && (
            <li className="px-3 py-4 text-xs text-[#999] text-center">뉴스 없음</li>
          )}
          {items.map((n, i) => (
            <li key={i} className="px-3 py-2 hover:bg-[#F8F9FA]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <a
                  href={`/news?source=${encodeURIComponent(n.source)}`}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SOURCE_COLOR[n.source] ?? 'bg-[#F0F0F0] text-[#666]'}`}
                >
                  {n.source}
                </a>
                {n.timeAgo && <span className="text-[10px] text-[#BBBBBB]">{n.timeAgo}</span>}
                {n.stockTags && n.stockTags.length > 0 && (
                  <span className="flex gap-0.5">
                    {n.stockTags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] text-[#0ABAB5] font-bold">#{tag}</span>
                    ))}
                  </span>
                )}
              </div>
              {n.link ? (
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-black leading-snug line-clamp-2 hover:text-[#0ABAB5] hover:underline"
                >
                  {n.title}
                </a>
              ) : (
                <p className="text-sm text-black leading-snug line-clamp-2">{n.title}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
```

---

## 2. NewsClient URL 파라미터 지원 — `components/news/NewsClient.tsx`

기존 파일 상단에 `useSearchParams` import 추가 후 초기 `filters` state 를 URL 파라미터로 초기화.

**Edit 1:** 최상단 import 교체

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsFeed from './NewsFeed';
import NewsFilter from './NewsFilter';
```

**Edit 2:** `export default function NewsClient()` 내부 초기 state 를 아래 형태로 교체

```typescript
export default function NewsClient() {
  const sp = useSearchParams();
  const initSource = sp.get('source');
  const initTab = (['all', 'news', 'disclosure'].includes(sp.get('tab') || '')
    ? sp.get('tab')
    : 'all') as 'all' | 'news' | 'disclosure';

  const [mounted, setMounted] = useState(false);
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [filters, setFilters] = useState<Filters>({
    tab: initTab,
    sources: initSource ? [initSource] : ALL_SOURCES,
    disclosureTypes: [],
    keyword: '',
  });
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'all'>('all');
  const [onlyImportant, setOnlyImportant] = useState(false);
```

**Edit 3:** `filtered` 계산부를 아래로 교체

```typescript
  const now = Date.now();
  const rangeMs: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    all: Infinity,
  };

  const filtered = allItems.filter((item) => {
    if (filters.tab === 'news' && item.type !== 'news') return false;
    if (filters.tab === 'disclosure' && item.type !== 'disclosure') return false;
    if (item.type === 'news' && filters.sources.length > 0 && !filters.sources.includes(item.source)) return false;
    if (filters.keyword && !item.title.includes(filters.keyword) && !(item.corpName || '').includes(filters.keyword)) return false;
    if (onlyImportant && !item.isImportant) return false;
    if (timeRange !== 'all' && item.sortKey) {
      const ts = new Date(item.sortKey).getTime();
      if (!isNaN(ts) && now - ts > rangeMs[timeRange]) return false;
    }
    return true;
  });
```

**Edit 4:** 리턴 영역의 `<div className="flex gap-6">` 바로 위 (`<h1>` 다음) 에 아래 컨트롤 블록 삽입

```tsx
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(['1h', '24h', '7d', 'all'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`text-xs font-bold px-3 py-2 transition-colors ${
                timeRange === r
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {r === 'all' ? '전체' : r}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-[#333] cursor-pointer">
          <input
            type="checkbox"
            checked={onlyImportant}
            onChange={(e) => setOnlyImportant(e.target.checked)}
            className="accent-[#FF3B30]"
          />
          중요 공시만
        </label>
        <span className="text-xs text-[#888] ml-auto">{filtered.length}건</span>
      </div>
```

**Edit 5:** `NewsClient` 컴포넌트 export 를 Suspense 래핑

기존 `export default function NewsClient()` 은 그대로 두고 파일 최하단에 추가 export 금지. 대신 `app/news/page.tsx` 에서 Suspense wrapper 처리 (아래 3번 참고).

---

## 3. `app/news/page.tsx` Suspense 래핑

```typescript
import type { Metadata } from 'next';
import { Suspense } from 'react';
import NewsClient from '@/components/news/NewsClient';

export const metadata: Metadata = { title: '뉴스·공시 — StockTerminal' };

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 py-8"><div className="h-12 bg-[#F0F0F0] animate-pulse" /></div>}>
      <NewsClient />
    </Suspense>
  );
}
```

---

## 4. 검증

```bash
cd ~/Desktop/OTMarketing
npm run build
```

`/news`, `/news?source=한국경제`, `/news?tab=disclosure` 각각 확인.

커밋 + push:

```bash
git add -A
git commit -m "feat(news): 위젯 소스 배지 + URL 프리셋, 페이지에 기간/중요 필터

- NewsFeedWidget: 소스 배지 클릭 시 /news?source= 프리셋, 종목태그 # 표시
- NewsClient: 1h/24h/7d/전체 기간 세그먼트 + 중요 공시만 토글
- app/news/page.tsx: Suspense 래핑

STEP 62 / REFERENCE_PLATFORM_MAPPING.md P1"
git push
```

---

## 5. 다음 STEP

완료 후 `@docs/STEP_63_COMMAND.md 파일 내용대로 실행해줘` 로 경제캘린더 폴리싱 진행.
