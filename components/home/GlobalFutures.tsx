'use client';

const FUTURES = [
  { name: 'S&P 500', value: '5,432.10', change: '+0.82%', positive: true },
  { name: 'NASDAQ', value: '17,123.45', change: '+1.12%', positive: true },
  { name: 'WTI 원유', value: '$72.34', change: '-1.24%', positive: false },
  { name: '금', value: '$2,345.60', change: '+0.35%', positive: true },
];

export default function GlobalFutures() {
  return (
    <div className="bg-[#0D1117] p-4 border border-[#2D3748] h-full">
      <h3 className="text-white font-bold text-sm mb-3">글로벌 선물</h3>
      <div className="grid grid-cols-2 gap-3">
        {FUTURES.map((f) => (
          <div key={f.name} className="bg-[#161B22] p-3 border border-[#2D3748]">
            <p className="text-[#999999] text-xs font-bold mb-1">{f.name}</p>
            <p className="text-white font-mono-price font-bold text-base">{f.value}</p>
            <p className={`font-mono-price font-bold text-sm ${f.positive ? 'text-[#FF4D4D]' : 'text-[#2196F3]'}`}>{f.change}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
