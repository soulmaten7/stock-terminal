'use client';

import { LayoutGrid } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function SectorHeatmap() {
  return (
    <ComingSoonCard
      title="업종별 히트맵"
      icon={<LayoutGrid className="w-4 h-4 text-[#0ABAB5]" />}
      description="KRX 업종별 지수 (11개 GICS 섹터) 연결 준비 중 — 가짜 데이터 대신 정직한 상태 표시."
      eta="KRX data.krx.co.kr 스크래핑/공공데이터 API 연결 후"
    />
  );
}
