'use client';

// TODO: KRX 프로그램매매 데이터 연동 (한투 API에 직접 엔드포인트 없음)
export default function ProgramTrading() {
  const arb = 215;
  const nonArb = -108;
  const total = arb + nonArb;

  const Bar = ({ label, value }: { label: string; value: number }) => {
    const maxW = 100;
    const w = Math.min(Math.abs(value) / 5, maxW);
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-[#CCCCCC] text-sm font-bold w-20 shrink-0">{label}</span>
        <div className="flex-1 mx-3 h-5 bg-[#161B22] relative">
          <div className={`h-full ${value >= 0 ? 'bg-[#FF4D4D]' : 'bg-[#2196F3]'}`} style={{ width: `${w}%` }} />
        </div>
        <span className={`font-mono-price font-bold text-sm w-20 text-right ${value >= 0 ? 'text-[#FF4D4D]' : 'text-[#2196F3]'}`}>
          {value >= 0 ? '+' : ''}{value}억
        </span>
      </div>
    );
  };

  return (
    <div className="bg-[#0D1117] p-4 border border-[#2D3748] h-full">
      <h3 className="text-white font-bold text-sm mb-3">프로그램 매매</h3>
      <Bar label="차익거래" value={arb} />
      <Bar label="비차익거래" value={nonArb} />
      <div className="border-t border-[#2D3748] mt-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-white font-bold text-sm">합계</span>
          <span className={`font-mono-price font-bold text-base ${total >= 0 ? 'text-[#FF4D4D]' : 'text-[#2196F3]'}`}>
            {total >= 0 ? '+' : ''}{total}억
          </span>
        </div>
      </div>
    </div>
  );
}
