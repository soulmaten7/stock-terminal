"use client";

import { ChatPanel } from "@/components/sidebar/ChatPanel";
import { WatchlistPanel } from "@/components/sidebar/WatchlistPanel";
import {
  MoversCard,
  VolumeCard,
  NetBuyBrokerCard,
  ScalperDisclosureCard,
} from "@/components/cards/ScalperCards";
import HotDiscussionsModule from "./HotDiscussionsModule";
import HotChatRoomsModule from "./HotChatRoomsModule";

export default function HomeClientV5() {
  return (
    <div className="grid grid-cols-[320px_1fr_320px] gap-4 px-10 py-4 min-h-[calc(100vh-200px)]">
      {/* 좌측: 시장 동선 시작 — 채팅 + 활발한 채팅방 */}
      <aside className="space-y-4 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="h-[400px] flex flex-col">
          <ChatPanel />
        </div>
        <HotChatRoomsModule />
      </aside>

      {/* 가운데: 시장 핫 이슈 (카드 4종) + HOT 토론 */}
      <main className="space-y-4">
        <section>
          <h2 className="text-base font-semibold text-unjong-primary mb-3">🔥 시장 핫 이슈</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MoversCard />
            <VolumeCard />
            <NetBuyBrokerCard />
            <ScalperDisclosureCard />
          </div>
        </section>

        <HotDiscussionsModule />
      </main>

      {/* 우측: 관심 종목 (70%+ 클릭 영역) */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)]">
        <WatchlistPanel />
      </aside>
    </div>
  );
}
