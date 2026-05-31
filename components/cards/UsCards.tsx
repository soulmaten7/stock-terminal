"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { CardContainer } from "./CardContainer";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

// ─── Types ────────────────────────────────────────────────────────────────────

type IndexItem = { name: string; value: string; changePct: number; isUp: boolean };
type M7Item = { code: string; name: string; price: string; changePct: number; marketCap: string };
type MoverItem = { code: string; name: string; price: string; changePct: number };

// ─── Fallbacks ────────────────────────────────────────────────────────────────

const INDICES_FALLBACK: IndexItem[] = [
  { name: "S&P 500",      value: "5,234.12",  changePct:  0.87, isUp: true  },
  { name: "Nasdaq",       value: "16,891.50", changePct:  1.12, isUp: true  },
  { name: "Dow",          value: "39,127.14", changePct:  0.45, isUp: true  },
  { name: "Russell 2000", value: "2,108.55",  changePct: -0.23, isUp: false },
  { name: "VIX",          value: "18.42",     changePct: -2.14, isUp: false },
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

  const displayData = data ?? INDICES_FALLBACK;

  return (
    <CardContainer
      id="card-indices"
      detailHref="/us/indices"
      title="글로벌 지수"
      emoji="🌐"
      subtitle="S&P/Nasdaq/Dow/VIX"
      hint={error ? "⚠️ 데이터 일시 불가" : undefined}
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

// ─── Magnificent7Card ─────────────────────────────────────────────────────────

export function Magnificent7Card() {
  const router = useRouter();
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

  const displayData = data ?? M7_FALLBACK;

  return (
    <CardContainer
      id="card-m7"
      detailHref="/us/m7"
      title="Magnificent 7"
      emoji="⭐"
      subtitle="미국 7대 대장주"
      hint={error ? "⚠️ 데이터 일시 불가" : undefined}
    >
      <ul className="space-y-1.5">
        {displayData.map((m) => {
          const isUp = m.changePct >= 0;
          return (
            <li
              key={m.code}
              onClick={() => {
                setSelectedSymbol({
                  code: m.code,
                  name: m.name,
                  price: m.price,
                  changePct: m.changePct,
                  market: "US",
                });
                router.push(`/stock/${m.code}`);
              }}
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
  const router = useRouter();
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

  const displayData = data ?? US_MOVERS_FALLBACK;

  return (
    <CardContainer
      id="card-us-movers"
      detailHref="/us/movers"
      title="미국 Movers"
      emoji="🇺🇸"
      subtitle="정규장 TOP"
      hint={error ? "⚠️ 데이터 일시 불가" : undefined}
    >
      <ul className="space-y-2">
        {displayData.map((m, i) => {
          const isUp = m.changePct >= 0;
          return (
            <li
              key={m.code}
              onClick={() => {
                setSelectedSymbol({
                  code: m.code,
                  name: m.name,
                  price: m.price,
                  changePct: m.changePct,
                  market: "US",
                });
                router.push(`/stock/${m.code}`);
              }}
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
