# STEP 63 — EconCalendarMini + /calendar 폴리싱

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표:**
1. `EconCalendarMiniWidget`: 중요도 dot 색상 1/2/3 구분 + "오늘/내일" 라벨 + 빈 상태 개선.
2. `/calendar` 페이지: 국가 필터 세그먼트(전체/미국/한국/유럽/일본) + 기간 세그먼트(7일/30일/60일) 추가, URL 파라미터로 상태 보존.
3. 위젯 클릭 → `/calendar?importance=3` 등 프리셋 이동 지원.

**전제 상태 (직전 커밋):** STEP 62 완료 (News 폴리싱)

---

## 1. EconCalendarMiniWidget 개선 — `components/widgets/EconCalendarMiniWidget.tsx`

전체 교체:

```typescript
'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

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
  1: '#999',
  2: '#FFA500',
  3: '#FF3B30',
};

function dayLabel(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return '오늘';
  if (dateStr === tomorrow) return '내일';
  const [, m, d] = dateStr.split('-');
  return `${m}/${d}`;
}

export default function EconCalendarMiniWidget() {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar/upcoming?days=7&minImportance=2&limit=5')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="경제 캘린더" subtitle="이번주 주요 지표" href="/calendar?importance=2">
      {loading ? (
        <div className="flex items-center justify-center h-16 text-xs text-[#999]">로딩 중…</div>
      ) : events.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs text-[#999]">
          이번 주 예정 주요 지표 없음
        </div>
      ) : (
        <div role="table" aria-label="주요 경제 지표 목록">
          <div role="rowgroup">
            {events.map((e, i) => {
              const isToday = e.date === new Date().toISOString().slice(0, 10);
              return (
                <div
                  key={`${e.date}-${e.time}-${i}`}
                  role="row"
                  className={`flex items-center gap-2 px-3 py-2 text-xs border-b border-[#F0F0F0] hover:bg-[#F8F9FA] last:border-0 ${
                    isToday ? 'bg-[#FFF5F5]' : ''
                  }`}
                >
                  <span className={`font-bold w-10 shrink-0 ${isToday ? 'text-[#FF3B30]' : 'text-[#999]'}`}>
                    {dayLabel(e.date)}
                  </span>
                  <span className="text-[#666] w-10 shrink-0 font-mono">{e.time}</span>
                  <span className="shrink-0 text-base">{e.flag}</span>
                  <span className="text-black font-bold truncate flex-1">{e.title}</span>
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: IMPORTANCE_COLOR[e.importance] }}
                    aria-label={`중요도 ${e.importance}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
```

---

## 2. CalendarPageClient 확장 — `components/calendar/CalendarPageClient.tsx`

전체 교체:

```typescript
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

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

const CALENDAR_SRC =
  'https://sslecal2.investing.com?' +
  'columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous' +
  '&features=datepicker,timezone' +
  '&countries=5,11,35,17,43' +
  '&calType=week' +
  '&timeZone=88' +
  '&lang=18';

const IMPORTANCE_LABEL: Record<number, string> = { 1: '하', 2: '중', 3: '상' };
const IMPORTANCE_COLOR: Record<number, string> = {
  1: 'text-[#999]',
  2: 'text-[#FFA500]',
  3: 'text-[#FF3B30]',
};

const COUNTRIES = [
  { value: 'all', label: '전체', flags: [] as string[] },
  { value: 'us', label: '🇺🇸 미국', flags: ['🇺🇸'] },
  { value: 'kr', label: '🇰🇷 한국', flags: ['🇰🇷'] },
  { value: 'eu', label: '🇪🇺 유럽', flags: ['🇪🇺', '🇩🇪', '🇫🇷', '🇬🇧'] },
  { value: 'jp', label: '🇯🇵 일본', flags: ['🇯🇵'] },
  { value: 'cn', label: '🇨🇳 중국', flags: ['🇨🇳'] },
];

