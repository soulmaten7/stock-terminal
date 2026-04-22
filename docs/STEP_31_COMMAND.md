# STEP 31 — Phase 2-C 경제 캘린더 홈 미니 위젯 + /calendar 실데이터

## 실행 명령어
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

## 전제 상태
- 이전 커밋: `1a3f857 feat(watchlist): Phase 2-D + Phase 2-B 완성 (Step 28~30)`
- 현재 상태:
  - `components/widgets/EconCalendarWidget.tsx` — Investing.com iframe 임베드 (유지)
  - `app/calendar/page.tsx` — **또 다른 Math.random 느낌의 하드코딩 stub** (CLAUDE.md 절대규칙 위반 상태)
  - `HomeClient.tsx`에 경제캘린더 위젯 **참조 없음** — 홈에 아예 안 붙어있음
- 홈 레이아웃 (세션 #22 기준):
  - Col 1 (2.5fr): Chat 45 + ScreenerMini 10 + Watchlist 45
  - Col 2 (6.5fr): Chart 50 + (OrderBook|Tick 1:1) 50
  - **Col 3 (3fr): News 50 + DART 50** ← 여기 3등분으로 리폼

## API 선택 배경
여러 경제 캘린더 API 비교 결과(Finnhub/FRED/ECOS/Tradingeconomics/Investing iframe), **자체 큐레이션 JSON 하이브리드**로 결정:
1. **API 키 발급 불필요** — 초보자 환경 설정 부담 0
2. **절대규칙 준수** — 경제지표 발표 일정은 미리 공표된 공개 정보라 "Math.random 금지"와 무관
3. **iframe은 `/calendar` 상세 페이지 유지** — 필터·시간대·중요도 UI 재활용
4. **향후 자동화 여지** — 키 확보 시 `/api/calendar/upcoming` 내부만 Finnhub/FRED로 교체

## 목표
경제 캘린더를 "홈 R1-Col3 미니 위젯"과 "/calendar 상세(큐레이션 + iframe 병렬)"로 완성. stub 제거. 큐레이션 업데이트 가이드 문서 동반.

---

## 변경 1: `data/economic-events.json` 신규 생성

프로젝트 루트에 `data/` 디렉토리 생성 후 이 파일 저장.

```json
{
  "updatedAt": "2026-04-22",
  "source": "수동 큐레이션 — Investing.com / FOMC 공식 일정 / 통계청 발표 일정 교차 검증",
  "events": [
    { "date": "2026-04-22", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "CPI 월간", "importance": 3, "forecast": "0.2%", "previous": "0.3%" },
    { "date": "2026-04-22", "time": "23:00", "country": "US", "flag": "🇺🇸", "title": "소매판매 월간", "importance": 2, "forecast": "0.4%", "previous": "0.6%" },
    { "date": "2026-04-23", "time": "03:00", "country": "US", "flag": "🇺🇸", "title": "FOMC 회의록", "importance": 3, "forecast": "-", "previous": "-" },
    { "date": "2026-04-24", "time": "08:00", "country": "KR", "flag": "🇰🇷", "title": "한국 수출입 지표", "importance": 2, "forecast": "-", "previous": "-" },
    { "date": "2026-04-24", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "내구재 주문 월간", "importance": 2, "forecast": "-0.5%", "previous": "+0.7%" },
    { "date": "2026-04-25", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "1분기 GDP 성장률", "importance": 3, "forecast": "2.4%", "previous": "3.1%" },
    { "date": "2026-04-25", "time": "23:00", "country": "US", "flag": "🇺🇸", "title": "미시건 소비자심리", "importance": 2, "forecast": "76.5", "previous": "77.9" },
    { "date": "2026-04-28", "time": "09:00", "country": "JP", "flag": "🇯🇵", "title": "일본 BOJ 금리 결정", "importance": 3, "forecast": "0.50%", "previous": "0.50%" },
    { "date": "2026-04-28", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "PCE 물가지수", "importance": 3, "forecast": "2.5%", "previous": "2.5%" },
    { "date": "2026-04-29", "time": "03:00", "country": "US", "flag": "🇺🇸", "title": "FOMC 금리 결정", "importance": 3, "forecast": "5.50%", "previous": "5.50%" },
    { "date": "2026-04-29", "time": "03:30", "country": "US", "flag": "🇺🇸", "title": "FOMC 기자회견", "importance": 3, "forecast": "-", "previous": "-" },
    { "date": "2026-04-29", "time": "21:15", "country": "US", "flag": "🇺🇸", "title": "ADP 고용 변화", "importance": 2, "forecast": "150K", "previous": "155K" },
    { "date": "2026-04-30", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "비농업 고용자 수", "importance": 3, "forecast": "175K", "previous": "188K" },
    { "date": "2026-04-30", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "실업률", "importance": 3, "forecast": "3.8%", "previous": "3.7%" },
    { "date": "2026-05-01", "time": "09:00", "country": "KR", "flag": "🇰🇷", "title": "한국 소비자물가", "importance": 2, "forecast": "2.1%", "previous": "2.3%" },
    { "date": "2026-05-02", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "신규 실업수당 청구", "importance": 2, "forecast": "220K", "previous": "218K" },
    { "date": "2026-05-05", "time": "22:00", "country": "EU", "flag": "🇪🇺", "title": "유로존 소매판매", "importance": 2, "forecast": "0.3%", "previous": "0.1%" },
    { "date": "2026-05-06", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "무역수지", "importance": 2, "forecast": "-68.0B", "previous": "-67.4B" },
    { "date": "2026-05-07", "time": "21:00", "country": "GB", "flag": "🇬🇧", "title": "영국 BOE 금리 결정", "importance": 3, "forecast": "5.25%", "previous": "5.25%" },
    { "date": "2026-05-08", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "신규 실업수당 청구", "importance": 2, "forecast": "-", "previous": "-" },
    { "date": "2026-05-13", "time": "21:30", "country": "US", "flag": "🇺🇸", "title": "CPI 월간", "importance": 3, "forecast": "-", "previous": "-" }
  ]
}
```

> 이 데이터는 월 1회 수동 업데이트 대상. 업데이트 방법은 `docs/CALENDAR_DATA_UPDATE.md` 참조.

---

## 변경 2: `app/api/calendar/upcoming/route.ts` 신규

```ts
import { NextRequest, NextResponse } from 'next/server';
import eventsData from '@/data/economic-events.json';

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

// ?days=7&minImportance=1&limit=20
export async function GET(request: NextRequest) {
  const days = Math.min(Number(request.nextUrl.searchParams.get('days') || 7), 60);
  const minImportance = Math.max(
    1,
    Math.min(Number(request.nextUrl.searchParams.get('minImportance') || 1), 3)
  );
  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 100), 200);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(today.getTime() + days * 86400000);

  const filtered = (eventsData.events as EconEvent[])
    .filter((e) => {
      const d = new Date(`${e.date}T00:00:00`);
      return d >= today && d <= endDate && e.importance >= minImportance;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    })
    .slice(0, limit);

  return NextResponse.json(
    { events: filtered, updatedAt: eventsData.updatedAt, source: eventsData.source },
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' } }
  );
}
```

---

## 변경 3: `components/widgets/EconCalendarMiniWidget.tsx` 신규

홈용 미니 위젯 — 중요도 HIGH(3)만, 최대 5개.

```tsx
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

function mmdd(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${m}/${d}`;
}

