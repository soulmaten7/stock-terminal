'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { GripVertical, X, ExternalLink, Globe } from 'lucide-react';

type RoomFav = { biz_no: string; name: string; homepage: string | null; platform: string };

function iconOf(p: string, homepage: string | null): string | null {
  const f = (d: string) => `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
  if (p === 'telegram') return f('telegram.org');
  if (p === 'kakao') return f('kakaocorp.com');
  if (p === 'naver') return f('naver.com');
  if (homepage) { try { return f(new URL(homepage).hostname); } catch { return null; } }
  return null;
}

export default function RoomFavoritesClient() {
  const t = useTranslations('Favorites');
  const tf = useTranslations('Feed'); // '즐겨찾기 해제' 재사용(dedup)
  const [items, setItems] = useState<RoomFav[]>([]);
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/rooms/favorite')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.favorites ?? []); setAuth(j.auth !== false); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const persist = (next: RoomFav[]) => {
    fetch('/api/rooms/favorite', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((x) => x.biz_no) }),
    }).catch(() => {});
  };
  const onDragEnter = (i: number) => {
    const from = dragIdx.current;
    if (from === null || from === i) return;
    setItems((prev) => { const n = [...prev]; const [m] = n.splice(from, 1); n.splice(i, 0, m); dragIdx.current = i; return n; });
  };
  const onDragEnd = () => { dragIdx.current = null; persist(items); };
  const remove = (biz_no: string) => {
    setItems((prev) => prev.filter((x) => x.biz_no !== biz_no));
    fetch('/api/rooms/favorite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biz_no, favorite: false }),
    }).catch(() => {});
  };

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">{t('loading')}</p>;
  if (!auth) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm text-unjong-muted">{t('loginForRooms')}</p>
        <Link href="/auth/login" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">{t('loginLink')}</Link>
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center text-sm text-unjong-muted">{t('emptyRooms')}</p>;
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {items.map((f, i) => {
        const icon = iconOf(f.platform, f.homepage);
        return (
          <li
            key={f.biz_no}
            draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragEnter={() => onDragEnter(i)}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={onDragEnd}
            className="group flex items-center gap-2 border-b border-unjong-border px-3 py-2.5 last:border-0 hover:bg-unjong-background"
          >
            <span className="cursor-grab text-unjong-border transition-colors group-hover:text-unjong-muted active:cursor-grabbing" aria-hidden>
              <GripVertical size={16} />
            </span>
            {icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={icon} alt="" draggable={false} className="h-5 w-5 shrink-0 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
            ) : <Globe size={16} className="shrink-0 text-unjong-muted" />}
            {f.homepage ? (
              <a href={f.homepage} target="_blank" rel="noopener noreferrer nofollow" draggable={false} className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{f.name}</span>
                <ExternalLink size={11} className="shrink-0 text-unjong-border" />
              </a>
            ) : (
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary">{f.name}</span>
            )}
            <button type="button" onClick={() => remove(f.biz_no)} aria-label={tf('favRemove')} className="shrink-0 text-unjong-border transition-colors hover:text-unjong-danger">
              <X size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
