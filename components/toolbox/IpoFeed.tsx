'use client';

import { useEffect, useState } from 'react';
import { getCache, setCache } from '@/lib/clientCache';

type IpoItem = { name: string; sub: string; price: string; band: string; rate: string; underwriter: string; link: string };

const SRC = 'http://www.38.co.kr/html/fund/index.htm?o=k';

export default function IpoFeed() {
  const [items, setItems] = useState<IpoItem[]>(() => getCache<IpoItem[]>('ipo') ?? []);
  const [loading, setLoading] = useState(() => getCache('ipo') === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/ipo/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache('ipo', list); setLoading(false); } })
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
  if (items.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-unjong-muted">청약일정을 불러오지 못했습니다.</p>
        <a href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-xs text-unjong-accent">38커뮤니케이션에서 직접 보기 →</a>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">공모주 청약일정</p>
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {items.map((it, i) => (
          <a key={`${it.name}${i}`} href={it.link} target="_blank" rel="noopener noreferrer nofollow" className="group block border-b border-unjong-border py-2.5 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-unjong-primary group-hover:text-unjong-accent">{it.name}</p>
              <span className="shrink-0 text-[11px] font-medium text-unjong-primary">{it.sub}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-unjong-muted">
              {it.price ? `확정 ${it.price}원` : it.band ? `희망 ${it.band}` : ''}
              {it.underwriter ? ` · ${it.underwriter}` : ''}
            </p>
          </a>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 38커뮤니케이션. 청약일정은 증권신고서 수리과정에서 변경될 수 있습니다.</p>
    </div>
  );
}
