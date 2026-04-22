'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

export interface Participant {
  user_id: string;
  nickname: string;
  online_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  participants: Participant[];
}

export default function ChatParticipantsModal({ open, onClose, participants }: Props) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const uniqueParticipants = Array.from(new Map(participants.map((p) => [p.user_id, p])).values());

  return (
    <div
      className="absolute inset-0 z-20 bg-white flex flex-col overflow-hidden rounded-lg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-participants-title"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0F0] shrink-0">
        <div>
          <h3 id="chat-participants-title" className="text-lg font-bold text-black">
            채팅 참여자
          </h3>
          <p className="text-xs text-[#999999]">
            총 {uniqueParticipants.length}명 접속 중
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#BBBBBB] hover:text-black transition-colors p-1"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 참여자 목록 */}
      <div className="flex-1 overflow-y-auto">
        {uniqueParticipants.length === 0 ? (
          <div className="text-center text-sm text-[#999] py-8 px-4">
            현재 접속 중인 참여자가 없습니다.
            <br />
            <span className="text-xs text-[#BBBBBB]">
              로그인 후 채팅에 참여해보세요.
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-[#F0F0F0]">
            {uniqueParticipants.map((p) => {
              const time = (() => {
                try {
                  const d = new Date(p.online_at);
                  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                } catch {
                  return '';
                }
              })();
              return (
                <li
                  key={p.user_id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0ABAB5]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#0ABAB5]">
                      {p.nickname.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{p.nickname}</p>
                    <p className="text-[10px] text-[#999]">{time} 접속</p>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full bg-green-500 shrink-0"
                    title="온라인"
                    aria-label="온라인"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
