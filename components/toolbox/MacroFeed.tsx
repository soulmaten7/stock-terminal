'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getCache, setCache } from '@/lib/clientCache';

type Indicator = { country: 'KR' | 'US'; label: string; value: string; unit: string; date: string | null; change: number | null };

// 기준일자 표시용 — YYYY-MM-DD / YYYYMM / YYYYMMDD / YYYY 등 관용 포맷
function fmtDate(d: string): string {
  const s = d.trim();
  const m = s.match(/^(\d{4})[-/.]?(\d{1,2})?[-/.]?(\d{1,2})?/);
  if (m) {
    const [, y, mo, da] = m;
    if (da) return `${y}.${mo!.padStart(2, '0')}.${da.padStart(2, '0')}`;
    if (mo) return `${y}.${mo.padStart(2, '0')}`;
    return y;
  }
  return s;
}

function Row({ it }: { it: Indicator }) {
  const t = useTranslations('Feed');
  const up = it.change != null && it.change > 0;
  const down = it.change != null && it.change < 0;
  return (
    <div className="flex items-center justify-between border-b border-unjong-border py-2.5 last:border-0">
      <span className="min-w-0 flex-1 pr-2">
        <span className="block truncate text-[13px] text-unjong-primary">{it.label}</span>
        {it.date ? <span className="mt-0.5 block text-[10px] text-unjong-muted">{t('macro.asOf', { d: fmtDate(it.date) })}</span> : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-semibold text-unjong-primary">{it.value}</span>
        {it.unit ? <span className="ml-0.5 text-[10px] text-unjong-muted">{it.unit}</span> : null}
        {it.change != null ? (
          <span className={`ml-1 text-[11px] ${up ? 'text-red-500' : down ? 'text-blue-500' : 'text-unjong-muted'}`}>
            {up ? '▲' : down ? '▼' : ''}{Math.abs(it.change)}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export default function MacroFeed({ defaultView = 'kr' }: { defaultView?: 'kr' | 'us' } = {}) {
  const t = useTranslations('Feed');
  const cached = getCache<{ kr: Indicator[]; us: Indicator[] }>('macro');
  const [kr, setKr] = useState<Indicator[]>(cached?.kr ?? []);
  const [us, setUs] = useState<Indicator[]>(cached?.us ?? []);
  const [loading, setLoading] = useState(cached === undefined);
  const [view, setView] = useState<'kr' | 'us'>(defaultView);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/macro/summary')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const k = j.kr ?? []; const u = j.us ?? []; setKr(k); setUs(u); setCache('macro', { kr: k, us: u }); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
  if (kr.length === 0 && us.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">{t('macro.error')}</p>;

  const list = view === 'kr' ? kr : us;

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">{t('macro.title')}</p>

      {/* 한국/미국 토글 */}
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setView('kr')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'kr' ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          {t('macro.kr')}
        </button>
        <button
          type="button"
          onClick={() => setView('us')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'us' ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          {t('macro.us')}
        </button>
      </div>

      {/* 박스 */}
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {list.length > 0 ? (
          list.map((it, i) => <Row key={`${view}${i}`} it={it} />)
        ) : (
          <p className="py-8 text-center text-sm text-unjong-muted">{t('macro.empty')}</p>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{t('macro.source')}</p>
    </div>
  );
}
