import { TrendingUp, TrendingDown, Newspaper, Clock } from "lucide-react";
import { CardContainer } from "./CardContainer";

const GLOBAL_INDICES = [
  { name: "S&P 500",      value: "5,234.12",  changePct:  0.87, isUp: true  },
  { name: "Nasdaq",       value: "16,891.50", changePct:  1.12, isUp: true  },
  { name: "Dow",          value: "39,127.14", changePct:  0.45, isUp: true  },
  { name: "Russell 2000", value: "2,108.55",  changePct: -0.23, isUp: false },
  { name: "VIX",          value: "18.42",     changePct: -2.14, isUp: false },
];

const US_MOVERS = [
  { code: "NVDA", name: "NVIDIA",    price: "$880.50", changePct: 5.4 },
  { code: "TSLA", name: "Tesla",     price: "$247.18", changePct: 4.2 },
  { code: "AAPL", name: "Apple",     price: "$195.34", changePct: 2.1 },
  { code: "META", name: "Meta",      price: "$528.40", changePct: 1.8 },
  { code: "MSFT", name: "Microsoft", price: "$432.10", changePct: 1.5 },
];

const US_NEWS = [
  { title: "Fed signals dovish pivot — rate cut probability rises",    source: "Bloomberg", time: "1h ago"  },
  { title: "NVIDIA beats Q2 earnings, raises full-year guidance",       source: "CNBC",      time: "3h ago"  },
  { title: "Tesla announces new Gigafactory in India",                  source: "Reuters",   time: "5h ago"  },
  { title: "Apple Vision Pro 2 launch confirmed for Q4 2026",           source: "WSJ",       time: "8h ago"  },
  { title: "Inflation data comes in below expectations",                source: "Bloomberg", time: "12h ago" },
];

const PRE_AFTER_MARKET = [
  { code: "NVDA", name: "NVIDIA",    price: "$892.40", changePct:  1.35, session: "Pre" as const  },
  { code: "TSLA", name: "Tesla",     price: "$241.80", changePct: -2.17, session: "Pre" as const  },
  { code: "AAPL", name: "Apple",     price: "$197.10", changePct:  0.90, session: "After" as const },
  { code: "AMZN", name: "Amazon",    price: "$182.50", changePct:  1.62, session: "After" as const },
  { code: "GOOG", name: "Alphabet",  price: "$175.80", changePct: -0.45, session: "Pre" as const  },
];

const MAGNIFICENT_7 = [
  { code: "AAPL", name: "Apple",     price: "$195.34", changePct:  2.1,  mktCap: "$3.0T" },
  { code: "MSFT", name: "Microsoft", price: "$432.10", changePct:  1.5,  mktCap: "$3.2T" },
  { code: "NVDA", name: "NVIDIA",    price: "$880.50", changePct:  5.4,  mktCap: "$2.2T" },
  { code: "GOOG", name: "Alphabet",  price: "$175.80", changePct: -0.4,  mktCap: "$2.1T" },
  { code: "AMZN", name: "Amazon",    price: "$182.50", changePct:  1.6,  mktCap: "$1.9T" },
  { code: "META", name: "Meta",      price: "$528.40", changePct:  1.8,  mktCap: "$1.4T" },
  { code: "TSLA", name: "Tesla",     price: "$247.18", changePct:  4.2,  mktCap: "$0.8T" },
];

const FOMC_EVENTS = [
  { date: "2026-07-29", event: "FOMC 회의",         type: "FOMC" as const,  expected: "동결 (98%)" },
  { date: "2026-08-12", event: "CPI (7월)",          type: "CPI" as const,   expected: "2.8% 예상"  },
  { date: "2026-09-04", event: "NFP (8월)",          type: "NFP" as const,   expected: "180K 예상"  },
  { date: "2026-09-16", event: "FOMC 회의 + 점도표", type: "FOMC" as const,  expected: "-25bp 예상" },
];

const EVENT_TYPE_STYLE: Record<"FOMC" | "CPI" | "NFP", string> = {
  FOMC: "bg-blue-100 text-blue-700",
  CPI:  "bg-amber-100 text-amber-700",
  NFP:  "bg-emerald-100 text-emerald-700",
};

