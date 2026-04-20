'use client';

import { MessageCircle } from 'lucide-react';
import WidgetCard from '@/components/home/WidgetCard';

const DUMMY = [
  { nick: '주식고수', time: '15:28', msg: '$005930 오늘 HBM 호재로 강세. 2% 이상 유지 중' },
  { nick: '투자왕',  time: '15:25', msg: '코스피 오후 회복세. 외인 순매수 전환' },
  { nick: '차트맨',  time: '15:20', msg: '셀트리온 FDA 허가 이후 바이오 섹터 동반 상승' },
  { nick: '배당러버', time: '15:16', msg: '$KB금융 4분기 배당 확대 기대. 꾸준히 매집 중' },
  { nick: '스윙왕',  time: '15:11', msg: '반도체 섹터 외인 순매수 3일 연속 이어지는 중' },
  { nick: '퀀트맨',  time: '15:07', msg: '코스닥 기술적 지지선 820. 이탈 시 관망 권장' },
];

export default function RealtimeChatWidget() {
  return (
    <WidgetCard
      title="실시간 채팅"
      subtitle="Supabase Realtime"
      href="/chat"
      className="h-full"
      action={
        <div className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3 text-[#0ABAB5]" />
          <span className="text-[10px] text-[#0ABAB5] font-bold">Phase B</span>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0">
          {DUMMY.map((m, i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-bold text-[#0ABAB5]">{m.nick}</span>
                <span className="text-xs text-[#BBBBBB]">{m.time}</span>
              </div>
              <p className="text-sm text-[#333] leading-snug">{m.msg}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[#F0F0F0] px-3 py-2 shrink-0">
          <input
            type="text"
            placeholder="로그인 후 채팅 참여 (Phase B)"
            disabled
            className="w-full text-sm border border-[#E5E7EB] rounded px-2.5 py-2 bg-[#F8F9FA] text-[#999] cursor-not-allowed"
          />
        </div>
      </div>
    </WidgetCard>
  );
}
