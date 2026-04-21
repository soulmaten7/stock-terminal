'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

interface WidgetCardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** 상세 페이지 경로 — 설정 시 우상단 ↗ 버튼 표시 */
  href?: string;
  /** 제목 텍스트 크기 variant — R4 발견 존에서 large 사용 */
  size?: 'default' | 'large';
}

export default function WidgetCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
  href,
  size = 'default',
}: WidgetCardProps) {
  const router = useRouter();
  const titleCls = 'text-lg font-bold text-black';
  const subtitleCls = 'text-xs text-[#999999]';
  const headerPadCls = 'px-4 py-4';

  return (
    <div
      className={`bg-white border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col h-full ${className}`}
    >
      {(title || action || href) && (
        <div className={`flex items-center justify-between ${headerPadCls} border-b border-[#F0F0F0] shrink-0`}>
          <div className="flex items-baseline gap-2">
            {title && <h3 className={titleCls}>{title}</h3>}
            {subtitle && <span className={subtitleCls}>{subtitle}</span>}
          </div>
          <div className="flex items-center gap-1">
            {action && <div>{action}</div>}
            {href && (
              <button
                onClick={() => router.push(href)}
                className="ml-1 text-[#BBBBBB] hover:text-[#0ABAB5] transition-colors"
                title="상세 페이지로 이동"
                aria-label={`${title} 상세 페이지`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className={`flex-1 min-h-0 overflow-auto ${bodyClassName}`}>{children}</div>
    </div>
  );
}
