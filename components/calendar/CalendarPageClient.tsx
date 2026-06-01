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
              <p className="text-sm text-[#999]">최종 업데이트: {updatedAt} (월 1회 수동 갱신)</p>
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
                  className={`text-sm font-bold px-3 py-1.5 ${
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
                  className={`text-sm font-bold px-3 py-1.5 ${
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
                  className={`text-sm font-bold px-3 py-1.5 ${
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
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-sm">날짜</th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-sm">시각(KST)</th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-sm">국가</th>
                  <th className="px-4 py-2.5 text-left font-bold text-[#666] text-sm">이벤트</th>
                  <th className="px-4 py-2.5 text-right font-bold text-[#666] text-sm">예상</th>
                  <th className="px-4 py-2.5 text-right font-bold text-[#666] text-sm">이전</th>
                  <th className="px-4 py-2.5 text-center font-bold text-[#666] text-sm">중요도</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#999]">로딩 중…</td></tr>
                )}
                {!loading && filteredEvents.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#999]">조건에 맞는 이벤트 없음</td></tr>
                )}
                {!loading &&
                  filteredEvents.map((e, i) => (
                    <tr
                      key={`${e.date}-${e.time}-${i}`}
                      className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]"
                    >
                      <td className="px-4 py-2.5 text-[#333]">{e.date}</td>
                      <td className="px-4 py-2.5 text-[#333] font-mono text-sm">{e.time}</td>
                      <td className="px-4 py-2.5 text-base">{e.flag}</td>
                      <td className="px-4 py-2.5 text-[#333] font-bold">{e.title}</td>
                      <td className="px-4 py-2.5 text-right text-[#333]">{e.forecast}</td>
                      <td className="px-4 py-2.5 text-right text-[#666]">{e.previous}</td>
                      <td className={`px-4 py-2.5 text-center font-bold text-sm ${IMPORTANCE_COLOR[e.importance]}`}>
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
        <p className="text-sm text-[#999] mb-3">
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
