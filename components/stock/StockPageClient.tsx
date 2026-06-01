"use client";

import { useEffect, useState } from "react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { createAnonClient } from "@/lib/supabase/anon-client";
import StockInfoPanel from "./StockInfoPanel";
import StockChatPanel from "./StockChatPanel";
import StockTabs from "./StockTabs";

type Props = { code: string };

export default function StockPageClient({ code }: Props) {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [stockName, setStockName] = useState<string>(code);

  // 종목명 조회 (한국: stocks DB name_ko · 미국: ticker 그대로)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (/^\d{6}$/.test(code)) {
        const supabase = createAnonClient();
        const { data } = await supabase
          .from("stocks")
          .select("name_ko")
          .eq("symbol", code)
          .maybeSingle();
        if (!cancelled && data?.name_ko) setStockName(data.name_ko);
      } else {
        if (!cancelled) setStockName(code);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [code]);

  // 종목 페이지 진입 시 selectedSymbol 동기화 (기존 차트·관심종목 활용)
  useEffect(() => {
    setSelectedSymbol({ code, name: stockName, market: /^[A-Z.\-]+$/.test(code) ? "US" : "KOSPI" });
  }, [code, stockName, setSelectedSymbol]);

  return (
    <div className="grid grid-cols-[320px_1fr_380px] gap-4 px-10 py-4 min-h-screen">
      {/* 좌측: 종목 정보 (sticky) */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <StockInfoPanel symbol={code} />
      </aside>

      {/* 가운데: 탭 시스템 (차트·시세 / 토론 / 뉴스 / 인사이트) */}
      <main>
        <StockTabs symbol={code} stockName={stockName} />
      </main>

      {/* 우측: 실시간 채팅 (sticky) */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)]">
        <StockChatPanel symbol={code} stockName={stockName} />
      </aside>
    </div>
  );
}
