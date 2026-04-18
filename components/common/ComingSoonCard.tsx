'use client';

import { Clock } from 'lucide-react';
import type { ReactNode } from 'react';

interface ComingSoonCardProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  eta?: string;
}

export default function ComingSoonCard({
  title,
  icon,
  description,
  eta = 'Phase 2',
}: ComingSoonCardProps) {
  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-black font-bold text-sm mb-3 flex items-center gap-2">
        {icon ?? <Clock className="w-4 h-4 text-[#999999]" />}
        <span>{title}</span>
      </h3>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-2 bg-[#F5F7FA] rounded border border-dashed border-[#E5E7EB]">
        <div className="text-[#666666] text-sm font-bold mb-2">데이터 준비 중</div>
        {description && (
          <p className="text-[#999999] text-xs leading-relaxed mb-3 max-w-[240px]">
            {description}
          </p>
        )}
        <span className="inline-block px-2.5 py-1 rounded text-[11px] bg-[#0ABAB5]/10 text-[#0ABAB5] font-bold border border-[#0ABAB5]/20">
          예정: {eta}
        </span>
      </div>
    </div>
  );
}
