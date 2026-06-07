"use client";

import { useState } from "react";
import { LineChart, MessageSquare, Newspaper, FileText, BarChart3 } from "lucide-react";
import StockChartSection from "./StockChartSection";
import StockOrderbookCard from "./StockOrderbookCard";
import StockExecutionCard from "./StockExecutionCard";
import DiscussionBoard from "./DiscussionBoard";
import StockNewsModule from "./StockNewsModule";
import StockDisclosuresTab from "./StockDisclosuresTab";
import StockInsightsTab from "./StockInsightsTab";

type Tab = "chart" | "discussion" | "news" | "disclosure" | "insights";

const TABS: Array<{ id: Tab; label: string; icon: typeof LineChart }> = [
  { id: "chart", label: "차트·시세", icon: LineChart },
  { id: "discussion", label: "토론", icon: MessageSquare },
  { id: "news", label: "뉴스", icon: Newspaper },
  { id: "disclosure", label: "공시", icon: FileText },
  { id: "insights", label: "인사이트", icon: BarChart3 },
];

type Props = { symbol: string; stockName: string };

export default function StockTabs({ symbol, stockName }: Props) {
  const [active, setActive] = useState<Tab>("chart");

  return (
    <div>
      {/* 탭 헤더 */}
      <nav className="flex border-b border-unjong-border bg-unjong-surface rounded-t-2xl px-2" aria-label="종목 상세 탭">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                active === t.id
                  ? "border-unjong-accent text-unjong-primary"
                  : "border-transparent text-unjong-muted hover:text-unjong-primary"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* 탭 콘텐츠 */}
      <div className="bg-unjong-surface rounded-b-2xl shadow-soft p-5 min-h-[400px]">
        {active === "chart" && (
          <div className="space-y-5">
            <StockChartSection symbol={symbol} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <StockOrderbookCard symbol={symbol} />
              <StockExecutionCard symbol={symbol} />
            </div>
          </div>
        )}
        {active === "discussion" && <DiscussionBoard symbol={symbol} stockName={stockName} />}
        {active === "news" && <StockNewsModule symbol={symbol} />}
        {active === "disclosure" && <StockDisclosuresTab symbol={symbol} />}
        {active === "insights" && <StockInsightsTab symbol={symbol} />}
      </div>
    </div>
  );
}
