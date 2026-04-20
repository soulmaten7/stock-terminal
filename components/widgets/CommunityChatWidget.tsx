'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react';

const DUMMY = [
  { nick: '주식고수', time: '15:28', msg: '$005930 오늘 HBM 호재로 강세. 2% 이상 유지 중' },
  { nick: '투자왕',  time: '15:25', msg: '코스피 오후 들어서 회복세. 외인 순매수 전환' },
  { nick: '차트맨',  time: '15:20', msg: '셀트리온 FDA 허가 이후 바이오 섹터 동반 상승' },
];

export default function CommunityChatWidget() {
  const router = useRouter();
  const [minimized, setMinimized] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        left: 72,
        bottom: 12,
        width: 320,
        height: minimized ? 40 : 360,
        zIndex: 40,
        border: '1px solid #E5E7EB',
        borderRadius: 12,
        background: '#fff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        transition: 'height 0.2s ease',
      }}
      role="complementary"
      aria-label="커뮤니티 채팅"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 h-10 bg-[#F5F5F5] border-b border-[#E5E7EB] cursor-pointer select-none shrink-0"
        onDoubleClick={() => setMinimized((v) => !v)}
        title="더블클릭으로 최소화/펼치기"
      >
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-[#0ABAB5]" />
          <span className="text-sm font-bold text-black">커뮤니티 채팅</span>
          <span className="text-[10px] text-[#999]">Supabase Realtime</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/chat')}
            className="text-[#BBBBBB] hover:text-[#0ABAB5] transition-colors"
            aria-label="채팅 상세 페이지"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setMinimized((v) => !v)}
            className="text-[#999] hover:text-black"
            aria-label={minimized ? '펼치기' : '최소화'}
          >
            {minimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="flex flex-col" style={{ height: 320 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {DUMMY.map((m, i) => (
              <div key={i} className="text-xs">
                <span className="font-bold text-[#0ABAB5]">{m.nick}</span>
                <span className="text-[#BBBBBB] ml-1">{m.time}</span>
                <p className="text-[#333] mt-0.5">{m.msg}</p>
              </div>
            ))}
          </div>
          {/* Input */}
          <div className="border-t border-[#F0F0F0] px-3 py-2 shrink-0">
            <input
              type="text"
              placeholder="로그인 후 채팅 참여 (Phase B)"
              disabled
              className="w-full text-xs border border-[#E5E7EB] rounded px-2 py-1.5 bg-[#F8F9FA] text-[#999] cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
