"use client";

import Link from "next/link";
import { StockLogo } from "@/components/ui/StockLogo";
import type { HoverStock } from "@/components/market/MarketClient";

export default function HomeStockDetail({ stock }: { stock: HoverStock | null }) {
  return (
    <aside className="hidden xl:block w-80 shrink-0">
      <div className="sticky top-5 rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft overflow-hidden">
        {!stock ? (
          <div className="p-5 text-sm text-unjong-muted">
            종목에 마우스를 올리면 상세가 여기에 표시됩니다.
          </div>
        ) : (
          <>
            {/* 헤더 (실데이터) */}
            <div className="flex items-center gap-2.5 border-b border-unjong-border p-4">
              <StockLogo code={stock.symbol} name={stock.name} size={36} />
              <div className="min-w-0">
                <p className="font-bold text-unjong-primary truncate">{stock.name}</p>
                <p className={`text-sm font-semibold tabular-nums ${stock.changePercent >= 0 ? "text-[#1AC267]" : "text-[#F04452]"}`}>
                  {stock.priceText}
                  <span className="ml-1 text-xs">
                    ({stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%)
                  </span>
                </p>
              </div>
            </div>

            {/* 차트 (추후 연동) */}
            <div className="border-b border-unjong-border p-4">
              <p className="mb-2 text-xs font-semibold text-unjong-muted">차트</p>
              <div className="flex h-28 items-center justify-center rounded-lg bg-unjong-background text-xs text-unjong-muted">
                차트 — 추후 연동
              </div>
            </div>

            {/* 운종 확장영역 (추후: 증권사 상품·단톡방 링크 등) */}
            <div className="space-y-3 p-4">
              <div>
                <p className="mb-1 text-xs font-semibold text-unjong-muted">증권사별 투자상품</p>
                <p className="text-xs text-unjong-muted">운종 데이터 — 추후 연동</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-unjong-muted">단톡방 · 커뮤니티</p>
                <Link href={`/stock/${stock.symbol}`} className="text-xs text-unjong-accent hover:underline">
                  종목 토론 보기 →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
