'use client';

/**
 * CompareTab — 현재 종목 + 최대 4개 추가 종목 비교 (총 2~5개).
 *
 * 기능:
 *  - 검색으로 종목 추가 (/api/stocks/search)
 *  - 칩 X 클릭으로 제거 (현재 종목은 제거 불가)
 *  - KPI 테이블: 시총 / PER / PBR / ROE / EPS / BPS / 6M 퍼포먼스
 *  - 정규화 퍼포먼스 라인차트 (각 종목 시작일 종가 = 100 기준)
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { Stock } from '@/types/stock';

type CompareStock = {
  symbol: string;
  name: string;
  sector: string | null;
  industry: string | null;
  country: string | null;
  marketCap: number | null;
  kpis: {
    per: number | null;
    pbr: number | null;
    eps: number | null;
    bps: number | null;
    roe: number | null;
  };
  price: {
    current: number | null;
    perf6m: number | null;
  };
  history: { date: string; close: number | null }[];
  meta: {
    latestFinancialPeriod: string | null;
    latestFinancialType: string | null;
    pricePoints: number;
  };
};

type CompareResponse = {
  stocks: CompareStock[];
  notFound: string[];
  meta: { requested: string[]; found: number; dataStart: string };
};

type SearchResult = {
  symbol: string;
  name_ko: string | null;
  market: string | null;
  market_cap: number | null;
};

const CHART_COLORS = ['#0ABAB5', '#FF3B30', '#007AFF', '#F59E0B', '#8B5CF6'];

function fmt조억(v: number | null): string {
  if (v == null) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${(v / 1e12).toFixed(1)}조`;
  if (abs >= 1e8) return `${(v / 1e8).toFixed(0)}억`;
  return v.toLocaleString('ko-KR');
}

function fmtNum(v: number | null, digits = 2): string {
  if (v == null) return '—';
  return Number(v).toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

function perfColor(v: number | null): string {
  if (v == null) return 'text-[#666666]';
  if (v > 0) return 'text-[#FF3B30]';
  if (v < 0) return 'text-[#007AFF]';
  return 'text-[#666666]';
}

export default function CompareTab({ stock }: { stock: Stock }) {
  // 현재 종목은 항상 첫 번째로 고정. 이후 사용자가 4개까지 추가.
  const [symbols, setSymbols] = useState<string[]>([stock.symbol]);
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // 검색 UI
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // 심볼 변경 시 fetch
  useEffect(() => {
    if (symbols.length < 2) {
      // 종목 1개 — 비교 불가, 빈 상태 표시
      setData(null);
      return;
    }
    const ctl = new AbortController();
    setLoading(true);
    setErr('');
    fetch(`/api/stocks/compare?symbols=${symbols.join(',')}`, { signal: ctl.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? '비교 데이터 로드 실패');
        setData(d);
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setErr(e.message);
      })
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [symbols]);

  // 검색 debounce
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/stocks/search?q=${encodeURIComponent(query.trim())}&limit=8`)
        .then((r) => r.json())
        .then((d) => setSearchResults(d.stocks ?? []))
        .catch(() => setSearchResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const addSymbol = useCallback(
    (sym: string) => {
      const upper = sym.toUpperCase();
      if (symbols.includes(upper)) return;
      if (symbols.length >= 5) {
        setErr('최대 5개 종목까지 비교 가능합니다');
        setTimeout(() => setErr(''), 3000);
        return;
      }
      setSymbols((prev) => [...prev, upper]);
      setQuery('');
      setSearchResults([]);
      setSearchOpen(false);
    },
    [symbols]
  );

  const removeSymbol = useCallback(
    (sym: string) => {
      if (sym === stock.symbol) return; // 현재 종목 제거 불가
      setSymbols((prev) => prev.filter((s) => s !== sym));
    },
    [stock.symbol]
  );

  // 차트용 정규화 데이터 (시작일 종가 = 100 기준)
  const chartData = useMemo(() => {
    if (!data?.stocks?.length) return [];
    // 공통 날짜 집합 — 모든 종목이 공유하는 거래일만 사용
    const dateSets = data.stocks.map(
      (s) => new Set(s.history.filter((h) => h.close != null).map((h) => h.date))
    );
    const common = dateSets[0]
      ? [...dateSets[0]].filter((d) => dateSets.every((ds) => ds.has(d)))
      : [];
    common.sort();

    // 각 종목의 시작 종가
    const baseByStock: Record<string, number> = {};
    for (const s of data.stocks) {
      const first = s.history.find((h) => h.date === common[0] && h.close != null);
      if (first?.close) baseByStock[s.symbol] = first.close;
    }

    return common.map((date) => {
      const row: Record<string, number | string> = { date };
      for (const s of data.stocks) {
        const p = s.history.find((h) => h.date === date);
        const base = baseByStock[s.symbol];
        if (p?.close != null && base) {
          row[s.symbol] = Math.round((p.close / base) * 10000) / 100;
        }
      }
      return row;
    });
  }, [data]);

  // 종목 메타 렌더
  const stocks = data?.stocks ?? [];

  return (
    <div className="space-y-4">
      {/* 심볼 칩 + 검색 */}
      <div className="bg-white border border-[#E5E7EB] rounded p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {symbols.map((sym) => {
            const isCurrent = sym === stock.symbol;
            const metadata = stocks.find((s) => s.symbol === sym);
            return (
              <div
                key={sym}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold ${
                  isCurrent
                    ? 'bg-[#0ABAB5] text-white'
                    : 'bg-[#F5F7FA] text-black border border-[#E5E7EB]'
                }`}
              >
                <span>${sym}</span>
                {metadata && (
                  <span className={`font-normal text-[10px] ${isCurrent ? 'opacity-80' : 'text-[#999999]'}`}>
                    {metadata.name}
                  </span>
                )}
                {!isCurrent && (
                  <button
                    onClick={() => removeSymbol(sym)}
                    aria-label={`${sym} 제거`}
                    className="text-[#999999] hover:text-[#FF3B30] ml-0.5 leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* 추가 버튼 / 검색 input */}
          {symbols.length < 5 && (
            <div className="relative">
              {!searchOpen ? (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="px-2 py-1 text-xs font-bold text-[#0ABAB5] border border-dashed border-[#0ABAB5] rounded hover:bg-[#0ABAB5]/10"
                >
                  + 종목 추가
                </button>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                    autoFocus
                    placeholder="종목명 또는 6자리 코드"
                    className="px-2 py-1 text-xs border border-[#E5E7EB] rounded focus:outline-none focus:border-[#0ABAB5] w-48"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#E5E7EB] rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button
                          key={r.symbol}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addSymbol(r.symbol);
                          }}
                          className="w-full px-2 py-1.5 text-xs text-left hover:bg-[#F5F7FA] flex justify-between items-center border-b border-[#F5F7FA] last:border-b-0"
                          disabled={symbols.includes(r.symbol)}
                        >
                          <span>
                            <span className="font-bold">${r.symbol}</span>
                            <span className="text-[#666666] ml-1">{r.name_ko}</span>
                          </span>
                          {symbols.includes(r.symbol) && (
                            <span className="text-[10px] text-[#999999]">추가됨</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-[10px] text-[#999999] mt-2">
          현재 종목 포함 2~5개 비교. 현재 종목은 제거할 수 없습니다.
        </p>
        {err && <p className="text-[11px] text-[#FF3B30] mt-1">⚠ {err}</p>}
      </div>

      {/* 대기 / 에러 / 빈 상태 */}
      {symbols.length < 2 && (
        <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
          비교할 종목을 1개 이상 추가해주세요.
        </div>
      )}
      {loading && (
        <div className="bg-[#F5F7FA] border border-[#E5E7EB] rounded p-6 text-center text-[#666666] text-sm">
          불러오는 중...
        </div>
      )}

      {/* KPI 비교 테이블 */}
      {data && data.stocks.length >= 2 && !loading && (
        <div className="bg-white border border-[#E5E7EB] rounded overflow-hidden">
          <div className="px-3 py-2 bg-[#F5F7FA] border-b border-[#E5E7EB]">
            <p className="font-bold text-xs text-black">핵심 지표 비교</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#FAFBFC] border-b border-[#E5E7EB]">
                  <th className="px-3 py-2 text-left font-bold text-[#666666]">지표</th>
                  {data.stocks.map((s, i) => (
                    <th key={s.symbol} className="px-3 py-2 text-right font-bold">
                      <Link href={`/stocks/${s.symbol}`} className="hover:underline">
                        <span style={{ color: CHART_COLORS[i] }}>${s.symbol}</span>
                        <br />
                        <span className="font-normal text-[10px] text-[#666666]">{s.name}</span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#F5F7FA]">
                  <td className="px-3 py-1.5 text-[#666666]">현재가</td>
                  {data.stocks.map((s) => (
                    <td key={s.symbol} className="px-3 py-1.5 text-right font-bold tabular-nums">
                      {s.price.current != null ? fmtNum(s.price.current, 0) : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#F5F7FA]">
                  <td className="px-3 py-1.5 text-[#666666]">6개월 수익률</td>
                  {data.stocks.map((s) => (
                    <td key={s.symbol} className={`px-3 py-1.5 text-right font-bold tabular-nums ${perfColor(s.price.perf6m)}`}>
                      {fmtPct(s.price.perf6m)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#F5F7FA]">
                  <td className="px-3 py-1.5 text-[#666666]">시가총액</td>
                  {data.stocks.map((s) => (
                    <td key={s.symbol} className="px-3 py-1.5 text-right tabular-nums">
                      {s.country === 'KR' ? fmt조억(s.marketCap) : fmtNum(s.marketCap, 0)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#F5F7FA]">
                  <td className="px-3 py-1.5 text-[#666666]">PER</td>
                  {data.stocks.map((s) => (
                    <td key={s.symbol} className="px-3 py-1.5 text-right tabular-nums">
                      {fmtNum(s.kpis.per)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#F5F7FA]">
                  <td className="px-3 py-1.5 text-[#666666]">PBR</td>
                  {data.stocks.map((s) => (
                    <td key={s.symbol} className="px-3 py-1.5 text-right tabular-nums">
                      {fmtNum(s.kpis.pbr)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#F5F7FA]">
                  <td className="px-3 py-1.5 text-[#666666]">ROE</td>
                  {data.stocks.map((s) => (
                    <td key={s.symbol} className="px-3 py-1.5 text-right tabular-nums">
                      {s.kpis.roe != null ? `${fmtNum(s.kpis.roe)}%` : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-[#F5F7FA]">
                  <td className="px-3 py-1.5 text-[#666666]">EPS</td>
                  {data.stocks.map((s) => (
                    <td key={s.symbol} className="px-3 py-1.5 text-right tabular-nums">
                      {fmtNum(s.kpis.eps, 0)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-3 py-1.5 text-[#666666]">BPS</td>
                  {data.stocks.map((s) => (
                    <td key={s.symbol} className="px-3 py-1.5 text-right tabular-nums">
                      {fmtNum(s.kpis.bps, 0)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 퍼포먼스 라인차트 */}
      {data && data.stocks.length >= 2 && chartData.length > 0 && !loading && (
        <div className="bg-white border border-[#E5E7EB] rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-xs text-black">6개월 정규화 퍼포먼스 (시작일 = 100)</p>
            <p className="text-[10px] text-[#999999]">{chartData.length} 거래일</p>
          </div>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F7FA" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#666666' }}
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#666666' }}
                  tickFormatter={(v) => `${v}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 4 }}
                  formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {data.stocks.map((s, i) => (
                  <Line
                    key={s.symbol}
                    type="monotone"
                    dataKey={s.symbol}
                    name={`$${s.symbol} ${s.name}`}
                    stroke={CHART_COLORS[i]}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* notFound 경고 */}
      {data && data.notFound.length > 0 && (
        <div className="text-[11px] text-[#F59E0B]">
          ⓘ 데이터 부재: {data.notFound.map((s) => `$${s}`).join(', ')}
        </div>
      )}
    </div>
  );
}
