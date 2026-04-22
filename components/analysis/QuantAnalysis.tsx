'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { BarChart3 } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function QuantAnalysis({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <BarChart3 className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          퀀트 분석 — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          시장 전체 대비 가치·모멘텀·퀄리티 퍼센타일 산출에는 전종목 시장 데이터 집계 파이프라인이 필요합니다.
          시총 TOP 100 기준 팩터 스코어는 후속 데이터 수집 이후 공개됩니다.
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: STEP 45+
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
