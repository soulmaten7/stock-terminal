import { Bell, User } from "lucide-react";
import { UnjongLogo } from "./UnjongLogo";
import { UnjongSearch } from "./UnjongSearch";
import { GlobalTickerBar } from "./GlobalTickerBar";
import { WindowSwitcher } from "./WindowSwitcher";

export function UnjongHeader() {
  return (
    <header className="border-b border-unjong-border bg-unjong-surface sticky top-0 z-50">
      {/* 상단 영역 */}
      <div className="flex h-14 items-center gap-4 px-4">
        <UnjongLogo />
        <div className="h-6 w-px bg-unjong-border" />
        <UnjongSearch />
        <div className="hidden md:block flex-shrink-0">
          <GlobalTickerBar />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="rounded-full p-1.5 text-unjong-muted hover:bg-unjong-background hover:text-unjong-primary transition-colors"
            aria-label="알림"
            title="알림 (Layer 1)"
          >
            <Bell size={18} />
          </button>
          <button
            type="button"
            className="rounded-full p-1.5 text-unjong-muted hover:bg-unjong-background hover:text-unjong-primary transition-colors"
            aria-label="프로필"
            title="프로필 (Layer 1)"
          >
            <User size={18} />
          </button>
        </div>
      </div>

      {/* 하단 — 3창 카드 박스 */}
      <div className="flex items-center px-4 py-2 border-t border-unjong-border bg-unjong-background">
        <WindowSwitcher />
      </div>
    </header>
  );
}
