'use client';

import { ReactNode } from 'react';

interface WidgetCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function WidgetCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}: WidgetCardProps) {
  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col h-full ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0] shrink-0">
          <div className="flex items-baseline gap-2">
            {title && <h3 className="text-sm font-bold text-black">{title}</h3>}
            {subtitle && <span className="text-xs text-[#999999]">{subtitle}</span>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`flex-1 min-h-0 overflow-auto ${bodyClassName}`}>{children}</div>
    </div>
  );
}
