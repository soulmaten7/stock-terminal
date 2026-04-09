'use client';

const FLOW = [
  { label: '외국인', value: 1200, color: '#FF3B30' },
  { label: '기관', value: -800, color: '#007AFF' },
  { label: '개인', value: -400, color: '#999999' },
  { label: '프로그램(차익)', value: 215, color: '#34C759' },
  { label: '프로그램(비차익)', value: -108, color: '#FF9500' },
];

export default function MarketFlow() {
  const maxAbs = Math.max(...FLOW.map((f) => Math.abs(f.value)));
  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-6">
      <h2 className="text-lg font-bold text-black mb-4">시장 전체 수급</h2>
      <div className="space-y-3">
        {FLOW.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="text-sm font-bold text-black w-28 shrink-0">{f.label}</span>
            <div className="flex-1 h-6 bg-[#F5F5F5] relative">
              <div className="absolute top-0 h-full" style={{
                width: `${(Math.abs(f.value) / maxAbs) * 100}%`,
                backgroundColor: f.color,
                left: f.value >= 0 ? '50%' : undefined,
                right: f.value < 0 ? '50%' : undefined,
              }} />
            </div>
            <span className={`text-sm font-mono-price font-bold w-20 text-right ${f.value >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
              {f.value >= 0 ? '+' : ''}{f.value.toLocaleString()}억
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
