# STEP 80 — Section 5: Information Streams (뉴스 + 공시 + 캘린더)

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**전제 상태:** STEP 79 완료 — Section 4 Market Structure 추가.

**목표:**
HomeClient 에 Section 5 추가 — 정보 스트림 영역 (대시보드 맨 아래).
- **5:4:3 그리드**: 최신 뉴스 / 최신 공시 / 이번주 경제 캘린더

**범위 제한:**
- 기존 `/api/stocks/news`, `/api/stocks/disclosures`, `/api/calendar` (있으면) 재활용.
- 뉴스는 종목 필터 없는 **전체 시장 뉴스** — Section 1 뉴스탭과 구분.
- 캘린더는 **이번 주 (월~금)** 만 표시. 월간뷰/개인화 제외.

---

## 작업 0 — 현재 상태 파악

```bash
find components -name "NewsStream*" -o -name "DisclosureStream*" -o -name "Calendar*" -type f 2>/dev/null
ls app/api/stocks/news 2>/dev/null
ls app/api/stocks/disclosures 2>/dev/null
ls app/api/calendar 2>/dev/null
ls app/api/briefing 2>/dev/null
grep -rln "calendar\|economic" app/api/ --include="*.ts" 2>/dev/null | head
```

보고: 뉴스/공시/캘린더 위젯 & API 현황.

---

## 작업 1 — Section 5 컨테이너

Section 4 바로 아래 (HomeClient 하단):

```tsx
{/* Section 5 — Information Streams */}
<section className="mt-4 grid grid-cols-12 gap-2 mb-6">
  <div className="col-span-5 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
    <NewsStreamWidget />
  </div>
  <div className="col-span-4 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
    <DisclosureStreamWidget />
  </div>
  <div className="col-span-3 min-w-0 border border-[#E5E7EB] bg-white overflow-hidden">
    <EconomicCalendarWidget />
  </div>
</section>
```

- `mb-6`: 푸터와의 여백.

---

## 작업 2 — `NewsStreamWidget` (5col)

`components/widgets/NewsStreamWidget.tsx` 신규.

```tsx
'use client';
import { useEffect, useState } from 'react';

type News = {
  id: string;
  title: string;
  source: string;
  publishedAt: string;   // ISO
  url: string;
  relatedSymbols?: string[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NewsStreamWidget() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stocks/news?limit=15')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setNews(d.items ?? []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#222]">📰 최신 뉴스</h3>
        <a href="/news" className="text-xs text-[#0ABAB5] hover:underline">전체보기</a>
      </div>
      <ul className="text-xs space-y-1.5 max-h-[360px] overflow-y-auto">
        {loading && <li className="text-[#999] text-center py-4">로딩 중...</li>}
        {!loading && news.length === 0 && <li className="text-[#999] text-center py-4">뉴스 없음</li>}
        {!loading && news.map((n) => (
          <li key={n.id} className="py-1 border-b border-[#F3F4F6] last:border-0">
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-[#F9FAFB] px-2 py-1 rounded"
            >
              <div className="line-clamp-2 text-[#222] font-medium">{n.title}</div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#999]">
                <span>{n.source}</span>
                <span>·</span>
                <span>{timeAgo(n.publishedAt)}</span>
                {n.relatedSymbols && n.relatedSymbols.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-[#0ABAB5]">{n.relatedSymbols.slice(0, 3).join(', ')}</span>
                  </>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 작업 3 — `DisclosureStreamWidget` (4col)

`components/widgets/DisclosureStreamWidget.tsx` 신규.

```tsx
'use client';
import { useEffect, useState } from 'react';

type Market = 'KR' | 'US';

type Disclosure = {
  id: string;
  title: string;
  company: string;
  market: Market;
  filedAt: string;
  url: string;
  formType?: string;    // 10-K, 8-K, ...
};

