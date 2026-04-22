'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { Users } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SupplyAnalysis({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <Users className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          수급 분석 — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          종목별 외국인·기관·개인 순매수 일별 시계열은 KIS per-stock investor-flow API (FHKST01010900) 수집 파이프라인이 필요합니다.
          /analysis 페이지 전체 시장 수급 위젯은 이미 실데이터로 동작 중입니다.
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: STEP 43
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
