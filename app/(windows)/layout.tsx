import type { ReactNode } from "react";
import Link from "next/link";

export default function WindowsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-unjong-background">
      {/* 상단 헤더 (STEP 90 에서 채움) */}
      <header className="border-b border-unjong-border bg-unjong-surface">
        <div className="flex h-14 items-center px-4 gap-4">
          <div className="text-xl font-bold text-unjong-primary">雲從</div>
          <div className="text-xs text-unjong-muted">UNJONG</div>
          <div className="flex-1 text-center text-xs text-unjong-muted">
            (검색창 자리 · STEP 90)
          </div>
          <div className="text-xs text-unjong-muted">
            (글로벌 티커 · STEP 90)
          </div>
        </div>
        <nav className="flex h-12 items-center gap-2 px-4 border-t border-unjong-border">
          <Link
            href="/scalper"
            className="rounded-md px-4 py-1.5 text-sm font-medium hover:bg-unjong-background"
          >
            단타창
          </Link>
          <Link
            href="/longterm"
            className="rounded-md px-4 py-1.5 text-sm font-medium hover:bg-unjong-background"
          >
            장타창
          </Link>
          <Link
            href="/us"
            className="rounded-md px-4 py-1.5 text-sm font-medium hover:bg-unjong-background"
          >
            미국주식창
          </Link>
        </nav>
      </header>

      {/* 본문 (좌측 + 메인 + 우측) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드 — 채팅 + 관심종목 (STEP 91) */}
        <aside className="w-[300px] flex-shrink-0 border-r border-unjong-border bg-unjong-surface">
          <div className="flex h-full flex-col">
            <div className="border-b border-unjong-border p-3 text-sm font-medium">
              💬 채팅 (STEP 91)
            </div>
            <div className="flex-1 overflow-y-auto p-3 text-xs text-unjong-muted">
              채팅 메시지 자리
              <br />
              (Layer 1 — Supabase Realtime 연결 시 활성)
            </div>
            <div className="border-t border-unjong-border p-3 text-xs text-unjong-muted">
              ✏️ 메시지 입력 자리 (STEP 91)
            </div>
            <div className="border-t border-unjong-border p-3 text-sm font-medium">
              👀 관심종목 (STEP 91)
            </div>
            <div className="max-h-[30%] overflow-y-auto p-3 text-xs text-unjong-muted">
              관심종목 리스트 자리
              <br />
              (기존 Watchlist 컴포넌트 재배치 예정)
            </div>
          </div>
        </aside>

        {/* 메인 영역 — 각 창의 컨텐츠 (STEP 92) */}
        <main className="flex-1 overflow-y-auto p-4">{children}</main>

        {/* 우측 사이드패널 — 종목 클릭 시 (STEP 93) */}
        <aside className="hidden xl:flex w-[360px] flex-shrink-0 border-l border-unjong-border bg-unjong-surface p-3 text-xs text-unjong-muted">
          종목 미선택 상태
          <br />
          (Layer 0 — STEP 93 에서 차트·호가·체결 패널 연결)
        </aside>
      </div>
    </div>
  );
}