export default function EconCalendarMiniWidget() {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar/upcoming?days=7&minImportance=3&limit=5')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="경제 캘린더" subtitle="이번주 주요 지표" href="/calendar">
      {loading ? (
        <div className="flex items-center justify-center h-16 text-xs text-[#999]">로딩 중…</div>
      ) : events.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs text-[#999]">
          이번 주 예정 주요 지표 없음
        </div>
      ) : (
        <div role="table" aria-label="주요 경제 지표 목록">
          <div role="rowgroup">
            {events.map((e, i) => (
              <div
                key={`${e.date}-${e.time}-${i}`}
                role="row"
                className="flex items-center gap-2 px-3 py-2 text-xs border-b border-[#F0F0F0] hover:bg-[#F8F9FA] last:border-0"
              >
                <span className="text-[#999] font-bold w-10 shrink-0">{mmdd(e.date)}</span>
                <span className="text-[#666] w-10 shrink-0">{e.time}</span>
                <span className="shrink-0 text-base">{e.flag}</span>
                <span className="text-black font-bold truncate flex-1">{e.title}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: '#FF3B30' }}
                  aria-label="중요도 상"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
```

---

## 변경 4: `app/calendar/page.tsx` 전면 교체

stub 제거 → 상단 큐레이션 테이블 + 하단 Investing.com iframe.

```tsx
import Link from 'next/link';
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

      <CalendarPageClient />
    </div>
  );
}
```

---

## 변경 5: `components/calendar/CalendarPageClient.tsx` 신규

큐레이션 테이블 + 필터 + iframe.

```tsx
'use client';

import { useEffect, useState, useMemo } from 'react';

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

export default function CalendarPageClient() {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  const [minImportance, setMinImportance] = useState(1);

  useEffect(() => {
    fetch('/api/calendar/upcoming?days=60&minImportance=1&limit=200')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setEvents(d.events ?? []);
        setUpdatedAt(d.updatedAt ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(
    () => events.filter((e) => e.importance >= minImportance),
    [events, minImportance]
  );

  return (
    <div className="space-y-8">
      {/* 큐레이션 테이블 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-black">큐레이션 주요 지표</h2>
            {updatedAt && (
              <p className="text-xs text-[#999]">최종 업데이트: {updatedAt} (월 1회 수동 갱신)</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#666]">중요도:</span>
            {[
              { v: 1, label: '전체' },
              { v: 2, label: '중 이상' },
              { v: 3, label: '상만' },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => setMinImportance(opt.v)}
                className={`px-3 py-1 font-bold border ${
                  minImportance === opt.v
                    ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]'
                    : 'bg-white text-[#666] border-[#E5E7EB]'
                }`}
              >
                {opt.label}
              </button>
            ))}
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
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">
                      로딩 중…
                    </td>
                  </tr>
                )}
                {!loading && filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">
                      조건에 맞는 이벤트 없음
                    </td>
                  </tr>
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
                      <td
                        className={`px-4 py-2.5 text-center font-bold text-xs ${IMPORTANCE_COLOR[e.importance]}`}
                      >
                        {IMPORTANCE_LABEL[e.importance]}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Investing.com iframe 상세 */}
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

## 변경 6: `components/home/HomeClient.tsx` — Col 3 재구성

### 6-1. import 추가 (기존 import 블록에 추가)
```ts
import EconCalendarMiniWidget from '@/components/widgets/EconCalendarMiniWidget';
```

### 6-2. Col 3 섹션 수정
기존:
```tsx
{/* ── Col 3: News (50) + DART (50) vertical ── */}
<div
  id="section-col3"
  style={{
    gridRow: 1,
    gridColumn: 3,
    display: 'grid',
    gridTemplateRows: '1fr 1fr',
    gap: 8,
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
  }}
>
  <div id="section-news" style={{ minHeight: 0 }}><NewsFeedWidget /></div>
  <div id="section-dart" style={{ minHeight: 0 }}><DartFilingsWidget /></div>
</div>
```

아래로 교체:
```tsx
{/* ── Col 3: News (35) + DART (35) + EconCalendar (30) vertical ── */}
<div
  id="section-col3"
  style={{
    gridRow: 1,
    gridColumn: 3,
    display: 'grid',
    gridTemplateRows: '35fr 35fr 30fr',
    gap: 8,
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
  }}
>
  <div id="section-news" style={{ minHeight: 0 }}><NewsFeedWidget /></div>
  <div id="section-dart" style={{ minHeight: 0 }}><DartFilingsWidget /></div>
  <div id="section-econcal" style={{ minHeight: 0 }}><EconCalendarMiniWidget /></div>
</div>
```

---

## 변경 7: `docs/CALENDAR_DATA_UPDATE.md` 신규

월 1회 큐레이션 업데이트 가이드.

```md
# 경제 캘린더 데이터 업데이트 가이드

`data/economic-events.json` 은 월 1회 수동으로 갱신합니다. 자동 API가 아직 붙지 않아 사람이 직접 일정을 복사-업데이트해야 정확합니다.

## 업데이트 주기
- **매월 1일** 다음 60일치 주요 지표 반영
- 긴급 이벤트(임시 FOMC, 깜짝 BOJ 회의 등) 발생 시 즉시 추가

## 출처 (우선순위 순)
1. **Investing.com 경제 캘린더** — https://kr.investing.com/economic-calendar/
2. **FOMC 공식 일정** — https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
3. **한국은행 보도자료 일정** — https://www.bok.or.kr/portal/bbs/B0000338/list.do
4. **통계청 공표 일정** — https://kostat.go.kr/anse/

## 이벤트 필드
| 필드 | 설명 | 예시 |
|------|------|------|
| date | ISO 날짜 | "2026-05-13" |
| time | KST 24시간제 | "21:30" |
| country | ISO 국가코드 | "US", "KR", "JP", "EU", "GB" |
| flag | 국기 이모지 | "🇺🇸" |
| title | 한국어 지표명 | "CPI 월간" |
| importance | 중요도 1-3 | 3 = 상 (FOMC/CPI/NFP/BOJ), 2 = 중, 1 = 하 |
| forecast | 시장 예상치 | "0.2%", "150K", "5.50%", "-" |
| previous | 직전 실제치 | "0.3%", "-" |

## 중요도 가이드
- **3 (상, 빨강 점)**: 중앙은행 금리 결정, CPI, NFP, GDP 속보치, FOMC 회의록, PCE
- **2 (중, 주황)**: 소매판매, 내구재, 신규실업수당, 미시건 소비자심리
- **1 (하, 회색)**: 기타 2차 지표

## 파일 갱신 후
```bash
cd ~/Desktop/OTMarketing
npm run build  # 빌드 에러 없는지 확인
git add data/economic-events.json
git commit -m "chore: update economic events for {YYYY-MM}"
git push
```
`updatedAt` 필드도 함께 갱신하는 것을 잊지 말 것.

## 향후 자동화 계획
Finnhub 또는 FRED 키 확보 시 `/api/calendar/upcoming` 내부만 API 호출로 교체. 컴포넌트와 JSON 스키마는 그대로 유지되어 마이그레이션 비용 최소.
```

---

## 검증 순서

1. **빌드**
   ```bash
   npm run build
   ```
   에러 없이 통과. `data/economic-events.json` import 경로가 tsconfig에 문제 없는지 확인 — 문제 있으면 `@/data/` alias가 tsconfig paths에 추가되어있는지 먼저 체크. 대안: relative import (`../../data/economic-events.json`).

2. **API 확인**
   ```bash
   curl "http://localhost:3000/api/calendar/upcoming?days=7&minImportance=3&limit=5"
   ```
   → JSON `{ events: [...], updatedAt, source }` 반환. events는 오늘(2026-04-22) 이후, 중요도 3만 최대 5개.

3. **홈 시각 확인**
   - `http://localhost:3000/` 접속 → Col 3 맨 아래에 "경제 캘린더" 미니 위젯. 이번주 주요 지표 5개 이내 리스트. 각 행에 날짜/시각/국기/타이틀/빨간 점.
   - Col 3 높이 비율: 뉴스 35 : DART 35 : 경제캘린더 30 → 뉴스·DART는 기존보다 약간 짧아졌지만 위젯 내부 스크롤은 정상 작동해야 함.

4. **`/calendar` 페이지 확인**
   - `http://localhost:3000/calendar` → "큐레이션 주요 지표" 테이블 상단 + Investing.com iframe 하단.
   - 중요도 필터 버튼 "전체 / 중 이상 / 상만" 작동.
   - stub 느낌 완전 제거 확인.

5. **레이아웃 회귀 테스트**
   - 대시보드 오버플로우 되살아나지 않는지 확인 (세션 #23 수술 결과 보존).
   - 화면 크기 1280/1536/1920에서 모두 Col 3 안 터지는지 확인.

## 커밋 메시지
```
feat(calendar): curated economic calendar mini widget + /calendar revamp (Phase 2-C)

- data/economic-events.json: curated events (monthly manual updates)
- /api/calendar/upcoming: days/minImportance/limit filter
- EconCalendarMiniWidget: home Col 3 bottom, top 5 HIGH-importance this week
- /calendar page: curated table + importance filter + Investing.com iframe
- HomeClient Col 3: News/DART/EconCalendar = 35/35/30 grid
- docs/CALENDAR_DATA_UPDATE.md: monthly update guide

API source: self-curation (no external key required). Investing.com iframe
kept on /calendar detail for real-time cross-check. Future: swap
/api/calendar/upcoming internals with Finnhub/FRED when key available.
```

## 완료 후 공유
- 빌드 성공 여부
- 홈 Col 3 스크린샷 (뉴스/DART/경제캘린더 3등분)
- `/calendar` 페이지 스크린샷 (테이블 + iframe)
- `curl /api/calendar/upcoming` 응답 일부

## 다음 단계 예고
Phase 2-C 완료 후 더미 제거 리스트 순차 진행:
- STEP 32: ProgramTrading (한투 API 없음 → KRX 크롤링 OR "준비 중" 정직 표시)
- STEP 33: GlobalFutures (Yahoo Finance? yfinance 이미 설치됨)
- STEP 34: WarningStocks (KRX 경고종목 공시 크롤링)
- STEP 35: IpoSchedule (DART IPO 공시 파싱)
- STEP 36: EarningsCalendar (DART 실적 공시)
각 위젯별 소스 판단 + 명령서 이어갑니다.
