'use client';

import { Layers } from 'lucide-react';
import ComingSoonCard from '@/components/common/ComingSoonCard';

export default function ThemeGroups() {
  return (
    <ComingSoonCard
      title="테마별 종목"
      icon={<Layers className="w-4 h-4 text-[#0ABAB5]" />}
      description="테마 분류 큐레이션 작업 중 — 무단 JSON 시드 후 주 1회 업데이트 예정. 현재는 /screener 에서 업종 필터 사용 가능."
      eta="테마 JSON 큐레이션 완료 후 (경제 캘린더와 동일 방식)"
    />
  );
}
