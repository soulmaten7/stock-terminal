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
