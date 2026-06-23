'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import ListRow from './ListRow';

export type LinkItem = {
  id: number;
  site_name: string;
  site_url: string;
  description: string | null;
  logo_url: string | null;
  isFavorite?: boolean;
};

export default function LinkCard({
  link, isLoggedIn, onFavoriteToggle,
}: {
  link: LinkItem;
  isLoggedIn: boolean;
  onFavoriteToggle: (id: number, fav: boolean) => void;
}) {
  const router = useRouter();
  const [fav, setFav] = useState(link.isFavorite ?? false);
  const [favLoading, setFavLoading] = useState(false);

  const domain = (() => {
    try { return new URL(link.site_url).hostname.replace(/^www\./, ''); }
    catch { return link.site_url; }
  })();

  const handleClick = () => {
    fetch('/api/toolbox/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkId: link.id }),
    }).catch(() => {});
    window.open(link.site_url, '_blank', 'noopener,noreferrer');
  };

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) { router.push('/auth/login'); return; }
    if (favLoading) return;
    setFavLoading(true);
    const next = !fav;
    setFav(next);
    try {
      await fetch('/api/toolbox/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId: link.id, favorite: next }),
      });
      onFavoriteToggle(link.id, next);
    } catch {
      setFav(!next);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <ListRow
      href={link.site_url}
      onClick={handleClick}
      iconUrl={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      title={link.site_name}
      subtitle={domain}
      meta={link.description || ''}
      trailing={
        <button
          type="button"
          onClick={handleFav}
          aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          className={`transition-colors ${fav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={16} fill={fav ? 'currentColor' : 'none'} />
        </button>
      }
    />
  );
}
