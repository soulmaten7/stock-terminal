'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getCache, setCache } from '@/lib/clientCache';

type IpoItem = { name: string; sub: string; price: string; band: string; rate: string; underwriter: string; link: string };

const SRC = 'http://www.38.co.kr/html/fund/index.htm?o=k';

export default function IpoFeed() {
  const t = useTranslations('Feed');
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
        <p className="text-sm text-unjong-muted">{t('ipo.error')}</p>
        <a href={SRC} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-xs text-unjong-mint">{t('ipo.direct')}</a>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">{t('ipo.title')}</p>
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {items.map((it, i) => (
          <a key={`${it.name}${i}`} href={it.link} target="_blank" rel="noopener noreferrer nofollow" className="group block border-b border-unjong-border py-2.5 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-unjong-primary group-hover:text-unjong-mint">{it.name}</p>
              <span className="shrink-0 text-[11px] font-medium text-unjong-primary">{it.sub}</span>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-unjong-muted">
              {it.price ? t('ipo.fixed', { v: it.price }) : it.band ? t('ipo.band', { v: it.band }) : ''}
              {it.underwriter ? ` · ${it.underwriter}` : ''}
            </p>
          </a>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">{t('ipo.source')}</p>
    </div>
  );
}
