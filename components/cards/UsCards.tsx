"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Newspaper, Clock } from "lucide-react";
import { CardContainer } from "./CardContainer";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type IndexItem = { name: string; value: string; changePct: number; isUp: boolean };
type PrePostItem = { code: string; name: string; session: "Pre" | "AH"; price: string; changePct: number; volume: string };
type M7Item = { code: string; name: string; price: string; changePct: number; marketCap: string };
type MoverItem = { code: string; name: string; price: string; changePct: number };
type NewsItem = { title: string; source: string; time: string; url?: string };
type EconItem = { date: string; event: string; importance: "high" | "medium" | "low"; daysLeft: number };

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const INDICES_FALLBACK: IndexItem[] = [
  { name: "S&P 500",      value: "5,234.12",  changePct:  0.87, isUp: true  },
  { name: "Nasdaq",       value: "16,891.50", changePct:  1.12, isUp: true  },
  { name: "Dow",          value: "39,127.14", changePct:  0.45, isUp: true  },
  { name: "Russell 2000", value: "2,108.55",  changePct: -0.23, isUp: false },
  { name: "VIX",          value: "18.42",     changePct: -2.14, isUp: false },
];

const PREPOST_FALLBACK: PrePostItem[] = [
  { code: "NVDA", name: "NVIDIA",   price: "$892.40", changePct:  1.35, session: "Pre", volume: "2.1M" },
  { code: "TSLA", name: "Tesla",    price: "$241.80", changePct: -2.17, session: "Pre", volume: "1.8M" },
  { code: "AAPL", name: "Apple",    price: "$197.10", changePct:  0.90, session: "AH",  volume: "980K" },
  { code: "AMZN", name: "Amazon",   price: "$182.50", changePct:  1.62, session: "AH",  volume: "750K" },
  { code: "GOOG", name: "Alphabet", price: "$175.80", changePct: -0.45, session: "Pre", volume: "620K" },
];

const M7_FALLBACK: M7Item[] = [
  { code: "AAPL", name: "Apple",     price: "$195.34", changePct:  2.1,  marketCap: "$3.0T" },
  { code: "MSFT", name: "Microsoft", price: "$432.10", changePct:  1.5,  marketCap: "$3.2T" },
  { code: "NVDA", name: "NVIDIA",    price: "$880.50", changePct:  5.4,  marketCap: "$2.2T" },
  { code: "GOOG", name: "Alphabet",  price: "$175.80", changePct: -0.4,  marketCap: "$2.1T" },
  { code: "AMZN", name: "Amazon",    price: "$182.50", changePct:  1.6,  marketCap: "$1.9T" },
  { code: "META", name: "Meta",      price: "$528.40", changePct:  1.8,  marketCap: "$1.4T" },
  { code: "TSLA", name: "Tesla",     price: "$247.18", changePct:  4.2,  marketCap: "$0.8T" },
];

const US_MOVERS_FALLBACK: MoverItem[] = [
  { code: "NVDA", name: "NVIDIA",    price: "$880.50", changePct: 5.4 },
  { code: "TSLA", name: "Tesla",     price: "$247.18", changePct: 4.2 },
  { code: "AAPL", name: "Apple",     price: "$195.34", changePct: 2.1 },
  { code: "META", name: "Meta",      price: "$528.40", changePct: 1.8 },
  { code: "MSFT", name: "Microsoft", price: "$432.10", changePct: 1.5 },
];

const US_NEWS_FALLBACK: NewsItem[] = [
  { title: "Fed signals dovish pivot — rate cut probability rises",   source: "Bloomberg", time: "1h ago"  },
  { title: "NVIDIA beats Q2 earnings, raises full-year guidance",      source: "CNBC",      time: "3h ago"  },
  { title: "Tesla announces new Gigafactory in India",                 source: "Reuters",   time: "5h ago"  },
  { title: "Apple Vision Pro 2 launch confirmed for Q4 2026",          source: "WSJ",       time: "8h ago"  },
  { title: "Inflation data comes in below expectations",               source: "Bloomberg", time: "12h ago" },
];

const FOMC_FALLBACK: EconItem[] = [
  { date: "06/11", event: "FOMC 회의",          importance: "high",   daysLeft: 13 },
  { date: "07/03", event: "NFP (비농업 고용)",   importance: "high",   daysLeft: 35 },
  { date: "07/11", event: "CPI 발표",            importance: "high",   daysLeft: 43 },
  { date: "07/30", event: "FOMC 회의",           importance: "high",   daysLeft: 62 },
];

const IMPORTANCE_STYLE: Record<"high" | "medium" | "low", string> = {
  high:   "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low:    "bg-slate-100 text-slate-600",
};

