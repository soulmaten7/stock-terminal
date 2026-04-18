'use client';

import type { Stock } from '@/types/stock';

export default function OverviewTab({ stock }: { stock: Stock }) {
  // TODO(W2.2): DART /api/dart/company + KIS 가격 데이터로 KPI 채우기
  const KPIS = [
    { label: '시가총액', value: '—' },
    { label: 'PER', value: '—' },
    { label: 'PBR', value: '—' },
    { label: 'EPS', value: '—' },
    { label: 'BPS', value: '—' },
    { label: 'ROE', value: '—' },
    { label: '배당수익률', value: '—' },
    { label: '52주 범위', value: '—' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI 그리드 */}
      <div>
        <h2 className="text-base font-bold text-black mb-3">핵심 지표</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-3"
            >
              <p className="text-[#666666] text-xs font-bold mb-1">{k.label}</p>
              <p className="text-black font-mono-price font-bold text-base">{k.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 기업개황 */}
      <div>
        <h2 className="text-base font-bold text-black mb-3">기업개황</h2>
        <div className="bg-white border border-[#E5E7EB] rounded p-4 text-sm text-[#666666]">
          <p>
            대표이사, 본사 주소, 홈페이지, 전화번호, 업종, 설립일 등 기업 기본 정보는 W2.2 에서
            DART API 로 연동됩니다.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div><span className="font-bold text-black">종목코드: </span>{stock.symbol}</div>
            <div><span className="font-bold text-black">시장: </span>{stock.market}</div>
            <div><span className="font-bold text-black">섹터: </span>{stock.sector ?? '—'}</div>
            <div><span className="font-bold text-black">국가: </span>{stock.country}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
