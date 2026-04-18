'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Partner = {
  id: number;
  slug: string;
  name: string;
  logo_url?: string | null;
  description?: string | null;
  category?: string | null;
  cta_text?: string | null;
};

export default function PartnerSlot({
  slotKey,
  className = '',
  variant = 'card',
}: {
  slotKey: string;
  className?: string;
  variant?: 'card' | 'compact';
}) {
  const [partner, setPartner] = useState<Partner | null>(null);

  useEffect(() => {
    fetch(`/api/partners/slots?key=${encodeURIComponent(slotKey)}`)
      .then((r) => r.json())
      .then((d) => setPartner(d.partners?.[0] ?? null))
      .catch(() => {});
  }, [slotKey]);

  if (!partner) return null;

  const href = `/partner/${partner.slug}?utm_source=slot&utm_medium=${encodeURIComponent(slotKey)}`;

  if (variant === 'compact') {
    return (
      <Link
        href={href}
        className={`block border border-[#E5E7EB] hover:border-[#0ABAB5] rounded-lg p-3 bg-white transition-colors ${className}`}
      >
        <div className="flex items-center gap-3">
          {partner.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={partner.logo_url} alt={partner.name} className="h-8 w-auto object-contain" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black truncate">{partner.name}</p>
            {partner.description && (
              <p className="text-xs text-[#666666] truncate">{partner.description}</p>
            )}
          </div>
          <span className="text-xs text-[#0ABAB5] font-bold flex-shrink-0">→</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`block border border-[#E5E7EB] hover:border-[#0ABAB5] rounded-xl p-5 bg-white transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        {partner.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={partner.logo_url} alt={partner.name} className="h-10 w-auto object-contain" />
        )}
        <span className="text-[10px] text-[#999999] font-bold flex-shrink-0">AD</span>
      </div>
      <h3 className="text-base font-bold text-black mb-1">{partner.name}</h3>
      {partner.description && (
        <p className="text-sm text-[#555555] leading-relaxed mb-3 line-clamp-3">{partner.description}</p>
      )}
      <span className="inline-block text-xs font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-3 py-1 rounded">
        {partner.cta_text || '자세히 보기'} →
      </span>
    </Link>
  );
}
