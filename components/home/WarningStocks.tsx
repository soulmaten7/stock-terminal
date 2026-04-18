'use client';

import { AlertTriangle } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function WarningStocks() {
  return (
    <ComingSoonCard
      title="투자주의/경고"
      icon={<AlertTriangle className="w-4 h-4 text-[#FF9500]" />}
      description="KRX 지정 투자주의·경고·위험 종목 실시간 — KRX 크롤링 연동 후 공개"
      eta="KRX 데이터 연결 후"
    />
  );
}
