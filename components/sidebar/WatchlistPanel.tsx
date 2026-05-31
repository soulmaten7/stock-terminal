"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, X, Plus } from "lucide-react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { useWatchlist, type WatchlistItem } from "@/stores/watchlistStore";

type PriceInfo = { price: string; changePct: number };
type PriceMap = Record<string, PriceInfo | null>;

export function WatchlistPanel() {
  const router = useRouter();
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [mounted, setMounted] = useState(false);
  const items = useWatchlist((s) => s.items);
  const addItem = useWatchlist((s) => s.add);
  const removeItem = useWatchlist((s) => s.remove);
  const resetItems = useWatchlist((s) => s.reset);

  const [prices, setPrices] = useState<PriceMap>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addInput, setAddInput] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // 가격 폴링 (30초)
  useEffect(() => {
    if (!mounted || items.length === 0) {
      setPrices({});
      setPricesLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const krCodes = items.filter((i) => i.market !== "US").map((i) => i.code);
      const usCodes = items.filter((i) => i.market === "US").map((i) => i.code);
      const next: PriceMap = {};

      // KR — 개별 호출 (KIS batch API 없음)
      await Promise.all(
        krCodes.map(async (code) => {
          try {
            const r = await fetch(`/api/kis/price?symbol=${code}`);
            if (!r.ok) return;
            const json = await r.json();
            if (json.error) return;
            next[code] = {
              price: Number(json.price).toLocaleString(),
              changePct: Number(json.changePercent) || 0,
            };
          } catch {
            next[code] = null;
          }
        })
      );

      // US — batch 호출
      if (usCodes.length > 0) {
        try {
          const r = await fetch(`/api/yahoo/quote?symbols=${usCodes.join(",")}`);
          if (r.ok) {
            const json = await r.json();
            (json.items as Array<{ code: string; price: number; changePct: number }>).forEach((it) => {
              next[it.code] = {
                price: `$${it.price.toFixed(2)}`,
                changePct: it.changePct,
              };
            });
          }
        } catch { /* 무시 */ }
      }

      if (!cancelled) {
        setPrices(next);
        setPricesLoading(false);
      }
    };

    setPricesLoading(true);
    load();
    const interval = setInterval(load, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [items, mounted]);

  const handleAdd = () => {
    const raw = addInput.trim().toUpperCase();
    if (!raw) return;

    let item: WatchlistItem;
    if (/^\d{6}$/.test(raw)) {
      item = { code: raw, name: raw, market: "KOSPI" };
    } else if (/^[A-Z.\-]+$/.test(raw)) {
      item = { code: raw, name: raw, market: "US" };
    } else {
      return;
    }

    addItem(item);
    setAddInput("");
    setShowAdd(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
    else if (e.key === "Escape") { setShowAdd(false); setAddInput(""); }
  };

  const handleItemClick = (item: WatchlistItem) => {
    const p = prices[item.code];
    setSelectedSymbol({
      code: item.code,
      name: item.name,
      price: p?.price,
      changePct: p?.changePct,
      market: item.market,
    });
    router.push(`/stock/${item.code}`);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-unjong-border bg-unjong-surface overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-unjong-border px-3 py-2 bg-unjong-background flex-shrink-0">
        <span className="text-xs font-semibold text-unjong-primary" suppressHydrationWarning>
          👀 관심종목 {mounted ? `${items.length}개` : ""}
        </span>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="text-unjong-muted hover:text-unjong-accent p-0.5"
          aria-label="관심종목 추가"
          title="추가"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* 추가 입력창 */}
      {showAdd && (
        <div className="border-b border-unjong-border bg-unjong-background p-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={addInput}
              onChange={(e) => setAddInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="005930 또는 AAPL"
              autoFocus
              className="flex-1 px-2 py-1 text-xs rounded border border-unjong-border bg-unjong-surface text-unjong-primary focus:outline-none focus:border-unjong-accent"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="px-2 py-1 text-xs rounded bg-unjong-accent text-white font-semibold hover:opacity-90"
            >
              추가
            </button>
          </div>
          <p className="text-[10px] text-unjong-muted mt-1">
            한국: 6자리 종목코드 · 미국: 티커 (예: TSLA)
          </p>
        </div>
      )}

      {/* 리스트 */}
      <ul className="flex-1 overflow-y-auto min-h-0 divide-y divide-unjong-border">
        {!mounted ? (
          <li className="p-4 text-center text-[10px] text-unjong-muted italic">⏳ 로딩 중...</li>
        ) : items.length === 0 ? (
          <li className="p-4 text-center text-xs text-unjong-muted">
            <p className="mb-2">관심종목이 없습니다.</p>
            <button type="button" onClick={resetItems} className="text-[10px] text-unjong-accent hover:underline">
              기본 종목 8개 복원
            </button>
          </li>
        ) : (
          items.map((item) => {
            const p = prices[item.code];
            const isUp = (p?.changePct ?? 0) >= 0;
            return (
              <li
                key={item.code}
                className="group flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-unjong-background cursor-pointer transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className="flex flex-1 items-center justify-between gap-2 min-w-0 text-left"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium text-unjong-primary truncate">{item.name}</span>
                    <span className="text-[10px] text-unjong-muted">{item.code}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="font-semibold text-unjong-primary tabular-nums">
                      {pricesLoading && !p ? "..." : (p?.price ?? "—")}
                    </span>
                    {p && (
                      <span className={`flex items-center gap-0.5 text-[10px] font-medium tabular-nums ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                        {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {isUp ? "+" : ""}{p.changePct.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeItem(item.code); }}
                  className="opacity-0 group-hover:opacity-100 text-unjong-muted hover:text-unjong-danger p-0.5 flex-shrink-0 transition-opacity"
                  aria-label={`${item.name} 관심종목 제거`}
                >
                  <X size={12} />
                </button>
              </li>
            );
          })
        )}
      </ul>

    </div>
  );
}
