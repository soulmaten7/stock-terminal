'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

// 광고 슬롯 — 미니멀 CTA. '광고 문의하기'만.
export default function AdSlotRow({ slot }: { slot: 'broker' | 'room' | 'feed' }) {
  return (
    <Link
      href={`/advertise?slot=${slot}`}
      className="flex items-center justify-center gap-0.5 border-b border-unjong-border py-2 text-xs text-unjong-muted transition-colors hover:text-unjong-accent"
    >
      광고 문의하기 <ChevronRight size={12} />
    </Link>
  );
}
