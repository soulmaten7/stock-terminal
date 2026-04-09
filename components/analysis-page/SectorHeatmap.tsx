'use client';

const SECTORS = [
  { name: 'IT/반도체', change: 2.3, weight: 25 }, { name: '바이오', change: -1.2, weight: 12 },
  { name: '자동차', change: 1.5, weight: 10 }, { name: '금융', change: 0.8, weight: 15 },
  { name: '화학', change: -0.5, weight: 8 }, { name: '철강', change: 1.1, weight: 6 },
  { name: '건설', change: -2.1, weight: 5 }, { name: '유통', change: 0.3, weight: 7 },
  { name: '에너지', change: -0.8, weight: 4 }, { name: '미디어', change: 3.1, weight: 4 },
  { name: '운송', change: -0.3, weight: 4 },
];

function getColor(change: number) {
  if (change > 2) return 'bg-[#16A34A] text-white';
  if (change > 0) return 'bg-[#4ADE80] text-black';
  if (change > -1) return 'bg-[#E5E7EB] text-black';
  if (change > -2) return 'bg-[#FCA5A5] text-black';
  return 'bg-[#EF4444] text-white';
}

export default function SectorHeatmap() {
  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-6">
      <h2 className="text-lg font-bold text-black mb-4">업종별 히트맵</h2>
      <div className="flex flex-wrap gap-2">
        {SECTORS.map((s) => (
          <div key={s.name} className={`${getColor(s.change)} px-4 py-3 font-bold text-sm cursor-pointer hover:opacity-80`}
            style={{ flexBasis: `${Math.max(s.weight * 3, 80)}px`, flexGrow: s.weight }}>
            <p className="text-xs">{s.name}</p>
            <p className="text-base font-mono-price">{s.change >= 0 ? '+' : ''}{s.change}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
