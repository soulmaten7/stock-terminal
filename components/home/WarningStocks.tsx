'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const DUMMY = [
  { symbol: '000000', name: '(주)테스트A', type: '투자주의', color: 'text-[#FF9500]' },
  { symbol: '000001', name: '(주)테스트B', type: '투자경고', color: 'text-[#FF4D4D]' },
  { symbol: '000002', name: '(주)테스트C', type: '투자위험', color: 'text-[#FF4D4D]' },
];

export default function WarningStocks() {
  return (
    <div className="p-4 h-full">
      <h3 className="text-black font-bold text-sm mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#FF9500]" /> 투자주의/경고
      </h3>
      <div className="space-y-2">
        {DUMMY.map((s) => (
          <Link key={s.symbol} href={`/stocks/${s.symbol}`}
            className="flex items-center justify-between py-1.5 hover:bg-[#F5F7FA] px-2 -mx-2 rounded">
            <span className="text-black font-bold text-sm">{s.name}</span>
            <span className={`text-xs font-bold ${s.color}`}>{s.type}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
