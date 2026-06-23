'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';

type DartItem = {
  corp: string; title: string; cls: string; stockCode: string;
  filer: string; date: string; rcpNo: string; link: string;
};

function dateLabel(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return '';
  const y = +yyyymmdd.slice(0, 4), m = +yyyymmdd.slice(4, 6), d = +yyyymmdd.slice(6, 8);
  const date = new Date(y, m - 1, d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff <= 0) return '오늘';
  if (diff === 1) return '어제';
  return `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
}

export default function DartFeed() {
  const [items, setItems] = useState<DartItem[]>(() => getCache<DartItem[]>('dart') ?? []);
  const [loading, setLoading] = useState(() => getCache('dart') === undefined);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dart/feed')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { const list = j.items ?? []; setItems(list); setCache('dart', list); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return (
    <div className="space-y-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-unjong-background" />
      ))}
    </div>
  );
  if (items.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">공시를 불러오지 못했습니다.</p>;

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">최신 공시</p>
      <ul>
        {items.map((it) => (
          <li key={it.rcpNo}>
            <a href={it.link} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 border-b border-unjong-border py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{it.corp}</span>
                  {it.cls ? <span className="shrink-0 rounded bg-unjong-background px-1 py-0.5 text-[10px] text-unjong-muted">{it.cls}</span> : null}
                </div>
                <p className="line-clamp-2 text-[13px] text-unjong-primary">{it.title}</p>
                <p className="mt-0.5 text-xs text-unjong-muted">{it.filer} · {dateLabel(it.date)}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 금융감독원 전자공시시스템(DART). 클릭 시 DART 원문으로 연결됩니다.</p>
    </div>
  );
}
