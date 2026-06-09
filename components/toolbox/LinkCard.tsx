'use client';

import { useState } from 'react';
import { Star, ExternalLink } from 'lucide-react';

export type LinkItem = {
  id: number;
  site_name: string;
  site_url: string;
  description: string | null;
  logo_url: string | null;
  isFavorite?: boolean;
};

export default function LinkCard({
  link,
  isLoggedIn,
  onFavoriteToggle,
}: {
  link: LinkItem;
  isLoggedIn: boolean;
  onFavoriteToggle: (id: number, fav: boolean) => void;
}) {
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
    <div
      onClick={handleClick}
      className="group flex cursor-pointer items-center gap-3 border-b border-unjong-border px-2 py-3 transition-colors last:border-b-0 hover:bg-unjong-background"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt=""
        width={22}
        height={22}
        className="shrink-0 rounded"
        onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
      />
      {/* 이름 + 도메인 */}
      <div className="flex w-44 shrink-0 flex-col sm:w-52">
        <span className="truncate text-sm font-bold text-unjong-primary group-hover:text-unjong-accent">
          {link.site_name}
        </span>
        <span className="truncate text-xs text-unjong-muted">{domain}</span>
      </div>
      {/* 한 줄 설명 */}
      <p className="hidden min-w-0 flex-1 truncate text-sm text-unjong-muted sm:block">
        {link.description || ''}
      </p>
      {/* 즐겨찾기 + 외부링크 */}
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
        {isLoggedIn && (
          <button
            type="button"
            onClick={handleFav}
            aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className={`transition-colors ${fav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
          >
            <Star size={16} fill={fav ? 'currentColor' : 'none'} />
          </button>
        )}
        <ExternalLink size={14} className="text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  );
}
