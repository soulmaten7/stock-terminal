'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { Coins } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DividendAnalysis({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <Coins className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          배당 분석 — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          배당 수익률·배당 성향·배당 성장률 시계열을 위한 dividends 테이블이 아직 비어 있습니다.
          DART 배당 공시 수집 파이프라인 구축 이후 활성화 예정.
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: STEP 44
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
