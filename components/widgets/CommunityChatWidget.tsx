'use client';

import WidgetCard from '@/components/home/WidgetCard';

const DUMMY = [
  { nick: '주식고수', time: '15:28', msg: '$005930 오늘 HBM 호재로 강세. 2% 이상 유지 중' },
  { nick: '투자왕', time: '15:25', msg: '코스피 오후 들어서 회복세. 외인 순매수 전환' },
  { nick: '차트맨', time: '15:20', msg: '셀트리온 FDA 허가 이후 바이오 섹터 동반 상승' },
];

export default function CommunityChatWidget() {
  return (
    <div
      className="fixed bottom-0 left-12 w-[320px] h-[360px] z-40 shadow-2xl border border-[#E5E7EB]"
      role="complementary"
      aria-label="커뮤니티 채팅"
    >
      <WidgetCard
        title="커뮤니티 채팅"
        subtitle="Supabase Realtime"
        className="h-full rounded-t-xl rounded-b-none border-0"
        action={
          <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
            준비 중
          </span>
        }
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {DUMMY.map((m, i) => (
              <div key={i} className="text-xs">
                <span className="font-bold text-[#0ABAB5]">{m.nick}</span>
                <span className="text-[#BBBBBB] ml-1">{m.time}</span>
                <p className="text-[#333] mt-0.5">{m.msg}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#F0F0F0] px-3 py-2">
            <input
              type="text"
              placeholder="메시지 입력... (Phase B)"
              disabled
              className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1.5 bg-[#F8F9FA] text-[#999] cursor-not-allowed"
            />
          </div>
        </div>
      </WidgetCard>
    </div>
  );
}
