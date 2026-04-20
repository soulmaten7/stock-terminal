'use client';

import WidgetCard from '@/components/home/WidgetCard';

export default function ChartWidget({ symbol = '005930' }: { symbol?: string }) {
  const krxSymbol = `KRX:${symbol}`;

  return (
    <WidgetCard
      title="차트"
      subtitle={krxSymbol}
      className="h-full"
      action={
        <span className="text-[10px] text-[#999]">TradingView · Phase B 심볼 연동</span>
      }
    >
      <div className="relative h-full min-h-[300px] bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="text-center px-6">
          <div className="text-2xl mb-2">📈</div>
          <p className="text-sm font-bold text-[#333] mb-1">TradingView 차트 위젯</p>
          <p className="text-xs text-[#999] mb-3">
            심볼: <span className="font-mono text-[#0ABAB5]">{krxSymbol}</span>
          </p>
          <span className="inline-block text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-3 py-1 rounded border border-[#0ABAB5]/20">
            준비 중 — Phase B에서 TradingView iframe 임베드
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}
