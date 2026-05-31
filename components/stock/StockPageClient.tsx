"use client";

import { useEffect } from "react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import StockInfoPanel from "./StockInfoPanel";
import DiscussionBoard from "./DiscussionBoard";
import StockChatPanel from "./StockChatPanel";

type Props = { code: string };

export default function StockPageClient({ code }: Props) {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  // 종목 페이지 진입 시 selectedSymbol 동기화 (기존 차트·관심종목 활용)
  useEffect(() => {
    setSelectedSymbol({ code, name: code, market: /^[A-Z.\-]+$/.test(code) ? "US" : "KOSPI" });
  }, [code, setSelectedSymbol]);

  return (
    <div className="grid grid-cols-[320px_1fr_380px] gap-4 px-10 py-4 min-h-screen">
      {/* 좌측: 종목 정보 (sticky) */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <StockInfoPanel symbol={code} />
      </aside>

      {/* 가운데: 토론 게시판 */}
      <main>
        <DiscussionBoard symbol={code} />
      </main>

      {/* 우측: 실시간 채팅 (sticky) */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)]">
        <StockChatPanel symbol={code} />
      </aside>
    </div>
  );
}
