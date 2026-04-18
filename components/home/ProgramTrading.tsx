'use client';

import { TrendingUp } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function ProgramTrading() {
  return (
    <ComingSoonCard
      title="프로그램 매매"
      icon={<TrendingUp className="w-4 h-4 text-[#0ABAB5]" />}
      description="차익·비차익 거래 집계 — KRX 크롤링 연동 후 공개"
      eta="KRX 데이터 연결 후"
    />
  );
}
