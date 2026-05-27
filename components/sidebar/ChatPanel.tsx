"use client";

import { usePathname } from "next/navigation";
import { Send } from "lucide-react";

type ChatMessage = {
  id: string;
  user: string;
  message: string;
  time: string;
};

const DUMMY_MESSAGES: Record<
  string,
  { window: string; emoji: string; messages: ChatMessage[] }
> = {
  "/scalper": {
    window: "단타창",
    emoji: "⚡",
    messages: [
      { id: "s1", user: "트레이더A", message: "005930 분봉 깨졌어", time: "10:32" },
      { id: "s2", user: "트레이더B", message: "손절 칠게", time: "10:32" },
      { id: "s3", user: "트레이더C", message: "외인 들어옴 지금 잡으면 좋을듯", time: "10:33" },
      { id: "s4", user: "트레이더D", message: "ㅋㅋ 늦었어 이미 5% 떴음", time: "10:34" },
      { id: "s5", user: "트레이더E", message: "VI 걸렸다 카오스", time: "10:35" },
      { id: "s6", user: "트레이더F", message: "거래원 보니까 키움 매집 중", time: "10:36" },
      { id: "s7", user: "트레이더G", message: "공매도 잔고 줄어드는데 숏커버?", time: "10:37" },
      { id: "s8", user: "트레이더A", message: "오늘 거래량 미쳤네", time: "10:38" },
    ],
  },
  "/longterm": {
    window: "장타창",
    emoji: "🌳",
    messages: [
      { id: "l1", user: "장투러A", message: "이번 분기 영업이익 컨센 상회", time: "20:11" },
      { id: "l2", user: "장투러B", message: "PER 8 이면 진짜 싸지 않나", time: "20:13" },
      { id: "l3", user: "장투러C", message: "배당 컷 없으면 더 살게", time: "20:15" },
      { id: "l4", user: "장투러D", message: "기관이 분기 보유 늘렸어", time: "20:18" },
      { id: "l5", user: "장투러A", message: "52주 신저가 우량주 줍줍 타이밍", time: "20:20" },
      { id: "l6", user: "장투러E", message: "ROE 15 넘는 종목 추천 좀", time: "20:22" },
    ],
  },
  "/us": {
    window: "미국주식창",
    emoji: "🌙",
    messages: [
      { id: "u1", user: "미장러A", message: "TSLA 갭상승 3%", time: "22:45" },
      { id: "u2", user: "미장러B", message: "NVDA 실적 발표 후 AH 변동성", time: "22:48" },
      { id: "u3", user: "미장러C", message: "환율 1387 위로 빠질듯", time: "22:50" },
      { id: "u4", user: "미장러D", message: "VIX 22 넘으면 분위기 흔들림", time: "22:52" },
      { id: "u5", user: "미장러A", message: "FOMC 매파적이었네", time: "22:55" },
      { id: "u6", user: "미장러E", message: "M7 다 빨강", time: "22:58" },
    ],
  },
};

export function ChatPanel() {
  const pathname = usePathname();
  const ctx =
    (pathname && DUMMY_MESSAGES[pathname]) || DUMMY_MESSAGES["/scalper"];

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-unjong-surface">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span aria-hidden>{ctx.emoji}</span>
          <span className="text-sm font-semibold text-unjong-primary">
            {ctx.window} 채팅
          </span>
        </div>
        <span className="text-[10px] text-unjong-muted">
          (Layer 1 실시간 연결)
        </span>
      </div>

      {/* 메시지 영역 (스크롤) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {ctx.messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-unjong-primary">
                {msg.user}
              </span>
              <span className="text-[10px] text-unjong-muted">{msg.time}</span>
            </div>
            <p className="text-xs text-unjong-primary leading-snug pl-1">
              {msg.message}
            </p>
          </div>
        ))}
        <div className="pt-2 text-[10px] text-center text-unjong-muted italic">
          — 더미 데이터 · Layer 1 에서 실시간 채팅 활성 —
        </div>
      </div>

      {/* 입력창 (고정 크기, Layer 1 전까지 disabled) */}
      <div className="border-t border-unjong-border bg-unjong-background p-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 rounded-md border border-unjong-border bg-unjong-surface px-2 py-1.5">
          <input
            type="text"
            placeholder={`${ctx.window}에 메시지...`}
            className="flex-1 bg-transparent text-xs text-unjong-primary placeholder:text-unjong-muted focus:outline-none"
            disabled
            aria-label="채팅 입력 (Layer 1 에서 활성)"
          />
          <button
            type="button"
            disabled
            className="text-unjong-muted hover:text-unjong-accent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="전송"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
