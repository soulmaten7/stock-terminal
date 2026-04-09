'use client';

const DUMMY = [
  { name: '(주)테크바이오', market: '코스닥', priceRange: '12,000~15,000', listDate: '04/15', sector: '바이오' },
  { name: '그린에너지솔루션', market: '코스피', priceRange: '25,000~30,000', listDate: '04/18', sector: '2차전지' },
  { name: 'AI로보틱스', market: '코스닥', priceRange: '8,000~10,000', listDate: '04/22', sector: 'AI/로봇' },
];

export default function IpoSchedule() {
  return (
    <div className="bg-white p-5 border-[3px] border-[#0ABAB5] h-full">
      <h3 className="text-black font-bold text-base mb-4 flex items-center gap-2">
        <span className="text-[#0ABAB5]">🆕</span> IPO 일정
      </h3>
      <div className="space-y-3">
        {DUMMY.map((ipo, i) => (
          <div key={i} className="py-2 border-b border-[#F0F0F0] last:border-0">
            <div className="flex items-center justify-between">
              <span className="text-black font-bold text-sm">{ipo.name}</span>
              <span className="text-[#0ABAB5] text-xs font-bold">{ipo.market}</span>
            </div>
            <div className="flex gap-3 mt-1 text-xs">
              <span className="text-[#999999]">공모가: <b className="text-black">{ipo.priceRange}원</b></span>
              <span className="text-[#999999]">상장일: <b className="text-black">{ipo.listDate}</b></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