export function GlobalIndicesCard() {
  return (
    <CardContainer
      id="card-indices"
      detailHref="/us/indices"
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

export function PreAfterMarketCard() {
  return (
    <CardContainer
      id="card-prepost"
      detailHref="/us/prepost"
      title="Pre / After-hours"
      emoji="🌅"
      subtitle="시간외 변동 TOP"
      hint="Layer 1 — Yahoo Finance Extended Hours API"
    >
      <ul className="space-y-2">
        {PRE_AFTER_MARKET.map((m) => {
          const isUp = m.changePct >= 0;
          return (
            <li
              key={m.code}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                  m.session === "Pre" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {m.session}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary">{m.code}</span>
                  <span className="text-[10px] text-unjong-muted truncate">{m.name}</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary tabular-nums">{m.price}</span>
                <span className={`text-[10px] font-semibold ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                  {isUp ? "+" : ""}{m.changePct.toFixed(2)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

export function Magnificent7Card() {
  return (
    <CardContainer
      id="card-m7"
      detailHref="/us/m7"
      title="Magnificent 7"
      emoji="⭐"
      subtitle="미국 7대 대장주"
      hint="Layer 1 — Yahoo Finance 실시간"
    >
      <ul className="space-y-1.5">
        {MAGNIFICENT_7.map((m) => {
          const isUp = m.changePct >= 0;
          return (
            <li
              key={m.code}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary">{m.code}</span>
                  <span className="text-[10px] text-unjong-muted">{m.mktCap}</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary tabular-nums">{m.price}</span>
                <span className={`text-[10px] font-semibold ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                  {isUp ? "+" : ""}{m.changePct.toFixed(1)}%
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

export function UsMoversCard() {
  return (
    <CardContainer
      id="card-movers"
      detailHref="/us/movers"
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

export function ForexClockCard() {
  return (
    <CardContainer
      id="card-forex"
      detailHref="/us/forex"
      title="USD/KRW + 미국 시계"
      emoji="💱"
      subtitle="환율 · 시장 상태"
      hint="Layer 1 — Yahoo Finance FX + 시장 세션 판별"
    >
      <div className="space-y-3">
        {/* 환율 */}
        <div className="flex items-center justify-between rounded bg-unjong-background px-3 py-2.5">
          <div className="flex flex-col">
            <span className="text-[10px] text-unjong-muted">USD/KRW</span>
            <span className="text-lg font-bold text-unjong-primary tabular-nums">1,384.50</span>
          </div>
          <span className="text-xs font-semibold text-unjong-danger">+2.30 (+0.17%)</span>
        </div>

        {/* 미국 시장 세션 */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
          {[
            { label: "Pre-market",  time: "04:00–09:30", status: "closed" as const },
            { label: "정규장",        time: "09:30–16:00", status: "open" as const   },
            { label: "After-hours", time: "16:00–20:00", status: "closed" as const },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded px-1 py-1.5 ${
                s.status === "open"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              <div className="font-semibold">{s.label}</div>
              <div className="font-mono text-[9px] mt-0.5">{s.time}</div>
              <div className={`font-bold mt-0.5 ${s.status === "open" ? "text-emerald-600" : "text-slate-400"}`}>
                {s.status === "open" ? "OPEN" : "CLOSED"}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-unjong-muted px-1">
          <Clock size={10} />
          <span>ET 기준 · Layer 1 실시간 갱신</span>
        </div>
      </div>
    </CardContainer>
  );
}

export function UsNewsCard() {
  return (
    <CardContainer
      id="card-news"
      detailHref="/us/news"
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

export function FOMCCalendarCard() {
  return (
    <CardContainer
      id="card-fomc"
      detailHref="/us/fomc"
      title="FOMC·CPI·NFP 캘린더"
      emoji="📅"
      subtitle="미국 거시 이벤트"
      hint="Layer 1 — 자체 이벤트 캘린더 + Investing.com"
    >
      <ul className="space-y-2">
        {FOMC_EVENTS.map((e, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${EVENT_TYPE_STYLE[e.type]}`}>
                {e.type}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">{e.event}</span>
                <span className="text-[10px] text-unjong-muted">{e.date}</span>
              </div>
            </div>
            <span className="text-[10px] text-unjong-muted flex-shrink-0">{e.expected}</span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}
