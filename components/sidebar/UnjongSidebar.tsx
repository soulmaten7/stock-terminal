import { ChatPanel } from "./ChatPanel";
import { WatchlistPanel } from "./WatchlistPanel";

export function UnjongSidebar() {
  return (
    <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
      <div className="flex h-full flex-col">
        <ChatPanel />
        <WatchlistPanel />
      </div>
    </aside>
  );
}
