'use client';

import { useEffect, useState } from 'react';

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

const IMPORTANCE_DOT: Record<number, string> = {
  1: 'bg-[#D1D5DB]',
  2: 'bg-[#F59E0B]',
  3: 'bg-[#EF4444]',
};

function groupByDate(events: EconEvent[]): Map<string, EconEvent[]> {
  const map = new Map<string, EconEvent[]>();
  for (const e of events) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }
  return map;
}

function fmtDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${iso.slice(5).replace('-', '/')} (${days[d.getDay()]})`;
}

function isToday(iso: string): boolean {
  return iso === new Date().toISOString().slice(0, 10);
}

export default function EconomicCalendarWidget() {
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calendar/upcoming?days=7&minImportance=1&limit=60')
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = groupByDate(events);

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-bold text-[#222]">경제 캘린더</h3>
        <span className="text-[10px] text-[#999]">7일 주요 일정</span>
      </div>

      <div className="flex-1 overflow-auto space-y-3">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-[#F0F0F0] animate-pulse rounded mb-2" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="h-8 bg-[#F0F0F0] animate-pulse rounded mb-1" />
            ))}
          </div>
        ))}

        {!loading && grouped.size === 0 && (
          <div className="py-8 text-center text-xs text-[#999]">일정 없음</div>
        )}

        {!loading && Array.from(grouped.entries()).map(([date, dayEvents]) => (
          <div key={date}>
            <div className={`text-[10px] font-bold mb-1.5 px-1 ${isToday(date) ? 'text-[#0ABAB5]' : 'text-[#666]'}`}>
              {fmtDay(date)}{isToday(date) && ' · 오늘'}
            </div>
            <div className="space-y-0.5">
              {dayEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-1 py-1.5 hover:bg-[#FAFAFA] rounded">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${IMPORTANCE_DOT[e.importance]}`} />
                  <span className="text-[10px] text-[#999] w-10 shrink-0 tabular-nums">{e.time || '—'}</span>
                  <span className="text-[10px] shrink-0">{e.flag}</span>
                  <span className="text-xs text-[#222] flex-1 truncate">{e.title}</span>
                  {e.forecast && (
                    <span className="text-[10px] text-[#999] shrink-0 tabular-nums">예측 {e.forecast}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3 shrink-0">
        <span className="flex items-center gap-1 text-[10px] text-[#999]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] inline-block" /> 고중요도
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[#999]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] inline-block" /> 중요도
        </span>
      </div>
    </div>
  );
}
