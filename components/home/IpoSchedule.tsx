'use client';

import { CalendarPlus } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function IpoSchedule() {
  return (
    <ComingSoonCard
      title="IPO 일정"
      icon={<CalendarPlus className="w-4 h-4 text-[#0ABAB5]" />}
      description="신규 공모주 청약·상장 일정 — DART·KRX 공시 기반 연동 후 공개"
      eta="공시 파이프라인 연결 후"
    />
  );
}
