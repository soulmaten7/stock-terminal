'use client';

import { useState } from 'react';

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
      className="bg-white border border-[#E5E7EB] rounded-xl p-4 cursor-pointer hover:border-[#0ABAB5] hover:shadow-md transition-all group flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt=""
            width={20}
            height={20}
            className="rounded flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="min-w-0">
            <p className="font-bold text-black text-sm truncate group-hover:text-[#0ABAB5] transition-colors">
              {link.site_name}
            </p>
            <p className="text-[10px] text-[#999999] truncate">{domain}</p>
          </div>
        </div>
        {isLoggedIn && (
          <button
            onClick={handleFav}
            aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            className={`flex-shrink-0 text-lg transition-colors ${fav ? 'text-[#0ABAB5]' : 'text-[#E5E7EB] hover:text-[#0ABAB5]'}`}
          >
            ★
          </button>
        )}
      </div>
      {link.description && (
        <p className="text-[11px] text-[#666666] line-clamp-2 leading-relaxed">
          {link.description}
        </p>
      )}
    </div>
  );
}