// ─── Market state helper ──────────────────────────────────────────────────────

function getMarketState(estTime: string): "REGULAR" | "PRE" | "AH" | "CLOSED" {
  const [h, m] = estTime.split(":").map(Number);
  const total = h * 60 + m;
  if (total >= 4 * 60 && total < 9 * 60 + 30) return "PRE";
  if (total >= 9 * 60 + 30 && total < 16 * 60) return "REGULAR";
  if (total >= 16 * 60 && total < 20 * 60) return "AH";
  return "CLOSED";
}

// ─── GlobalIndicesCard ────────────────────────────────────────────────────────

export function GlobalIndicesCard() {
  const [data, setData] = useState<IndexItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/yahoo/indices")
        .then((r) => r.json())
        .then((j) => { if (j.items?.length) setData(j.items); else if (!data) setError("no data"); })
        .catch(() => setError("fetch error"));

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayData = data ?? (error !== null ? INDICES_FALLBACK : INDICES_FALLBACK);

  return (
    <CardContainer
      id="card-indices"
      detailHref="/us/indices"
      title="글로벌 지수"
      emoji="🌐"
      subtitle="S&P/Nasdaq/Dow/VIX"
    >
      <ul className="space-y-2">
        {displayData.map((idx) => (
          <li
            key={idx.name}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-default"
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

// ─── PreAfterMarketCard ───────────────────────────────────────────────────────

export function PreAfterMarketCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<PrePostItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/yahoo/prepost")
        .then((r) => r.json())
        .then((j) => { if (j.items?.length) setData(j.items); else if (!data) setError("no data"); })
        .catch(() => setError("fetch error"));

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayData = data ?? (error !== null ? PREPOST_FALLBACK : PREPOST_FALLBACK);

  return (
    <CardContainer
      id="card-prepost"
      detailHref="/us/prepost"
      title="Pre / After-hours"
      emoji="🌅"
      subtitle="시간외 변동 TOP"
    >
      <ul className="space-y-2">
        {displayData.map((m) => {
          const isUp = m.changePct >= 0;
          return (
            <li
              key={`${m.code}-${m.session}`}
              onClick={() =>
                setSelectedSymbol({
                  code: m.code,
                  name: m.name,
                  price: m.price,
                  changePct: m.changePct,
                  market: "US",
                })
              }
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

// ─── Magnificent7Card ─────────────────────────────────────────────────────────

export function Magnificent7Card() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<M7Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/yahoo/m7")
        .then((r) => r.json())
        .then((j) => { if (j.items?.length) setData(j.items); else if (!data) setError("no data"); })
        .catch(() => setError("fetch error"));

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayData = data ?? (error !== null ? M7_FALLBACK : M7_FALLBACK);

  return (
    <CardContainer
      id="card-m7"
      detailHref="/us/m7"
      title="Magnificent 7"
      emoji="⭐"
      subtitle="미국 7대 대장주"
    >
      <ul className="space-y-1.5">
        {displayData.map((m) => {
          const isUp = m.changePct >= 0;
          return (
            <li
              key={m.code}
              onClick={() =>
                setSelectedSymbol({
                  code: m.code,
                  name: m.name,
                  price: m.price,
                  changePct: m.changePct,
                  market: "US",
                })
              }
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary">{m.code}</span>
                <span className="text-[10px] text-unjong-muted">{m.marketCap}</span>
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

// ─── UsMoversCard ─────────────────────────────────────────────────────────────

export function UsMoversCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<MoverItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/yahoo/us-movers")
        .then((r) => r.json())
        .then((j) => { if (j.items?.length) setData(j.items); else if (!data) setError("no data"); })
        .catch(() => setError("fetch error"));

    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayData = data ?? (error !== null ? US_MOVERS_FALLBACK : US_MOVERS_FALLBACK);

  return (
    <CardContainer
      id="card-movers"
      detailHref="/us/movers"
      title="미국 Movers"
      emoji="🇺🇸"
      subtitle="정규장 TOP"
    >
      <ul className="space-y-2">
        {displayData.map((m, i) => {
          const isUp = m.changePct >= 0;
          return (
            <li
              key={m.code}
              onClick={() =>
                setSelectedSymbol({
                  code: m.code,
                  name: m.name,
                  price: m.price,
                  changePct: m.changePct,
                  market: "US",
                })
              }
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-unjong-muted font-mono w-4 text-right">{i + 1}</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary">{m.code}</span>
                  <span className="text-[10px] text-unjong-muted truncate">{m.name}</span>
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

// ─── ForexClockCard ───────────────────────────────────────────────────────────

export function ForexClockCard() {
  const [currentTime, setCurrentTime] = useState({ est: "00:00", kst: "00:00" });

  // 시계 (1초 갱신)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const est = now.toLocaleTimeString("en-US", {
        timeZone: "America/New_York",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      const kst = now.toLocaleTimeString("ko-KR", {
        timeZone: "Asia/Seoul",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentTime({ est, kst });
    };
    updateClock();
    const id = setInterval(updateClock, 1_000);
    return () => clearInterval(id);
  }, []);

  const marketState = getMarketState(currentTime.est);
  const stateLabel: Record<typeof marketState, string> = {
    REGULAR: "정규장 OPEN",
    PRE: "Pre-market",
    AH: "After-hours",
    CLOSED: "CLOSED",
  };
  const stateColor: Record<typeof marketState, string> = {
    REGULAR: "text-emerald-600",
    PRE: "text-amber-600",
    AH: "text-blue-600",
    CLOSED: "text-slate-400",
  };

  return (
    <CardContainer
      id="card-clock"
      detailHref="/us/clock"
      title="미국 시계 · 시장 상태"
      emoji="🕐"
      subtitle="NYSE/NASDAQ 영업 시간"
    >
      <div className="space-y-3">
        {/* 시간 + 시장 상태 */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded bg-unjong-background px-2 py-2 text-center">
            <div className="text-[9px] text-unjong-muted">New York (ET)</div>
            <div className="text-base font-bold text-unjong-primary tabular-nums mt-0.5">{currentTime.est}</div>
            <div className={`text-[10px] font-semibold mt-0.5 ${stateColor[marketState]}`}>
              {stateLabel[marketState]}
            </div>
          </div>
          <div className="rounded bg-unjong-background px-2 py-2 text-center">
            <div className="text-[9px] text-unjong-muted">Seoul (KST)</div>
            <div className="text-base font-bold text-unjong-primary tabular-nums mt-0.5">{currentTime.kst}</div>
            <div className="text-[10px] text-unjong-muted mt-0.5">한국시간</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-unjong-muted px-1">
          <Clock size={10} />
          <span>ET 기준 · Pre 04:00 / 정규 09:30 / AH 16:00</span>
        </div>
      </div>
    </CardContainer>
  );
}

// ─── UsNewsCard ───────────────────────────────────────────────────────────────

export function UsNewsCard() {
  const [data, setData] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/news/us")
        .then((r) => r.json())
        .then((j) => { if (j.items?.length) setData(j.items); else if (!data) setError("no data"); })
        .catch(() => setError("fetch error"));

    load();
    const id = setInterval(load, 300_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayData = data ?? (error !== null ? US_NEWS_FALLBACK : US_NEWS_FALLBACK);

  return (
    <CardContainer
      id="card-news"
      detailHref="/us/news"
      title="미국 뉴스"
      emoji="📰"
      subtitle="Bloomberg/CNBC/WSJ"
    >
      <ul className="space-y-3">
        {displayData.map((n, i) => (
          <li
            key={i}
            onClick={() => n.url && window.open(n.url, "_blank", "noopener")}
            className={`flex items-start gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 ${
              n.url ? "cursor-pointer" : "cursor-default"
            }`}
          >
            <Newspaper size={12} className="text-unjong-muted flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0 gap-0.5">
              <span className="font-medium text-unjong-primary leading-snug">{n.title}</span>
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

// ─── FOMCCalendarCard ─────────────────────────────────────────────────────────

export function FOMCCalendarCard() {
  const [data, setData] = useState<EconItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/calendar/us-econ")
        .then((r) => r.json())
        .then((j) => { if (j.items?.length) setData(j.items); else if (!data) setError("no data"); })
        .catch(() => setError("fetch error"));

    load();
    const id = setInterval(load, 3_600_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayData = data ?? (error !== null ? FOMC_FALLBACK : FOMC_FALLBACK);

  return (
    <CardContainer
      id="card-fomc"
      detailHref="/us/fomc"
      title="FOMC·CPI·NFP 캘린더"
      emoji="📅"
      subtitle="미국 거시 이벤트"
    >
      <ul className="space-y-2">
        {displayData.map((e, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-default"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${IMPORTANCE_STYLE[e.importance]}`}>
                {e.importance === "high" ? "HIGH" : e.importance === "medium" ? "MED" : "LOW"}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">{e.event}</span>
                <span className="text-[10px] text-unjong-muted">{e.date}</span>
              </div>
            </div>
            <span className="text-[10px] text-unjong-muted flex-shrink-0 tabular-nums">
              D-{e.daysLeft}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}
