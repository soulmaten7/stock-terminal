'use client';

import WidgetCard from '@/components/home/WidgetCard';

const DUMMY = [
  { time: '15:22', corp: '삼성전자', title: '자기주식 취득 결정', type: '주요사항' },
  { time: '14:58', corp: 'LG화학', title: '분기보고서 (2026.Q1)', type: '정기공시' },
  { time: '14:31', corp: '셀트리온', title: '임상3상 결과 공시', type: '주요사항' },
  { time: '13:47', corp: '현대차', title: '최대주주 지분 변경', type: '지분공시' },
  { time: '12:05', corp: 'POSCO홀딩스', title: '유상증자 결정', type: '주요사항' },
];

const TYPE_COLOR: Record<string, string> = {
  '주요사항': 'text-[#FF9500] bg-[#FF9500]/10',
  '정기공시': 'text-[#0ABAB5] bg-[#0ABAB5]/10',
  '지분공시': 'text-[#9B59B6] bg-[#9B59B6]/10',
};

export default function DartFilingsWidget() {
  return (
    <WidgetCard
      title="DART 공시 피드"
      subtitle="Phase B · DART OpenAPI"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <ul aria-label="DART 공시 목록" className="divide-y divide-[#F0F0F0]">
        {DUMMY.map((d, i) => (
          <li key={i} className="flex items-start gap-2 px-3 py-2 hover:bg-[#F8F9FA]">
            <span className="text-[10px] text-[#999] mt-0.5 shrink-0">{d.time}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-black truncate">{d.corp}</p>
              <p className="text-xs text-[#555] truncate">{d.title}</p>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLOR[d.type] ?? 'text-[#999] bg-[#F0F0F0]'}`}>
              {d.type}
            </span>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
