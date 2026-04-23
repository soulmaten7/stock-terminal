'use client';

import { useEffect, useState } from 'react';
import WidgetHeader from '@/components/dashboard/WidgetHeader';

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
}

interface Props {
  compact?: boolean;
}

const IMP_COLOR: Record<number, string> = {
  1: 'text-[#999]',
  2: 'text-[#FFA500]',
  3: 'text-[#FF3B30]',
};

export default function BriefingWidget({ compact }: Props) {
  const [overnight, setOvernight] = useState<OvernightItem[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [events, setEvents] = useState<EconEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/home/briefing').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/calendar/upcoming?days=7&minImportance=2&limit=10').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([b, e]) => {
        if (cancelled) return;
        setOvernight(b?.overnight ?? []);
        setSchedule(b?.schedule ?? []);
        setEvents((e?.events ?? []).slice(0, compact ? 5 : 20));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [compact]);

  return (
    <div className="flex flex-col h-full bg-white min-w-0">
      <WidgetHeader title="장전 브리핑" subtitle="간밤 미증시 · 주요 공시 · 경제지표" href="/briefing" />

      {loading ? (
        <div className="flex-1 p-3 space-y-2 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 bg-[#F0F0F0] rounded" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {/* 간밤 미증시 */}
          <section>
            <h4 className="px-4 pt-3 pb-1 text-[10px] font-bold text-[#999] tracking-wide uppercase">간밤 미증시</h4>
            {overnight.length === 0 ? (
              <p className="px-4 pb-2 text-[11px] text-[#BBB]">데이터 없음</p>
            ) : (
              <ul>
                {overnight.map((item, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-1.5 border-b border-[#F8F8F8]">
                    <span className="text-xs font-bold text-[#333]">{item.label}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold tabular-nums text-black">{item.val}</span>
                      <span className={`ml-2 text-[11px] font-bold tabular-nums ${item.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                        {item.change}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 오늘 주요 공시 */}
          <section>
            <h4 className="px-4 pt-3 pb-1 text-[10px] font-bold text-[#999] tracking-wide uppercase">오늘 주요 공시</h4>
            {schedule.length === 0 ? (
              <p className="px-4 pb-2 text-[11px] text-[#BBB]">오늘 주요 공시 없음</p>
            ) : (
              <ul>
                {schedule.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 px-4 py-1.5 border-b border-[#F8F8F8]">
                    <span className="mt-1.5 inline-block w-1 h-1 rounded-full bg-[#FF3B30] shrink-0" />
                    <span className="text-[11px] text-[#333] leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 이번주 주요 지표 */}
          <section>
            <h4 className="px-4 pt-3 pb-1 text-[10px] font-bold text-[#999] tracking-wide uppercase">이번주 주요 지표</h4>
            {events.length === 0 ? (
              <p className="px-4 pb-2 text-[11px] text-[#BBB]">예정 지표 없음</p>
            ) : (
              <ul>
                {events.map((e, i) => (
                  <li key={i} className="flex items-center gap-1.5 px-4 py-1.5 border-b border-[#F8F8F8]">
                    <span className="text-[9px] text-[#999] w-9 shrink-0 tabular-nums">{e.date?.slice(5)}</span>
                    <span className="text-base shrink-0">{e.flag}</span>
                    <span className={`text-[10px] font-bold shrink-0 ${IMP_COLOR[e.importance]}`}>
                      {'●'.repeat(e.importance)}
                    </span>
                    <span className="text-[11px] text-black truncate">{e.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
