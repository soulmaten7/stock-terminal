'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { GripVertical, X, ExternalLink } from 'lucide-react';

type Fav = { id: number; name: string; url: string; category: string };

function host(u: string) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }

export default function FavoritesClient() {
  const t = useTranslations('Favorites');
  const tf = useTranslations('Feed'); // '즐겨찾기 해제' 재사용(dedup)
  const [items, setItems] = useState<Fav[]>([]);
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/toolbox/favorite')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.favorites ?? []); setAuth(j.auth !== false); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const persist = (next: Fav[]) => {
    fetch('/api/toolbox/favorite', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: next.map((x) => x.id) }),
    }).catch(() => {});
  };

  const onDragEnter = (i: number) => {
    const from = dragIdx.current;
    if (from === null || from === i) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      dragIdx.current = i;
      return next;
    });
  };
  const onDragEnd = () => { dragIdx.current = null; persist(items); };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    fetch('/api/toolbox/favorite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: id, favorite: false }),
    }).catch(() => {});
  };

  if (loading) return <p className="py-16 text-center text-sm text-unjong-muted">{t('loading')}</p>;
  if (!auth) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-16 text-center">
        <p className="text-sm text-unjong-muted">{t('loginForLinks')}</p>
        <Link href="/auth/login" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">{t('loginLink')}</Link>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-16 text-center">
        <p className="text-sm leading-relaxed text-unjong-muted">{t.rich('emptyLinks', { br: () => <br /> })}</p>
        <Link href="/" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">{t('goCategories')}</Link>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {items.map((f, i) => (
        <li
          key={f.id}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://www.google.com/s2/favicons?domain=${host(f.url)}&sz=64`} alt="" draggable={false} className="h-5 w-5 shrink-0" />
          <a href={f.url} target="_blank" rel="noopener noreferrer" draggable={false} className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{f.name}</span>
            <span className="hidden shrink-0 text-xs text-unjong-muted sm:inline">{host(f.url)}</span>
            <ExternalLink size={11} className="shrink-0 text-unjong-border" />
          </a>
          <button type="button" onClick={() => remove(f.id)} aria-label={tf('favRemove')} className="shrink-0 text-unjong-border transition-colors hover:text-unjong-danger">
            <X size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
