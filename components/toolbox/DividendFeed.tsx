'use client';

import { useEffect, useState } from 'react';
import { getCache, setCache } from '@/lib/clientCache';

type DivItem = { code: string; name: string; yield: number; exDate: string; dividend: string };

export default function DividendFeed() {
  const [items, setItems] = useState<DivItem[]>(() => getCache<DivItem[]>('dividend') ?? []);
  const [loading, setLoading] = useState(() => getCache('dividend') === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dividend/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache('dividend', list); setLoading(false); } })
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
  if (items.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">배당 정보를 불러오지 못했습니다.</p>;

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">고배당 TOP</p>
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {items.map((it, i) => (
          <div key={`${it.code}${i}`} className="flex items-center justify-between border-b border-unjong-border py-2.5 last:border-0">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-[13px] font-semibold text-unjong-primary">{it.name}</p>
              <p className="text-[11px] text-unjong-muted">{it.code} · 주당 {it.dividend}{it.exDate !== '—' ? ` · 배당락 ${it.exDate}` : ''}</p>
            </div>
            <span className="shrink-0 text-sm font-bold text-red-500">{it.yield.toFixed(2)}%</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">배당수익률 기준 상위. 과거 배당 기록이며 미래 배당을 보장하지 않습니다.</p>
    </div>
  );
}
