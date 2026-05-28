"use client";

import { useState } from "react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { TrendingUp, TrendingDown, X } from "lucide-react";

const DUMMY_ORDERBOOK = {
  asks: [
    { price: "78,500", quantity: 12_847 },
    { price: "78,450", quantity: 8_234 },
    { price: "78,400", quantity: 15_623 },
    { price: "78,350", quantity: 9_184 },
    { price: "78,300", quantity: 6_472 },
  ],
  bids: [
    { price: "78,250", quantity: 11_283 },
    { price: "78,200", quantity: 7_854 },
    { price: "78,150", quantity: 14_321 },
    { price: "78,100", quantity: 5_672 },
    { price: "78,050", quantity: 8_945 },
  ],
};

const DUMMY_TICKS = [
  { time: "14:32:14", price: "78,400", quantity: 1_283, type: "buy" as const },
  { time: "14:32:08", price: "78,350", quantity: 542, type: "sell" as const },
  { time: "14:31:57", price: "78,400", quantity: 2_184, type: "buy" as const },
  { time: "14:31:43", price: "78,300", quantity: 845, type: "sell" as const },
  { time: "14:31:21", price: "78,400", quantity: 3_421, type: "buy" as const },
  { time: "14:30:58", price: "78,350", quantity: 1_675, type: "sell" as const },
  { time: "14:30:42", price: "78,400", quantity: 924, type: "buy" as const },
  { time: "14:30:19", price: "78,400", quantity: 5_281, type: "buy" as const },
];

const DUMMY_OVERVIEW = {
  open: "77,800",
  high: "78,900",
  low: "77,500",
  volume: "12,847,234",
  marketCap: "467.8조",
  per: 12.4,
  pbr: 1.8,
  roe: 14.5,
  divYield: 1.73,
  high52w: "85,400",
  low52w: "65,200",
};

type Tab = "chart" | "orderbook" | "tick" | "overview";

const TABS: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: "chart", label: "차트", emoji: "📈" },
  { id: "orderbook", label: "호가창", emoji: "📊" },
  { id: "tick", label: "체결", emoji: "⚡" },
  { id: "overview", label: "종합", emoji: "📋" },
];

