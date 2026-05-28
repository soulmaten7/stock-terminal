import { TrendingUp, TrendingDown, Newspaper } from "lucide-react";
import { CardContainer } from "./CardContainer";

const GLOBAL_INDICES = [
  { name: "S&P 500", value: "5,234.12", changePct: 0.87, isUp: true },
  { name: "Nasdaq", value: "16,891.50", changePct: 1.12, isUp: true },
  { name: "Dow", value: "39,127.14", changePct: 0.45, isUp: true },
  { name: "Russell 2000", value: "2,108.55", changePct: -0.23, isUp: false },
  { name: "VIX", value: "18.42", changePct: -2.14, isUp: false },
];

const US_MOVERS = [
  { code: "NVDA", name: "NVIDIA", price: "$880.50", changePct: 5.4 },
  { code: "TSLA", name: "Tesla", price: "$247.18", changePct: 4.2 },
  { code: "AAPL", name: "Apple", price: "$195.34", changePct: 2.1 },
  { code: "META", name: "Meta", price: "$528.40", changePct: 1.8 },
  { code: "MSFT", name: "Microsoft", price: "$432.10", changePct: 1.5 },
];

const US_NEWS = [
  { title: "Fed signals dovish pivot — rate cut probability rises", source: "Bloomberg", time: "1h ago" },
  { title: "NVIDIA beats Q2 earnings, raises full-year guidance", source: "CNBC", time: "3h ago" },
  { title: "Tesla announces new Gigafactory in India", source: "Reuters", time: "5h ago" },
  { title: "Apple Vision Pro 2 launch confirmed for Q4 2026", source: "WSJ", time: "8h ago" },
  { title: "Inflation data comes in below expectations", source: "Bloomberg", time: "12h ago" },
];

export function GlobalIndicesCard() {
  return (
    <CardContainer
      id="card-indices"
      title="글로벌 지수"
      emoji="🌐"
      subtitle="S&P/Nasdaq/Dow/VIX"
      hint="Layer 1 — Yahoo Finance 실시간 + VIX 추가"
    >
      <ul className="space-y-2">
        {GLOBAL_INDICES.map((idx) => (
          <li
            key={idx.name}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <span className="font-medium text-unjong-primary">{idx.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-unjong-primary tabular-nums">
                {idx.value}
              </span>
              <span
                className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                  idx.isUp ? "text-unjong-success" : "text-unjong-danger"
                }`}
              >
                {idx.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {idx.isUp ? "+" : ""}
                {idx.changePct.toFixed(2)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function UsMoversCard() {
  return (
    <CardContainer
      id="card-movers"
      title="미국 Movers"
      emoji="🇺🇸"
      subtitle="정규장 TOP"
      hint="Layer 1 — Yahoo Finance Movers API"
    >
      <ul className="space-y-2">
        {US_MOVERS.map((m, i) => (
          <li
            key={m.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-unjong-muted font-mono w-4 text-right">
                {i + 1}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary">{m.code}</span>
                <span className="text-[10px] text-unjong-muted truncate">
                  {m.name}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="font-semibold text-unjong-primary tabular-nums">
                {m.price}
              </span>
              <span className="text-[10px] text-unjong-success font-semibold">
                +{m.changePct.toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function UsNewsCard() {
  return (
    <CardContainer
      id="card-news"
      title="미국 뉴스"
      emoji="📰"
      subtitle="Bloomberg/CNBC/WSJ"
      hint="Layer 1 — RSS 통합 + 8-K (SEC EDGAR) 추가"
    >
      <ul className="space-y-3">
        {US_NEWS.map((n, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <Newspaper size={12} className="text-unjong-muted flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0 gap-0.5">
              <span className="font-medium text-unjong-primary leading-snug">
                {n.title}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-unjong-muted">
                <span className="font-semibold">{n.source}</span>
                <span>·</span>
                <span>{n.time}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}
