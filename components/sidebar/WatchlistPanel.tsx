"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

type WatchItem = {
  code: string;
  name: string;
  price: string;
  changePct: number;
};

const DUMMY_WATCHLIST: WatchItem[] = [
  { code: "005930", name: "삼성전자", price: "78,400", changePct: 1.42 },
  { code: "000660", name: "SK하이닉스", price: "234,500", changePct: -0.51 },
  { code: "035720", name: "카카오", price: "47,850", changePct: 3.42 },
  { code: "035420", name: "NAVER", price: "208,000", changePct: 0.97 },
  { code: "207940", name: "삼성바이오로직스", price: "942,000", changePct: -1.20 },
  { code: "AAPL", name: "Apple", price: "$195.34", changePct: 0.82 },
  { code: "TSLA", name: "Tesla", price: "$247.18", changePct: -2.11 },
  { code: "NVDA", name: "NVIDIA", price: "$880.50", changePct: 1.54 },
];

function inferMarket(code: string): "KOSPI" | "KOSDAQ" | "US" {
  if (/^[A-Z]+$/.test(code)) return "US";
  if (code.startsWith("0")) return "KOSPI";
  return "KOSDAQ";
}

export function WatchlistPanel() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <div className="flex flex-col max-h-[35%] border-t border-unjong-border bg-unjong-surface flex-shrink-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2 flex-shrink-0">
        <span className="text-xs font-semibold text-unjong-primary">
          👀 관심종목 {DUMMY_WATCHLIST.length}개
        </span>
        <span className="text-[10px] text-unjong-muted">(더미 · Layer 1 연결)</span>
      </div>

      {/* 리스트 (스크롤) */}
      <ul className="flex-1 overflow-y-auto min-h-0 divide-y divide-unjong-border">
        {DUMMY_WATCHLIST.map((item) => {
          const isUp = item.changePct >= 0;
          return (
            <li
              key={item.code}
              onClick={() =>
                setSelectedSymbol({
                  code: item.code,
                  name: item.name,
                  price: item.price,
                  changePct: item.changePct,
                  market: inferMarket(item.code),
                })
              }
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-unjong-background cursor-pointer transition-colors"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {item.name}
                </span>
                <span className="text-[10px] text-unjong-muted">{item.code}</span>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="font-semibold text-unjong-primary">
                  {item.price}
                </span>
                <span
                  className={`flex items-center gap-0.5 text-[10px] font-medium ${
                    isUp ? "text-unjong-success" : "text-unjong-danger"
                  }`}
                >
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? "+" : ""}
                  {item.changePct.toFixed(2)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
