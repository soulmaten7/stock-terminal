"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

type SearchResult = {
  symbol: string;
  name: string;
  market: string;
  country: string;
};

function inferMarket(country: string, market: string): "KOSPI" | "KOSDAQ" | "US" {
  if (country === "US") return "US";
  if (market === "KOSPI") return "KOSPI";
  return "KOSDAQ";
}

export function HeaderSearch() {
  const router = useRouter();
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search (200ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const r = await fetch(`/api/stocks/search?q=${encodeURIComponent(trimmed)}&limit=10`);
        const json = await r.json();
        setResults(json.items || []);
        setActiveIndex(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Click outside → close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (item: SearchResult) => {
    setSelectedSymbol({
      code: item.symbol,
      name: item.name,
      market: inferMarket(item.country, item.market),
    });
    router.push(`/stock/${item.symbol}`);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowDropdown(false);
      setQuery("");
      return;
    }
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (target) handleSelect(target);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-unjong-muted z-10">
        <Search size={16} />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder="🔍 종목 검색 (예: 삼성전자, 005930, AAPL)"
        className="w-full rounded-md border border-unjong-border bg-unjong-surface py-2 pl-10 pr-9 text-sm text-unjong-primary placeholder:text-unjong-muted focus:outline-none focus:border-unjong-accent transition-colors"
        aria-label="운종 종목 검색"
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          onClick={() => { setQuery(""); setResults([]); setShowDropdown(false); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-unjong-muted hover:text-unjong-primary"
          aria-label="검색어 지우기"
        >
          <X size={14} />
        </button>
      )}

      {/* 드롭다운 */}
      {showDropdown && query.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-80 overflow-y-auto rounded-md border border-unjong-border bg-unjong-surface shadow-lg z-50">
          {loading && results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-unjong-muted italic">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-xs text-unjong-muted italic">
              일치하는 종목이 없습니다.
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item, i) => {
                const market = inferMarket(item.country, item.market);
                const marketColor =
                  market === "KOSPI"
                    ? "bg-blue-50 text-blue-700"
                    : market === "KOSDAQ"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-purple-50 text-purple-700";
                return (
                  <li key={item.symbol}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                        i === activeIndex ? "bg-unjong-background" : "hover:bg-unjong-background"
                      }`}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${marketColor}`}>
                        {market}
                      </span>
                      <span className="font-medium text-unjong-primary truncate flex-1">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-unjong-muted font-mono flex-shrink-0">
                        {item.symbol}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
