# STEP 64 — TrendingThemesWidget + /analysis 폴리싱

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표:**
1. `TrendingThemesWidget`: 상승/하락 토글(TOP5 상승 ↔ TOP5 하락) 추가, 클릭 시 `/analysis?theme=` 프리셋.
2. `/analysis` 페이지: 기존 섹션 위에 '테마 전체 리스트' 섹션 추가. URL 파라미터 `?theme=AI` 수신 시 해당 테마를 하이라이트.
3. 홈 진입점 개선을 위해 테마 카드의 평균 등락률 바 추가.

**전제 상태 (직전 커밋):** STEP 63 완료 (경제캘린더 폴리싱)

---

## 1. TrendingThemesWidget 개선 — `components/widgets/TrendingThemesWidget.tsx`

전체 교체:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import WidgetCard from '@/components/home/WidgetCard';

interface Theme { name: string; change: number; count: number; }

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

type Mode = 'up' | 'down';

export default function TrendingThemesWidget({ inline = false, size = 'default' }: Props = {}) {
  const [allThemes, setAllThemes] = useState<Theme[]>([]);
  const [mode, setMode] = useState<Mode>('up');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/themes');
        const json = await res.json();
        if (json.themes) setAllThemes(json.themes);
      } catch {}
      setLoading(false);
    };
    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const themes = [...allThemes]
    .sort((a, b) => (mode === 'up' ? b.change - a.change : a.change - b.change))
    .slice(0, 5);

  const maxAbs = Math.max(1, ...themes.map((t) => Math.abs(t.change)));

  const controls = (
    <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
      <button
        type="button"
        onClick={() => setMode('up')}
        className={`text-[10px] font-bold px-2 py-0.5 ${
          mode === 'up' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666]'
        }`}
      >
        상승
      </button>
      <button
        type="button"
        onClick={() => setMode('down')}
        className={`text-[10px] font-bold px-2 py-0.5 ${
          mode === 'down' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666]'
        }`}
      >
        하락
      </button>
    </div>
  );

  const content = loading ? (
    <div className="flex flex-col h-full divide-y divide-[#F5F5F5]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2 px-3">
          <div className="h-4 w-24 bg-[#F0F0F0] animate-pulse" />
          <div className="h-4 w-12 bg-[#F0F0F0] animate-pulse" />
        </div>
      ))}
    </div>
  ) : themes.length === 0 ? (
    <div className="h-full flex items-center justify-center">
      <p className="text-xs text-[#999]">데이터를 불러올 수 없습니다</p>
    </div>
  ) : (
    <div className="flex flex-col h-full divide-y divide-[#F5F5F5]">
      {themes.map((theme) => {
        const pct = (Math.abs(theme.change) / maxAbs) * 100;
        const isUp = theme.change >= 0;
        return (
          <Link
            key={theme.name}
            href={`/analysis?theme=${encodeURIComponent(theme.name)}`}
            className="relative flex items-center justify-between py-2 px-3 hover:bg-[#F8F9FA]"
          >
            {/* bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 ${isUp ? 'bg-[#FF3B30]/5' : 'bg-[#0051CC]/5'}`}
              style={{ width: `${pct}%` }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-[#1A1A2E] truncate">{theme.name}</span>
              <span className="text-[10px] text-[#999] shrink-0">{theme.count}종목</span>
            </div>
            <span className={`relative text-sm font-bold shrink-0 ${isUp ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
              {isUp ? '+' : ''}{theme.change.toFixed(1)}%
            </span>
          </Link>
        );
      })}
    </div>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard
      title={mode === 'up' ? '상승 테마' : '하락 테마'}
      subtitle="큐레이션 · 평균 등락률"
      href="/analysis"
      size={size}
      className="h-full"
      action={
        <div className="flex items-center gap-2">
          {controls}
          <div className="flex items-center gap-1">
            {mode === 'up' ? (
              <TrendingUp className="w-3 h-3 text-[#FF3B30]" />
            ) : (
              <TrendingDown className="w-3 h-3 text-[#0051CC]" />
            )}
            <span className={`text-[10px] font-bold ${mode === 'up' ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
              TOP 5
            </span>
          </div>
        </div>
      }
    >
      {content}
    </WidgetCard>
  );
}
```

---

## 2. AnalysisClient에 테마 리스트 섹션 추가 — `components/analysis-page/AnalysisClient.tsx`

전체 교체:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SectorHeatmap from './SectorHeatmap';
import ThemeGroups from './ThemeGroups';
import MarketFlow from './MarketFlow';
import EconomicDashboard from './EconomicDashboard';

interface Theme { name: string; change: number; count: number; }

export default function AnalysisClient() {
  const sp = useSearchParams();
  const highlighted = sp.get('theme');
  const [mounted, setMounted] = useState(false);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [sort, setSort] = useState<'up' | 'down' | 'count'>('up');

  useEffect(() => {
    setMounted(true);
    fetch('/api/themes')
      .then((r) => r.json())
      .then((j) => setThemes(j.themes ?? []))
      .catch(() => {});
  }, []);

  const sortedThemes = [...themes].sort((a, b) => {
    if (sort === 'up') return b.change - a.change;
    if (sort === 'down') return a.change - b.change;
    return b.count - a.count;
  });

  if (!mounted) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-black mb-8">시장 분석</h1>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#F0F0F0] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-black mb-8">시장 분석</h1>

      <SectorHeatmap />

      {/* 전체 테마 리스트 */}
      <section className="mt-8 bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <header className="px-4 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA] flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-black">전체 테마</h2>
            <p className="text-xs text-[#999]">큐레이션 · {themes.length}개 테마 · 평균 등락률</p>
          </div>
          <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
            <button
              onClick={() => setSort('up')}
              className={`text-xs font-bold px-3 py-1.5 ${sort === 'up' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666]'}`}
            >
              상승순
            </button>
            <button
              onClick={() => setSort('down')}
              className={`text-xs font-bold px-3 py-1.5 ${sort === 'down' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666]'}`}
            >
              하락순
            </button>
            <button
              onClick={() => setSort('count')}
              className={`text-xs font-bold px-3 py-1.5 ${sort === 'count' ? 'bg-[#0ABAB5] text-white' : 'bg-white text-[#666]'}`}
            >
              종목수
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sortedThemes.map((t) => {
            const up = t.change >= 0;
            const isHighlight = highlighted && t.name === highlighted;
            return (
              <div
                key={t.name}
                className={`px-4 py-3 border-b border-r border-[#F0F0F0] flex items-center justify-between gap-2 hover:bg-[#F8F9FA] ${
                  isHighlight ? 'bg-[#0ABAB5]/10 ring-1 ring-[#0ABAB5]' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-black truncate">{t.name}</div>
                  <div className="text-[10px] text-[#999]">{t.count}종목</div>
                </div>
                <span className={`text-sm font-bold shrink-0 ${up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                  {up ? '+' : ''}{t.change.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <ThemeGroups />
        <MarketFlow />
      </div>

      <div className="mt-8">
        <EconomicDashboard />
      </div>
    </div>
  );
}
```

---

## 3. `app/analysis/page.tsx` Suspense 래핑

```typescript
import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalysisClient from '@/components/analysis-page/AnalysisClient';

export const metadata: Metadata = { title: '시장 분석 — StockTerminal' };

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="max-w-[1400px] mx-auto px-4 py-8"><div className="h-12 bg-[#F0F0F0] animate-pulse" /></div>}>
      <AnalysisClient />
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

`/analysis?theme=AI` 접속 시 해당 테마 카드 하이라이트 확인. 위젯에서 테마 클릭 → 자동 스크롤은 안 해도 됨(하이라이트만).

커밋 + push:

```bash
git add -A
git commit -m "feat(themes): 위젯 상승/하락 토글 + 등락률 바, /analysis에 전체 테마 그리드

- TrendingThemesWidget: up/down 세그먼트 + 상대 등락률 바 시각화
- 테마 클릭 시 /analysis?theme= 프리셋
- AnalysisClient: 전체 테마 4-컬럼 그리드 섹션 (상승/하락/종목수 정렬)
- URL theme= 파라미터 하이라이트
- Suspense 래핑

STEP 64 / REFERENCE_PLATFORM_MAPPING.md P1"
git push
```

---

## 5. 다음 STEP

완료 후 `@docs/STEP_65_COMMAND.md 파일 내용대로 실행해줘` 로 ChatWidget 폴리싱 진행.
