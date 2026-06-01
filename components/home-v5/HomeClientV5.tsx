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
import MarketNewsModule from "./MarketNewsModule";
import HotProductReviewsModule from "./HotProductReviewsModule";
import HotRoomReviewsModule from "./HotRoomReviewsModule";

export default function HomeClientV5() {
  return (
    <div className="grid grid-cols-[320px_1fr_320px] gap-5 px-10 py-5 min-h-[calc(100vh-200px)]">
      {/* 좌측: 채팅 + 활발한 채팅방 */}
      <aside className="space-y-5 sticky top-5 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div className="h-[400px] flex flex-col">
          <ChatPanel />
        </div>
        <HotChatRoomsModule />
      </aside>

      {/* 가운데: 손성기 모듈 순서 */}
      <main className="space-y-5">
        {/* 1. 시장 핫 이슈 */}
        <section>
          <h2 className="text-lg font-bold text-unjong-primary mb-3">🔥 시장 핫 이슈</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MoversCard />
            <VolumeCard />
            <NetBuyBrokerCard />
            <ScalperDisclosureCard />
          </div>
        </section>

        {/* 2. HOT 토론 — 운종 본질 */}
        <HotDiscussionsModule />

        {/* 3. MVP 2.0 — HOT 평가 (운종 차별화) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <HotProductReviewsModule />
          <HotRoomReviewsModule />
        </div>

        {/* 4. 시장 헤드라인 */}
        <MarketNewsModule />
      </main>

      {/* 우측: 관심 종목 — 강조 (70%+ 클릭 영역) */}
      <aside className="sticky top-5 self-start max-h-[calc(100vh-2rem)]">
        <WatchlistPanel />
      </aside>
    </div>
  );
}
