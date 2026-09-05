# STEP 60 — /briefing 페이지 stub 제거 + 실데이터 전환

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표:** `/briefing` 페이지의 `WidgetDetailStub` + dummy 데이터를 제거하고, 기존 `/api/home/briefing` 실데이터(미증시 Yahoo + DART 주요공시)를 3-컬럼 풀페이지로 재구성. 여기에 경제지표 일정(큐레이션, 당일~7일)을 추가로 붙인다.

**전제 상태 (직전 커밋):** STEP 59 완료 (/global 실데이터 전환)

---

## 1. 클라이언트 컴포넌트 — `components/briefing/BriefingPageClient.tsx` (신규)

**파일:** `components/briefing/BriefingPageClient.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface OvernightItem {
  label: string;
  val: string;
  change: string;
  up: boolean;
}

interface EconEvent {
  date: string;
  time: string;
  country: string;
  flag: string;
  title: string;
  importance: 1 | 2 | 3;
  forecast: string;
  previous: string;
}

const IMPORTANCE_COLOR: Record<number, string> = {
  1: 'text-[#999]',
  2: 'text-[#FFA500]',
  3: 'text-[#FF3B30]',
};
const IMPORTANCE_LABEL: Record<number, string> = { 1: '하', 2: '중', 3: '상' };

export default function BriefingPageClient() {
  const [overnight, setOvernight] = useState<OvernightItem[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [bRes, eRes] = await Promise.all([
          fetch('/api/home/briefing'),
          fetch('/api/calendar/upcoming?days=7&minImportance=2&limit=20'),
        ]);
        const b = await bRes.json();
        const e = await eRes.json();
        if (cancelled) return;
        setOvernight(b.overnight ?? []);
        setSchedule(b.schedule ?? []);
        setEvents(e.events ?? []);
      } catch {}
      finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">장전 브리핑</h1>
        <p className="text-sm text-[#666]">{today} · 간밤 미증시 + 오늘 주요 공시·지표</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 bg-[#F0F0F0] animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 간밤 미증시 */}
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <header className="px-4 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <h2 className="text-sm font-bold text-black">간밤 미증시</h2>
              <p className="text-[10px] text-[#999]">Yahoo Finance v7 · S&P / NASDAQ / DOW / VIX</p>
            </header>
            <ul className="divide-y divide-[#F0F0F0]">
              {overnight.length === 0 && (
                <li className="px-4 py-6 text-xs text-[#999] text-center">데이터 없음</li>
              )}
              {overnight.map((item, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold text-black">{item.label}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#333] tabular-nums">{item.val}</div>
                    <div className={`text-xs font-bold tabular-nums ${item.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                      {item.change}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* 주요 공시 */}
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <header className="px-4 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <h2 className="text-sm font-bold text-black">오늘 주요 공시</h2>
              <p className="text-[10px] text-[#999]">DART · 실적·유상증자·합병·배당</p>
            </header>
            <ul className="divide-y divide-[#F0F0F0]">
              {schedule.length === 0 && (
                <li className="px-4 py-6 text-xs text-[#999] text-center">오늘 주요 공시 없음</li>
              )}
              {schedule.map((item, i) => (
                <li key={i} className="px-4 py-3 text-xs text-[#333] leading-relaxed">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF3B30] mr-2 align-middle" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* 경제지표 일정 */}
          <section className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
            <header className="px-4 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <h2 className="text-sm font-bold text-black">이번주 주요 지표</h2>
              <p className="text-[10px] text-[#999]">큐레이션 · 중요도 중 이상 · 7일</p>
            </header>
            <ul className="divide-y divide-[#F0F0F0]">
              {events.length === 0 && (
                <li className="px-4 py-6 text-xs text-[#999] text-center">예정 지표 없음</li>
              )}
              {events.map((e, i) => (
                <li key={`${e.date}-${e.time}-${i}`} className="flex items-center gap-2 px-4 py-3 text-xs">
                  <span className="text-[#999] font-bold w-12 shrink-0">{e.date.slice(5)}</span>
                  <span className="text-[#666] w-10 shrink-0 font-mono">{e.time}</span>
                  <span className="shrink-0 text-base">{e.flag}</span>
                  <span className="text-black font-bold truncate flex-1">{e.title}</span>
                  <span className={`text-[10px] font-bold shrink-0 ${IMPORTANCE_COLOR[e.importance]}`}>
                    {IMPORTANCE_LABEL[e.importance]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
```

---

## 2. 페이지 교체 — `app/briefing/page.tsx`

```typescript
import type { Metadata } from 'next';
import BriefingPageClient from '@/components/briefing/BriefingPageClient';

export const metadata: Metadata = { title: '장전 브리핑 — StockTerminal' };

export default function BriefingPage() {
  return <BriefingPageClient />;
}
```

---

## 3. 검증

```bash
cd ~/Desktop/OTMarketing
npm run build
```

에러 없으면 커밋 + push:

```bash
git add -A
git commit -m "feat(briefing): stub → 실데이터 3-컬럼 (미증시 + 공시 + 경제지표)

- BriefingPageClient 신설 — /api/home/briefing + /api/calendar/upcoming 조합
- 3-컬럼 그리드 (간밤 미증시 / 오늘 공시 / 이번주 지표)
- app/briefing/page.tsx stub 제거

STEP 60 / REFERENCE_PLATFORM_MAPPING.md P1"
git push
```

---

## 4. 다음 STEP

완료 후 `@docs/STEP_61_COMMAND.md 파일 내용대로 실행해줘` 로 사이드바 5그룹 재구성 진행.
