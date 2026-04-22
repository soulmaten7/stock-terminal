'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface WidgetShellProps {
  title: string;
  icon?: ReactNode;
  detailHref?: string;
  className?: string;
  children: ReactNode;
}

export default function WidgetShell({
  title,
  icon,
  detailHref,
  className = '',
  children,
}: WidgetShellProps) {
  return (
    <section
      className={`flex flex-col h-full bg-white border border-[#E5E7EB] overflow-hidden ${className}`}
    >
      <header className="flex items-center justify-between px-3 py-2 border-b border-[#E5E7EB] shrink-0 bg-[#FAFAFA]">
        <h3 className="flex items-center gap-1.5 text-xs font-bold text-black">
          {icon}
          {title}
        </h3>
        {detailHref && (
          <Link
            href={detailHref}
            className="flex items-center gap-0.5 text-[11px] text-[#999999] hover:text-[#0ABAB5] transition-colors"
          >
            더보기
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </header>
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </section>
  );
}
