'use client';

import Link from 'next/link';
import { Megaphone, ChevronRight } from 'lucide-react';

// 공용 광고 슬롯 행 — 가짜 광고주 대신 '광고 문의하기' CTA(/advertise). 증권사·리딩방 공통.
export default function AdSlotRow({ slot, label }: { slot: 'broker' | 'room'; label: string }) {
  return (
    <Link
      href={`/advertise?slot=${slot}`}
      className="group flex items-center gap-3 border-b border-l-2 border-unjong-border border-l-unjong-accent bg-unjong-accent/[0.06] px-2 py-2.5 ring-1 ring-inset ring-unjong-accent/25 transition-colors hover:bg-unjong-accent/[0.12]"
    >
      <span className="shrink-0 rounded bg-unjong-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-accent">광고</span>
      <Megaphone size={16} className="shrink-0 text-unjong-accent" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{label} — 이 자리에 광고하세요</span>
        <span className="truncate text-[11px] text-unjong-muted">트릴리언 광고 문의하기</span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-unjong-accent">
        문의하기 <ChevronRight size={13} />
      </span>
    </Link>
  );
}
