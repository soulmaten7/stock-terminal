'use client';

import WidgetCard from '@/components/home/WidgetCard';

const DUMMY = [
  { time: '3분 전', source: '한국경제', title: '삼성전자 HBM3E 퀄컴 공급 확정…주가 2% 급등', hot: true },
  { time: '7분 전', source: '매일경제', title: 'FOMC 의사록 "추가 인상 여지 남아"…코스피 하방 압력', hot: false },
  { time: '15분 전', source: '이데일리', title: '셀트리온 신약 FDA 허가…바이오 섹터 전반 상승', hot: true },
  { time: '23분 전', source: '한국경제', title: '2분기 어닝시즌 개막…증권가 순이익 전망 상향', hot: false },
  { time: '31분 전', source: '매일경제', title: '원달러 환율 1380원대 안착…수출주 수혜 기대', hot: false },
];

export default function NewsFeedWidget() {
  return (
    <WidgetCard
      title="뉴스 속보"
      subtitle="Phase B · RSS 3종"
      action={
        <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
          준비 중
        </span>
      }
    >
      <ul aria-label="뉴스 목록" className="divide-y divide-[#F0F0F0]">
        {DUMMY.map((n, i) => (
          <li key={i} className="px-3 py-2 hover:bg-[#F8F9FA]">
            <div className="flex items-center gap-1.5 mb-0.5">
              {n.hot && <span className="text-[9px] font-bold text-white bg-[#FF3B30] px-1 rounded">HOT</span>}
              <span className="text-[10px] text-[#999]">{n.source}</span>
              <span className="text-[10px] text-[#BBBBBB]">{n.time}</span>
            </div>
            <p className="text-xs text-black leading-snug line-clamp-2">{n.title}</p>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