type StockDetailPanelProps = {
  inline?: boolean;
};

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
            <p className="text-[10px] text-unjong-muted italic mt-3">
              Layer 1 — 모든 카드 종목 클릭 연결
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const isUp = (selectedSymbol.changePct ?? 0) >= 0;

  if (inline) {
    return (
      <section className="rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden">
        {/* 헤더 — 가로 배치 */}
        <header className="flex items-center justify-between gap-4 border-b border-unjong-border px-4 py-3 bg-unjong-background">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-bold text-unjong-primary truncate">
                {selectedSymbol.name}
              </h3>
              {selectedSymbol.market && (
                <span className="text-[10px] font-semibold text-unjong-muted bg-unjong-surface px-1.5 py-0.5 rounded flex-shrink-0">
                  {selectedSymbol.market}
                </span>
              )}
              <span className="text-[11px] text-unjong-muted font-mono flex-shrink-0">
                {selectedSymbol.code}
              </span>
            </div>
            <div className="flex items-baseline gap-2 border-l border-unjong-border pl-4 flex-shrink-0">
              <span className="text-xl font-bold text-unjong-primary tabular-nums">
                {selectedSymbol.price ?? "—"}
              </span>
              {selectedSymbol.changePct !== undefined && (
                <span
                  className={`flex items-center gap-0.5 text-sm font-semibold ${
                    isUp ? "text-unjong-success" : "text-unjong-danger"
                  }`}
                >
                  {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {isUp ? "+" : ""}
                  {selectedSymbol.changePct.toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSymbol(null)}
            className="text-unjong-muted hover:text-unjong-primary p-1 flex-shrink-0"
            aria-label="종목 선택 해제"
          >
            <X size={16} />
          </button>
        </header>

        {/* 탭 네비게이션 */}
        <nav className="flex border-b border-unjong-border" aria-label="종목 상세 탭">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-b-2 ${
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

        {/* 탭 컨텐츠 */}
        <div className="p-4 min-h-[300px]">
          {activeTab === "chart" && <ChartTab />}
          {activeTab === "orderbook" && <OrderBookTab />}
          {activeTab === "tick" && <TickTab />}
          {activeTab === "overview" && <OverviewTab />}
        </div>
      </section>
    );
  }

  // 기존 세로 사이드패널 모드 (재활용 가능)
  return (
    <aside className="hidden xl:flex w-[360px] flex-shrink-0 flex-col border-l border-unjong-border bg-unjong-surface">
      {/* 종목 헤더 */}
      <header className="border-b border-unjong-border p-3 bg-unjong-background">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-unjong-primary truncate">
                {selectedSymbol.name}
              </h3>
              {selectedSymbol.market && (
                <span className="text-[10px] font-semibold text-unjong-muted bg-unjong-surface px-1.5 py-0.5 rounded">
                  {selectedSymbol.market}
                </span>
              )}
            </div>
            <p className="text-[11px] text-unjong-muted font-mono">
              {selectedSymbol.code}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedSymbol(null)}
            className="text-unjong-muted hover:text-unjong-primary p-1"
            aria-label="종목 선택 해제"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-unjong-primary tabular-nums">
            {selectedSymbol.price ?? "—"}
          </span>
          {selectedSymbol.changePct !== undefined && (
            <span
              className={`flex items-center gap-0.5 text-sm font-semibold ${
                isUp ? "text-unjong-success" : "text-unjong-danger"
              }`}
            >
              {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isUp ? "+" : ""}
              {selectedSymbol.changePct.toFixed(2)}%
            </span>
          )}
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="flex border-b border-unjong-border" aria-label="종목 상세 탭">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors border-b-2 ${
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

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "chart" && <ChartTab />}
        {activeTab === "orderbook" && <OrderBookTab />}
        {activeTab === "tick" && <TickTab />}
        {activeTab === "overview" && <OverviewTab />}
      </div>
    </aside>
  );
}

function ChartTab() {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1 flex-wrap">
        {["1분", "3분", "5분", "30분", "일봉", "주봉", "월봉"].map((interval) => (
          <button
            key={interval}
            type="button"
            className="text-[10px] text-unjong-muted hover:text-unjong-primary hover:bg-unjong-background px-2 py-1 rounded"
          >
            {interval}
          </button>
        ))}
      </div>

      <div className="aspect-[4/3] rounded border border-unjong-border bg-unjong-background flex items-center justify-center relative overflow-hidden">
        <svg
          viewBox="0 0 400 300"
          className="absolute inset-0 w-full h-full opacity-30"
          aria-hidden
        >
          <polyline
            points="20,200 60,180 100,210 140,150 180,160 220,120 260,140 300,90 340,110 380,70"
            fill="none"
            stroke="#0E7C7B"
            strokeWidth="2"
          />
          <line x1="0" y1="100" x2="400" y2="100" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="4 4" />
        </svg>
        <div className="relative text-center px-4">
          <p className="text-sm font-medium text-unjong-primary">📈 차트</p>
          <p className="text-[10px] text-unjong-muted mt-1">
            Layer 1 — TradingView · lightweight-charts 연결
          </p>
        </div>
      </div>
    </div>
  );
}

function OrderBookTab() {
  return (
    <div className="p-3 space-y-1">
      <p className="text-[10px] text-unjong-muted text-center mb-2 italic">
        Layer 1 — KIS OrderBook API 실시간 연결 예정
      </p>

      <div className="space-y-0.5">
        {DUMMY_ORDERBOOK.asks.map((ask, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-emerald-50 rounded px-2 py-1 text-xs"
          >
            <span className="text-unjong-muted tabular-nums">{ask.quantity.toLocaleString()}</span>
            <span className="font-semibold text-unjong-success tabular-nums">{ask.price}</span>
          </div>
        ))}
      </div>

      <div className="border-y border-unjong-border my-1 py-1.5 text-center bg-unjong-background">
        <span className="text-sm font-bold text-unjong-accent">78,400</span>
        <span className="text-[10px] text-unjong-muted ml-2">현재가</span>
      </div>

      <div className="space-y-0.5">
        {DUMMY_ORDERBOOK.bids.map((bid, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-red-50 rounded px-2 py-1 text-xs"
          >
            <span className="font-semibold text-unjong-danger tabular-nums">{bid.price}</span>
            <span className="text-unjong-muted tabular-nums">{bid.quantity.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TickTab() {
  return (
    <div className="p-3">
      <p className="text-[10px] text-unjong-muted text-center mb-2 italic">
        Layer 1 — KIS Tick API 실시간 체결
      </p>
      <ul className="space-y-1">
        {DUMMY_TICKS.map((tick, i) => (
          <li
            key={i}
            className="flex items-center justify-between text-xs px-2 py-1 hover:bg-unjong-background rounded"
          >
            <span className="text-[10px] text-unjong-muted font-mono">{tick.time}</span>
            <span
              className={`font-semibold tabular-nums ${
                tick.type === "buy" ? "text-unjong-success" : "text-unjong-danger"
              }`}
            >
              {tick.price}
            </span>
            <span className="text-unjong-muted tabular-nums">{tick.quantity.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="p-3 space-y-3">
      <p className="text-[10px] text-unjong-muted text-center italic">
        Layer 1 — KIS price + 재무 + 기업 메타데이터
      </p>

      <section>
        <h4 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1.5">가격</h4>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Row label="시가" value={DUMMY_OVERVIEW.open} />
          <Row label="고가" value={DUMMY_OVERVIEW.high} />
          <Row label="저가" value={DUMMY_OVERVIEW.low} />
          <Row label="거래량" value={DUMMY_OVERVIEW.volume} />
          <Row label="52주 최고" value={DUMMY_OVERVIEW.high52w} />
          <Row label="52주 최저" value={DUMMY_OVERVIEW.low52w} />
        </dl>
      </section>

      <section className="border-t border-unjong-border pt-3">
        <h4 className="text-[10px] font-semibold text-unjong-muted uppercase mb-1.5">재무</h4>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <Row label="시가총액" value={DUMMY_OVERVIEW.marketCap} />
          <Row label="PER" value={DUMMY_OVERVIEW.per.toFixed(1)} />
          <Row label="PBR" value={DUMMY_OVERVIEW.pbr.toFixed(1)} />
          <Row label="ROE" value={`${DUMMY_OVERVIEW.roe.toFixed(1)}%`} />
          <Row label="배당수익률" value={`${DUMMY_OVERVIEW.divYield.toFixed(2)}%`} />
        </dl>
      </section>

      <section className="border-t border-unjong-border pt-3">
        <p className="text-[10px] text-unjong-muted italic">
          Layer 1 추가 예정: 공시 5건 · 뉴스 5건 · 분기 실적 그래프 · 컨센서스
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-unjong-muted">{label}</dt>
      <dd className="font-semibold text-unjong-primary text-right tabular-nums">{value}</dd>
    </>
  );
}
