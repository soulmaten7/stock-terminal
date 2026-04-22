'use client';

import DisclaimerBanner from '@/components/common/DisclaimerBanner';
import { LineChart } from 'lucide-react';

interface Props {
  stockId: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function TechnicalAnalysis({ stockId }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-dark-700 rounded-lg p-10 border border-dashed border-border text-center">
        <LineChart className="w-12 h-12 mx-auto text-text-secondary mb-4" />
        <h3 className="text-lg font-bold text-text-primary mb-2">
          기술적 분석 — 준비 중
        </h3>
        <p className="text-sm text-text-secondary max-w-lg mx-auto leading-relaxed mb-4">
          이동평균·볼린저밴드·RSI 등 기술 지표는 일봉 시계열이 필요합니다.
          stock_prices 테이블 시딩 후 활성화 예정 — 현재는 /stocks/[symbol] 기본 페이지의 1년 라인차트만 제공합니다.
        </p>
        <span className="inline-block px-3 py-1 rounded text-xs bg-accent/10 text-accent font-bold border border-accent/20">
          예정: STEP 42
        </span>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
