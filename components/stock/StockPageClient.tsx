"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { isKrxCode } from "@/lib/code";
import { createAnonClient } from "@/lib/supabase/anon-client";
import StockInfoPanel from "./StockInfoPanel";
import BrokerLinks from "./BrokerLinks";
import StockChatPanel from "./StockChatPanel";
import StockTabs from "./StockTabs";

type Props = { code: string };

export default function StockPageClient({ code }: Props) {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const searchParams = useSearchParams();
  const passedName = searchParams.get("name");
  const [stockName, setStockName] = useState<string>(passedName || code);

  // 종목명: 성적표에서 넘긴 이름(?name=) 있으면 즉시 사용(ETF 등 DB 무관 정확).
  // 없을 때만 한국 stocks DB name_ko 조회 / 미국은 ticker 그대로.
  useEffect(() => {
    if (passedName) { setStockName(passedName); return; }
    let cancelled = false;
    const load = async () => {
      if (isKrxCode(code)) {
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
  }, [code, passedName]);

  // 종목 페이지 진입 시 selectedSymbol 동기화 (기존 차트·관심종목 활용)
  useEffect(() => {
    setSelectedSymbol({ code, name: stockName, market: /^[A-Z.\-]+$/.test(code) ? "US" : "KOSPI" });
  }, [code, stockName, setSelectedSymbol]);

  return (
    <div className="grid grid-cols-[320px_1fr_380px] gap-4 px-10 py-4 min-h-screen">
      {/* 좌측: 종목 정보 (sticky) */}
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <StockInfoPanel symbol={code} />
        <BrokerLinks code={code} />
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
