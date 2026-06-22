import { ChatPanel } from "./ChatPanel";
import { WatchlistPanel } from "./WatchlistPanel";

/**
 * 트릴리언 좌측 사이드 (폭 300px)
 * 채팅 65% + 관심종목 35% 고정 비율 — 모든 창 동일
 */
export function UnjongSidebar() {
  return (
    <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface flex flex-col">
      <div className="h-[65%] flex flex-col min-h-0">
        <ChatPanel />
      </div>
      <div className="h-[35%] flex flex-col min-h-0">
        <WatchlistPanel />
      </div>
    </aside>
  );
}
