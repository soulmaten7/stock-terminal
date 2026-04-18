'use client';

const FUTURES = [
  { name: 'S&P 500', value: '5,432.10', change: '+0.82%', positive: true },
  { name: 'NASDAQ', value: '17,123.45', change: '+1.12%', positive: true },
  { name: 'WTI 원유', value: '$72.34', change: '-1.24%', positive: false },
  { name: '금', value: '$2,345.60', change: '+0.35%', positive: true },
];

export default function GlobalFutures() {
  return (
    <div className="p-4 h-full">
      <h3 className="text-black font-bold text-sm mb-3">글로벌 선물</h3>
      <div className="grid grid-cols-2 gap-3">
        {FUTURES.map((f) => (
          <div key={f.name} className="bg-[#F5F7FA] p-3 border border-[#E5E7EB] rounded">
            <p className="text-[#666666] text-xs font-bold mb-1">{f.name}</p>
            <p className="text-black font-mono-price font-bold text-base">{f.value}</p>
            <p className={`font-mono-price font-bold text-sm ${f.positive ? 'text-[#FF4D4D]' : 'text-[#2196F3]'}`}>{f.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
