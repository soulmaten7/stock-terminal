'use client';

import { Globe } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function GlobalFutures() {
  return (
    <ComingSoonCard
      title="글로벌 선물"
      icon={<Globe className="w-4 h-4 text-[#0ABAB5]" />}
      description="S&P 500, NASDAQ, WTI, Gold 등 해외 선물 실시간 — 외부 API 연동 후 공개"
      eta="외부 선물 API 연결 후"
    />
  );
}
