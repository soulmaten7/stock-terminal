'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';

interface MoverItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  priceText: string;
  prdyVrss: number;
  changePercent: number;
  volume: number;
}

type Dir = 'up' | 'down';
type Market = 'all' | 'kospi' | 'kosdaq';

const MARKET_LABELS: Record<Market, string> = {
  all: '전체',
  kospi: 'KOSPI',
  kosdaq: 'KOSDAQ',
};

const UPPER_LIMIT = 29.5;
const LOWER_LIMIT = -29.5;

const fmt = (n: number) => n.toLocaleString('ko-KR');

export default function MoversPricePageClient() {
  const sp = useSearchParams();
  const initTab = (sp.get('tab') || 'up') === 'down' ? 'down' : 'up';
  const initMarket = (['all', 'kospi', 'kosdaq'].includes(sp.get('market') || '')
    ? sp.get('market')
    : 'all') as Market;

  const [dir, setDir] = useState<Dir>(initTab as Dir);
  const [market, setMarket] = useState<Market>(initMarket);
  const [onlyLimit, setOnlyLimit] = useState(false);
  const [items, setItems] = useState<MoverItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kis/movers?dir=${dir}&market=${market}&limit=30`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [dir, market]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = onlyLimit
    ? items.filter((x) =>
        dir === 'up' ? x.changePercent >= UPPER_LIMIT : x.changePercent <= LOWER_LIMIT
      )
    : items;

  return (
    <div className="w-full px-6 py-6 max-w-screen-2xl mx-auto">
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-black">
          <TrendingUp className="w-6 h-6 text-[#0ABAB5]" />
          상승/하락 순위
        </h1>
        <p className="text-sm text-[#666] mt-1">
          당일 등락률 상위·하위 30종목 · KIS API FHPST01700000
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        {/* 상승/하락 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={() => setDir('up')}
            className={`text-xs font-bold px-3 py-2 transition-colors ${
              dir === 'up' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            상승
          </button>
          <button
            type="button"
            onClick={() => setDir('down')}
            className={`text-xs font-bold px-3 py-2 transition-colors ${
              dir === 'down' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            하락
          </button>
        </div>

        {/* 시장구분 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(MARKET_LABELS) as Market[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className={`text-xs font-medium px-3 py-2 transition-colors ${
                market === m
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {MARKET_LABELS[m]}
            </button>
          ))}
        </div>

        {/* 상/하한가 토글 */}
        <button
          type="button"
          onClick={() => setOnlyLimit((v) => !v)}
          className={`text-xs font-medium px-3 py-2 rounded border transition-colors ${
            onlyLimit
              ? dir === 'up'
                ? 'bg-[#FF3B30] text-white border-[#FF3B30]'
                : 'bg-[#0051CC] text-white border-[#0051CC]'
              : 'bg-white text-[#666] border-[#E5E7EB] hover:bg-[#F0F0F0]'
          }`}
        >
          {dir === 'up' ? '상한가만' : '하한가만'}
        </button>

        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="text-right px-4 py-2.5 w-14">순위</th>
                <th className="text-left px-4 py-2.5 w-28">종목코드</th>
                <th className="text-left px-4 py-2.5">종목명</th>
                <th className="text-right px-4 py-2.5 w-28">현재가</th>
                <th className="text-right px-4 py-2.5 w-24">전일대비</th>
                <th className="text-right px-4 py-2.5 w-24">등락률</th>
                <th className="text-right px-4 py-2.5 w-32">거래량</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-[#999]">
                    데이터 없음
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const isUpper = r.changePercent >= UPPER_LIMIT;
                const isLower = r.changePercent <= LOWER_LIMIT;
                const isLimit = isUpper || isLower;
                const colorCls = r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]';
                return (
                  <tr
                    key={r.symbol}
                    className={`border-t border-[#F0F0F0] hover:bg-[#FAFAFA] ${
                      isUpper ? 'bg-[#FFE5E3]/40' : isLower ? 'bg-[#E3ECFF]/40' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-right text-[#888] tabular-nums">{r.rank}</td>
                    <td className="px-4 py-2.5 text-[#333] tabular-nums text-xs">{r.symbol}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/chart?symbol=${r.symbol}`}
                          className="font-bold text-black hover:text-[#0ABAB5] hover:underline"
                        >
                          {r.name}
                        </Link>
                        {isUpper && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white">
                            상한
                          </span>
                        )}
                        {isLower && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#0051CC] text-white">
                            하한
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${colorCls}`}>
                      {fmt(r.price)}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums ${colorCls}`}>
                      {r.prdyVrss >= 0 ? '+' : ''}
                      {fmt(r.prdyVrss)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right tabular-nums font-bold ${colorCls} ${
                        isLimit ? 'underline' : ''
                      }`}
                    >
                      {r.changePercent >= 0 ? '+' : ''}
                      {r.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#555]">
                      {fmt(r.volume)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#999] mt-4 text-center">
        데이터 출처: 한국투자증권 KIS OpenAPI · 장중 5분 캐시
      </p>
    </div>
  );
}