export default function DisclosureStreamWidget() {
  const [market, setMarket] = useState<Market>('KR');
  const [items, setItems] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stocks/disclosures?market=${market}&limit=15`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [market]);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#222]">📋 최신 공시</h3>
        <div className="flex gap-1">
          {(['KR', 'US'] as Market[]).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={`px-2 h-6 text-xs rounded border ${
                market === m ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]' : 'bg-white border-[#E5E7EB]'
              }`}
            >{m}</button>
          ))}
        </div>
      </div>
      <ul className="text-xs space-y-1.5 max-h-[360px] overflow-y-auto">
        {loading && <li className="text-[#999] text-center py-4">로딩 중...</li>}
        {!loading && items.length === 0 && (
          <li className="text-[#999] text-center py-4">공시 없음</li>
        )}
        {!loading && items.map((d) => (
          <li key={d.id} className="py-1 border-b border-[#F3F4F6] last:border-0">
            <a
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-[#F9FAFB] px-2 py-1 rounded"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {d.formType && (
                  <span className="text-[9px] px-1 py-0.5 bg-[#0ABAB5] text-white rounded">
                    {d.formType}
                  </span>
                )}
                <span className="text-[11px] font-semibold text-[#444]">{d.company}</span>
              </div>
              <div className="line-clamp-2 text-[#222]">{d.title}</div>
              <div className="text-[10px] text-[#999] mt-0.5">
                {new Date(d.filedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 작업 4 — `EconomicCalendarWidget` (3col)

`components/widgets/EconomicCalendarWidget.tsx` 신규.

### 구조

```
┌──────────────────────┐
│ 📅 이번 주 경제 캘린더 │
│                      │
│ 월 04/21             │
│ ─────────────        │
│ 09:00 🇺🇸 FOMC       │
│ 21:30 🇺🇸 CPI        │
│                      │
│ 화 04/22             │
│ ─────────────        │
│ 08:00 🇰🇷 수출입      │
│                      │
│ 수 04/23 (오늘)       │
│ ...                  │
└──────────────────────┘
```

### 구현 골격

```tsx
'use client';
import { useEffect, useState, useMemo } from 'react';

type Event = {
  id: string;
  datetime: string;         // ISO
  country: 'KR' | 'US' | 'CN' | 'JP' | 'EU';
  title: string;
  importance: 1 | 2 | 3;    // 별 개수
};

const FLAG: Record<string, string> = {
  KR: '🇰🇷', US: '🇺🇸', CN: '🇨🇳', JP: '🇯🇵', EU: '🇪🇺',
};

function getThisWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);
  return { from: monday.toISOString(), to: friday.toISOString() };
}

export default function EconomicCalendarWidget() {
  const [events, setEvents] = useState<Event[]>([]);
  const { from, to } = useMemo(getThisWeekRange, []);
  const todayKey = new Date().toDateString();

  useEffect(() => {
    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setEvents(d.items ?? []))
      .catch(() => setEvents([]));
  }, [from, to]);

  // 날짜별 그룹
  const byDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((e) => {
      const key = new Date(e.datetime).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries()).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  }, [events]);

  return (
    <div className="p-3">
      <h3 className="text-sm font-semibold text-[#222] mb-2">📅 이번 주 경제 캘린더</h3>
      <div className="max-h-[360px] overflow-y-auto">
        {byDate.length === 0 && (
          <div className="text-[#999] text-xs text-center py-4">일정 없음</div>
        )}
        {byDate.map(([dateKey, list]) => {
          const d = new Date(dateKey);
          const isToday = dateKey === todayKey;
          const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
          return (
            <div key={dateKey} className="mb-3">
              <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-[#0ABAB5]' : 'text-[#444]'}`}>
                {dayLabel} {String(d.getMonth() + 1).padStart(2, '0')}/{String(d.getDate()).padStart(2, '0')}
                {isToday && <span className="ml-2 text-[10px]">(오늘)</span>}
              </div>
              <ul className="text-[11px] space-y-0.5 border-l border-[#E5E7EB] pl-2">
                {list.map((e) => (
                  <li key={e.id} className="flex items-start gap-1.5 py-0.5">
                    <span className="text-[#666] tabular-nums w-10 flex-shrink-0">
                      {new Date(e.datetime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                    <span className="flex-shrink-0">{FLAG[e.country] ?? ''}</span>
                    <span className="text-[#222] line-clamp-2">{e.title}</span>
                    {e.importance >= 3 && <span className="text-[#FF4D4D] flex-shrink-0">★</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 작업 5 — 빌드 + 문서 + push

```bash
npm run build
```

CHANGELOG:
```
- feat(dashboard): Section 5 Information Streams — 뉴스/공시/캘린더 (STEP 80)
```

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(dashboard): Section 5 Information Streams (STEP 80)

- HomeClient Section 5 (5:4:3 grid)
- NewsStreamWidget: 전체 시장 뉴스 15건 + 시간 경과 표시
- DisclosureStreamWidget: KR/US 토글 + 최신 공시 15건
- EconomicCalendarWidget: 이번 주 월~금 + 국가 깃발 + 중요도 별

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)" && git push
```

---

## 완료 보고 양식

```
✅ STEP 80 완료
- Section 5 5:4:3 grid
- NewsStreamWidget: <신규/재활용>
- DisclosureStreamWidget: <신규/재활용>, KR/US 토글
- EconomicCalendarWidget: <신규/재활용>, 월~금
- API 라우트:
  · /api/stocks/news: 존재
  · /api/stocks/disclosures: 존재 (KR/US 분기)
  · /api/calendar: <존재/mock>
- npm run build: 성공
- git commit: <hash>
```

---

## 주의사항

- **뉴스 `target="_blank" + rel="noopener noreferrer"`** — 외부 링크 새 탭 안전하게.
- **캘린더 시간대** — ISO datetime 을 브라우저 로컬 타임존으로 표시. 서버 KST 고정하지 말 것.
- **공시 formType 배지 색상** — 기본 브랜드 티어(#0ABAB5). 10-K/10-Q 중요도 구분은 추후.
- **max-h-[360px] overflow-y-auto** — 3개 위젯 모두 동일 높이 유지 위해 내부 스크롤.
