'use client';

import { useState } from 'react';
import LinkCard, { type LinkItem } from './LinkCard';
import PartnerSlot from '@/components/partners/PartnerSlot';

function PartnerSlotPlaceholder({ slotId, slug }: { slotId: string; slug: string }) {
  if (slug === 'exchange') {
    return <PartnerSlot slotKey={slotId} variant="compact" className="mb-3" />;
  }
  return (
    <div
      data-slot={slotId}
      className="border border-dashed border-[#E5E7EB] rounded-xl px-4 py-3 text-[11px] text-[#BBBBBB] text-center mb-3"
    >
      Partner Slot — W4 구현 예정
    </div>
  );
}

export default function CategorySection({
  slug,
  label,
  links,
  defaultOpen,
  isLoggedIn,
  onFavoriteToggle,
}: {
  slug: string;
  label: string;
  links: LinkItem[];
  defaultOpen: boolean;
  isLoggedIn: boolean;
  onFavoriteToggle: (id: number, fav: boolean) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-3 border-b border-[#E5E7EB] group"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-black text-sm group-hover:text-[#0ABAB5] transition-colors">
            {label}
          </span>
          <span className="bg-[#F5F7FA] text-[#666666] text-[10px] font-bold px-2 py-0.5 rounded-full">
            {links.length}
          </span>
        </div>
        <span className={`text-[#999999] text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="pt-3 pb-4">
          <PartnerSlotPlaceholder slotId={`toolbox-category-${slug}`} slug={slug} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {links.map((link) => (
              <LinkCard
                key={link.id}
                link={link}
                isLoggedIn={isLoggedIn}
                onFavoriteToggle={onFavoriteToggle}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
