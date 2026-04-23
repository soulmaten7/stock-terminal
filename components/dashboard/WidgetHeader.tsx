'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function WidgetHeader({
  title,
  subtitle,
  href,
  linkLabel,
  actions,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] bg-white sticky top-0 z-10 shrink-0">
      <div className="flex items-baseline gap-2 min-w-0">
        <h3 className="text-sm font-semibold text-[#222] truncate">{title}</h3>
        {subtitle && <span className="text-[10px] text-[#999] truncate hidden sm:inline">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        {href && (
          <Link href={href} className="flex items-center gap-0.5 text-xs text-[#0ABAB5] hover:underline whitespace-nowrap">
            {linkLabel ?? '전체보기'}
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
