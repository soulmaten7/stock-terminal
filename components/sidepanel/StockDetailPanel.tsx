"use client";

import { useEffect, useRef, useState } from "react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { TrendingUp, TrendingDown, X } from "lucide-react";
import type { IChartApi } from "lightweight-charts";

type Tab = "chart" | "orderbook" | "tick" | "overview";

const TABS: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: "chart",     label: "차트",   emoji: "📈" },
  { id: "orderbook", label: "호가창", emoji: "📊" },
  { id: "tick",      label: "체결",   emoji: "⚡" },
  { id: "overview",  label: "종합",   emoji: "📋" },
];

type StockDetailPanelProps = { inline?: boolean };

export function StockDetailPanel({ inline = false }: StockDetailPanelProps) {
  const { selectedSymbol, setSelectedSymbol } = useUnjongSelectedSymbol();
  const [activeTab, setActiveTab] = useState<Tab>("chart");

  if (!selectedSymbol) {
    if (inline) {
      return (
        <div className="rounded-lg border border-dashed border-unjong-border bg-unjong-surface p-6 text-center text-xs text-unjong-muted">
          관심종목 또는 카드에서 종목을 클릭하면 차트·호가·체결·종합이 표시됩니다.
        </div>
      );
    }
    return (
      <aside className="hidden xl:flex w-[360px] flex-shrink-0 flex-col border-l border-unjong-border bg-unjong-surface">
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <div className="text-3xl">👆</div>
            <p className="text-sm text-unjong-muted">
              관심종목 또는 카드에서
              <br />
              종목을 클릭하면
              <br />
              여기 차트·호가·체결이 표시됩니다.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const isUp = (selectedSymbol.changePct ?? 0) >= 0;

  const tabContent = (
    <>
      {activeTab === "chart"     && <ChartTab symbol={selectedSymbol.code} />}
      {activeTab === "orderbook" && <OrderBookTab symbol={selectedSymbol.code} />}
      {activeTab === "tick"      && <TickTab symbol={selectedSymbol.code} />}
      {activeTab === "overview"  && <OverviewTab symbol={selectedSymbol.code} />}
    </>
  );

  const tabNav = (compact = false) => (
    <nav className="flex border-b border-unjong-border" aria-label="종목 상세 탭">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setActiveTab(t.id)}
          className={`flex-1 ${compact ? "px-2" : "px-3"} py-2.5 text-xs font-medium transition-colors border-b-2 ${
            activeTab === t.id
              ? "border-unjong-accent text-unjong-primary"
              : "border-transparent text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
          }`}
        >
          <span className="mr-1" aria-hidden>{t.emoji}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );

  if (inline) {
    return (
      <section className="rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-unjong-border px-4 py-3 bg-unjong-background">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-bold text-unjong-primary truncate">{selectedSymbol.name}</h3>
              {selectedSymbol.market && (
                <span className="text-[10px] font-semibold text-unjong-muted bg-unjong-surface px-1.5 py-0.5 rounded flex-shrink-0">
                  {selectedSymbol.market}
                </span>
              )}
              <span className="text-[11px] text-unjong-muted font-mono flex-shrink-0">{selectedSymbol.code}</span>
            </div>
            <div className="flex items-baseline gap-2 border-l border-unjong-border pl-4 flex-shrink-0">
              <span className="text-xl font-bold text-unjong-primary tabular-nums">{selectedSymbol.price ?? "—"}</span>
              {selectedSymbol.changePct !== undefined && (
                <span className={`flex items-center gap-0.5 text-sm font-semibold ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isUp ? "+" : ""}{selectedSymbol.changePct.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <button type="button" onClick={() => setSelectedSymbol(null)} className="text-unjong-muted hover:text-unjong-primary p-1 flex-shrink-0" aria-label="종목 선택 해제">
            <X size={16} />
          </button>
        </header>
        {tabNav(false)}
        <div className="p-4 min-h-[300px]">{tabContent}</div>
      </section>
    );
  }

  return (
    <aside className="hidden xl:flex w-[360px] flex-shrink-0 flex-col border-l border-unjong-border bg-unjong-surface">
      <header className="border-b border-unjong-border p-3 bg-unjong-background">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-unjong-primary truncate">{selectedSymbol.name}</h3>
              {selectedSymbol.market && (
                <span className="text-[10px] font-semibold text-unjong-muted bg-unjong-surface px-1.5 py-0.5 rounded">
                  {selectedSymbol.market}
                </span>
              )}
            </div>
            <p className="text-[11px] text-unjong-muted font-mono">{selectedSymbol.code}</p>
          </div>
          <button type="button" onClick={() => setSelectedSymbol(null)} className="text-unjong-muted hover:text-unjong-primary p-1" aria-label="종목 선택 해제">
            <X size={14} />
          </button>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-unjong-primary tabular-nums">{selectedSymbol.price ?? "—"}</span>
          {selectedSymbol.changePct !== undefined && (
            <span className={`flex items-center gap-0.5 text-sm font-semibold ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isUp ? "+" : ""}{selectedSymbol.changePct.toFixed(2)}%
            </span>
          )}
        </div>
      </header>
      {tabNav(true)}
      <div className="flex-1 overflow-y-auto min-h-0">{tabContent}</div>
    </aside>
  );
}

// ─── 한국 주식 코드 판별 ───────────────────────────────────────────────────────
const isKrCode = (s: string) => /^\d{6}$/.test(s);

// ─── ChartTab ─────────────────────────────────────────────────────────────────

type Candle = { time: string; open: number; high: number; low: number; close: number; volume: number };
type ChartData = { symbol: string; name: string; period: string; candles: Candle[] };

function ChartTab({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<"D" | "W" | "M">("D");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isKrCode(symbol)) { setLoading(false); return; }
    if (!containerRef.current) return;

    let chart: IChartApi | null = null;
    let cancelled = false;
    let ro: ResizeObserver | null = null;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ createChart, ColorType, LineStyle }, res] = await Promise.all([
          import("lightweight-charts"),
          fetch(`/api/kis/chart?symbol=${symbol}&period=${period}`).then((r) => {
            if (!r.ok) throw new Error(`API ${r.status}`);
            return r.json() as Promise<ChartData>;
          }),
        ]);

        if (cancelled || !containerRef.current) return;

        containerRef.current.innerHTML = "";

        chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height: 300,
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#475569",
            fontFamily: "inherit",
            attributionLogo: false,
          },
          grid: {
            vertLines: { color: "#e2e8f0", style: LineStyle.Dotted },
            horzLines: { color: "#e2e8f0", style: LineStyle.Dotted },
          },
          rightPriceScale: { borderColor: "#cbd5e1" },
          timeScale: { borderColor: "#cbd5e1", timeVisible: false },
          handleScroll: true,
          handleScale: true,
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: "#0E7C7B",
          downColor: "#C73E3A",
          borderUpColor: "#0E7C7B",
          borderDownColor: "#C73E3A",
          wickUpColor: "#0E7C7B",
          wickDownColor: "#C73E3A",
        });

        candleSeries.setData(
          res.candles.map((c) => ({ time: c.time as import("lightweight-charts").Time, open: c.open, high: c.high, low: c.low, close: c.close }))
        );

        chart.timeScale().fitContent();

        ro = new ResizeObserver(() => {
          if (chart && containerRef.current) {
            chart.applyOptions({ width: containerRef.current.clientWidth });
          }
        });
        ro.observe(containerRef.current);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (ro) ro.disconnect();
      if (chart) { chart.remove(); chart = null; }
    };
  }, [symbol, period]);

  if (!isKrCode(symbol)) {
    return (
      <div className="p-4 text-center text-xs text-unjong-muted italic">
        미국 주식 차트는 추후 Yahoo Finance / TradingView 위젯으로 추가 예정
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1">
        {(["D", "W", "M"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`text-[10px] px-2 py-1 rounded ${
              period === p
                ? "bg-unjong-accent text-white font-semibold"
                : "text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background"
            }`}
          >
            {p === "D" ? "일봉" : p === "W" ? "주봉" : "월봉"}
          </button>
        ))}
      </div>

      <div className="w-full h-[300px] rounded border border-unjong-border bg-unjong-background relative">
        <div ref={containerRef} className="absolute inset-0" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-unjong-muted bg-unjong-background/80">
            ⏳ 차트 로딩 중...
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-unjong-danger px-4 text-center">
            ❌ 차트 로딩 실패: {error}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── OrderBookTab ─────────────────────────────────────────────────────────────

type OrderBookEntry = { price: number; volume: number };
type OrderBookData = {
  symbol: string;
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
  totalAskVolume: number;
  totalBidVolume: number;
};

function OrderBookTab({ symbol }: { symbol: string }) {
  const [data, setData] = useState<OrderBookData | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isKrCode(symbol)) { setLoading(false); return; }

    let cancelled = false;
    const load = async () => {
      try {
        const [obRes, pRes] = await Promise.all([
          fetch(`/api/kis/orderbook?symbol=${symbol}`).then((r) => r.json()),
          fetch(`/api/kis/price?symbol=${symbol}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (obRes.error) setError(obRes.error);
        else { setData(obRes); if (pRes.price) setCurrentPrice(pRes.price); }
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 10_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  if (!isKrCode(symbol)) return <div className="p-4 text-center text-xs text-unjong-muted italic">미국 주식 호가창은 별도 데이터 소스 필요</div>;
  if (loading && !data) return <div className="p-4 text-center text-xs text-unjong-muted italic">⏳ 호가 로딩 중...</div>;
  if (error || !data) return <div className="p-4 text-center text-xs text-unjong-danger">❌ {error || "데이터 없음"}</div>;

  return (
    <div className="p-3 space-y-0.5">
      {data.asks.filter((a) => a.price > 0).map((ask, i) => (
        <div key={i} className="flex items-center justify-between bg-emerald-50 rounded px-2 py-1 text-xs">
          <span className="text-unjong-muted tabular-nums">{ask.volume.toLocaleString()}</span>
          <span className="font-semibold text-unjong-success tabular-nums">{ask.price.toLocaleString()}</span>
        </div>
      ))}

      <div className="border-y border-unjong-border my-1 py-1.5 text-center bg-unjong-background">
        <span className="text-sm font-bold text-unjong-accent">{currentPrice ? currentPrice.toLocaleString() : "—"}</span>
        <span className="text-[10px] text-unjong-muted ml-2">현재가</span>
      </div>

      {data.bids.filter((b) => b.price > 0).map((bid, i) => (
        <div key={i} className="flex items-center justify-between bg-red-50 rounded px-2 py-1 text-xs">
          <span className="font-semibold text-unjong-danger tabular-nums">{bid.price.toLocaleString()}</span>
          <span className="text-unjong-muted tabular-nums">{bid.volume.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── TickTab ──────────────────────────────────────────────────────────────────

type Execution = { time: string; price: number; change: number; changeSign: string; volume: number; totalVolume: number };
type TickData = { symbol: string; executions: Execution[] };

function TickTab({ symbol }: { symbol: string }) {
  const [data, setData] = useState<TickData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isKrCode(symbol)) { setLoading(false); return; }

    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/execution?symbol=${symbol}`);
        const json = await r.json();
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 5_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  if (!isKrCode(symbol)) return <div className="p-4 text-center text-xs text-unjong-muted italic">미국 주식 체결은 별도 데이터 소스 필요</div>;
  if (loading && !data) return <div className="p-4 text-center text-xs text-unjong-muted italic">⏳ 체결 로딩 중...</div>;
  if (error || !data) return <div className="p-4 text-center text-xs text-unjong-danger">❌ {error || "데이터 없음"}</div>;

  const fmt = (t: string) => t.length >= 6 ? `${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}` : t;

  return (
    <div className="p-3">
      <ul className="space-y-1 max-h-[400px] overflow-y-auto">
        {data.executions.slice(0, 30).map((tick, i) => {
          const isUp = tick.changeSign === "1" || tick.changeSign === "2";
          return (
            <li key={i} className="flex items-center justify-between text-xs px-2 py-1 hover:bg-unjong-background rounded">
              <span className="text-[10px] text-unjong-muted font-mono">{fmt(tick.time)}</span>
              <span className={`font-semibold tabular-nums ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                {tick.price.toLocaleString()}
              </span>
              <span className="text-unjong-muted tabular-nums">{tick.volume.toLocaleString()}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── OverviewTab ──────────────────────────────────────────────────────────────

type PriceData = {
  symbol: string; name: string; price: number; change: number; changePercent: number;
  open: number; high: number; low: number; volume: number;
  high52w: number; low52w: number; per: number; pbr: number;
  marketCap: number; dividendYield: number | null;
};

function OverviewTab({ symbol }: { symbol: string }) {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isKrCode(symbol)) { setLoading(false); return; }

    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/kis/price?symbol=${symbol}`);
        const json = await r.json();
        if (cancelled) return;
        if (json.error) setError(json.error);
        else setData(json);
      } catch (err) {
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  if (!isKrCode(symbol)) return <div className="p-4 text-center text-xs text-unjong-muted italic">미국 주식 종합 정보는 Yahoo Finance 모듈로 추후 추가</div>;
  if (loading && !data) return <div className="p-4 text-center text-xs text-unjong-muted italic">⏳ 정보 로딩 중...</div>;
  if (error || !data) return <div className="p-4 text-center text-xs text-unjong-danger">❌ {error || "데이터 없음"}</div>;

  const marketCapStr = data.marketCap > 0 ? `${(data.marketCap / 100_000_000).toFixed(1)}조` : "—";

  return (
    <div className="p-3 space-y-3">
      <section>
        <h4 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1.5">가격</h4>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Row label="시가"     value={data.open    ? data.open.toLocaleString()    : "—"} />
          <Row label="고가"     value={data.high    ? data.high.toLocaleString()    : "—"} />
          <Row label="저가"     value={data.low     ? data.low.toLocaleString()     : "—"} />
          <Row label="거래량"   value={data.volume  ? data.volume.toLocaleString()  : "—"} />
          <Row label="52주 최고" value={data.high52w ? data.high52w.toLocaleString() : "—"} />
          <Row label="52주 최저" value={data.low52w  ? data.low52w.toLocaleString()  : "—"} />
        </dl>
      </section>

      <section className="border-t border-unjong-border pt-3">
        <h4 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1.5">재무</h4>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Row label="시가총액"   value={marketCapStr} />
          <Row label="PER"        value={data.per > 0 ? data.per.toFixed(1) : "—"} />
          <Row label="PBR"        value={data.pbr > 0 ? data.pbr.toFixed(1) : "—"} />
          <Row label="배당수익률" value={data.dividendYield ? `${data.dividendYield.toFixed(2)}%` : "—"} />
        </dl>
      </section>
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-unjong-muted">{label}</dt>
      <dd className="font-semibold text-unjong-primary text-right tabular-nums">{value}</dd>
    </>
  );
}