export default function CalendarPageClient() {
  const sp = useSearchParams();
  const initImp = Number(sp.get('importance')) || 1;

  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  const [minImportance, setMinImportance] = useState<1 | 2 | 3>((initImp >= 1 && initImp <= 3 ? initImp : 1) as 1 | 2 | 3);
  const [country, setCountry] = useState<string>('all');
  const [days, setDays] = useState<7 | 30 | 60>(7);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar/upcoming?days=60&minImportance=1&limit=200`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setEvents(d.events ?? []);
        setUpdatedAt(d.updatedAt ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    const cutoff = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    const selected = COUNTRIES.find((c) => c.value === country);
    return events.filter((e) => {
      if (e.importance < minImportance) return false;
      if (e.date > cutoff) return false;
      if (country !== 'all' && selected && !selected.flags.includes(e.flag)) return false;
      return true;
    });
  }, [events, minImportance, country, days]);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-black">큐레이션 주요 지표</h2>
            {updatedAt && (
              <p className="text-xs text-[#999]">최종 업데이트: {updatedAt} (월 1회 수동 갱신)</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 기간 */}
            <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
              {[7, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d as 7 | 30 | 60)}
                  className={`text-xs font-bold px-3 py-1.5 ${
                    days === d ? 'bg-[#0ABAB5] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
                  }`}
                >
                  {d}일
                </button>
              ))}
            </div>
            {/* 국가 */}
            <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
              {COUNTRIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCountry(c.value)}
                  className={`text-xs font-bold px-3 py-1.5 ${
                    country === c.value ? 'bg-[#0ABAB5] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {/* 중요도 */}
            <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
              {[
                { v: 1 as const, label: '전체' },
                { v: 2 as const, label: '중 이상' },
                { v: 3 as const, label: '상만' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setMinImportance(opt.v)}
                  className={`text-xs font-bold px-3 py-1.5 ${
                    minImportance === opt.v ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">날짜</th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">시각(KST)</th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">국가</th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">이벤트</th>
                  <th className="px-4 py-2.5 text-right font-bold text-[#666] text-xs">예상</th>
                  <th className="px-4 py-2.5 text-right font-bold text-[#666] text-xs">이전</th>
                  <th className="px-4 py-2.5 text-center font-bold text-[#666] text-xs">중요도</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">로딩 중…</td></tr>
                )}
                {!loading && filteredEvents.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">조건에 맞는 이벤트 없음</td></tr>
                )}
                {!loading &&
                  filteredEvents.map((e, i) => (
                    <tr
                      key={`${e.date}-${e.time}-${i}`}
                      className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]"
                    >
                      <td className="px-4 py-2.5 text-[#333]">{e.date}</td>
                      <td className="px-4 py-2.5 text-[#333] font-mono text-xs">{e.time}</td>
                      <td className="px-4 py-2.5 text-base">{e.flag}</td>
                      <td className="px-4 py-2.5 text-[#333] font-bold">{e.title}</td>
                      <td className="px-4 py-2.5 text-right text-[#333]">{e.forecast}</td>
                      <td className="px-4 py-2.5 text-right text-[#666]">{e.previous}</td>
                      <td className={`px-4 py-2.5 text-center font-bold text-xs ${IMPORTANCE_COLOR[e.importance]}`}>
                        {IMPORTANCE_LABEL[e.importance]}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-black mb-1">실시간 경제 캘린더</h2>
        <p className="text-xs text-[#999] mb-3">
          Investing.com 공식 위젯 — 미국·한국·일본·영국·유럽 주요 지표 실시간, 한국어·KST 표시
        </p>
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <iframe
            src={CALENDAR_SRC}
            className="w-full border-0"
            style={{ height: 600 }}
            title="경제 캘린더 — Investing.com"
            scrolling="yes"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 3. `app/calendar/page.tsx` Suspense 래핑

기존 파일에서 `CalendarPageClient` 를 Suspense 로 감쌈 (useSearchParams 사용 시 필수):

```typescript
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import CalendarPageClient from '@/components/calendar/CalendarPageClient';

export const metadata = { title: '경제 캘린더 — StockTerminal' };

export default function CalendarPage() {
  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">경제 캘린더</h1>
        <p className="text-sm text-[#666]">
          향후 60일간 주요 경제 지표 발표 일정. 큐레이션 데이터(상단) + Investing.com 공식 위젯(하단) 병렬 제공.
        </p>
      </div>

      <Suspense fallback={<div className="h-48 bg-[#F0F0F0] animate-pulse rounded-lg" />}>
        <CalendarPageClient />
      </Suspense>
    </div>
  );
}
```

---

## 4. 검증

```bash
cd ~/Desktop/OTMarketing
npm run build
```

`/calendar?importance=3` 접속 시 "상만" 프리셋 적용 확인. 국가/기간 세그먼트 전환 테스트.

커밋 + push:

```bash
git add -A
git commit -m "feat(calendar): 위젯 중요도 dot + 오늘/내일 라벨, 페이지 국가·기간 필터

- EconCalendarMiniWidget: 3단계 중요도 색상 + 오늘 하이라이트
- CalendarPageClient: 기간(7/30/60일) + 국가(5개) 필터 세그먼트
- URL 파라미터 importance= 로 프리셋 이동 지원
- Suspense 래핑

STEP 63 / REFERENCE_PLATFORM_MAPPING.md P1"
git push
```

---

## 5. 다음 STEP

완료 후 `@docs/STEP_64_COMMAND.md 파일 내용대로 실행해줘` 로 TrendingThemes + /analysis 진행.
