'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flame } from 'lucide-react';

interface VolumeItem {
  rank: number;
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  spike: number;
  tradeAmount: number;
}

type Market = 'all' | 'kospi' | 'kosdaq';
type Sort = 'spike' | 'volume' | 'amount';

const MARKET_LABELS: Record<Market, string> = {
  all: '전체',
  kospi: 'KOSPI',
  kosdaq: 'KOSDAQ',
};

const SORT_LABELS: Record<Sort, string> = {
  spike: '거래증가율',
  volume: '거래량',
  amount: '거래대금',
};

const fmt = (n: number) => n.toLocaleString('ko-KR');

const fmtAmount = (n: number) => {
  if (!n) return '—';
  if (n >= 1_0000_0000_0000) return `${(n / 1_0000_0000_0000).toFixed(1)}조`;
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(1)}만`;
  return n.toLocaleString();
};

export default function MoversVolumePageClient() {
  const sp = useSearchParams();
  const initMarket = (['all', 'kospi', 'kosdaq'].includes(sp.get('market') || '')
    ? sp.get('market')
    : 'all') as Market;
  const initSort = (['spike', 'volume', 'amount'].includes(sp.get('sort') || '')
    ? sp.get('sort')
    : 'spike') as Sort;

  const [market, setMarket] = useState<Market>(initMarket);
  const [sort, setSort] = useState<Sort>(initSort);
  const [items, setItems] = useState<VolumeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kis/volume-rank?market=${market}&sort=${sort}&limit=30`);
      const data = await res.json();
      setItems(data.stocks ?? []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }, [market, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const maxSpike = Math.max(5, ...items.map((x) => x.spike));

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
          <Flame className="w-6 h-6 text-[#FF9500]" />
          거래량 급등 순위
        </h1>
        <p className="text-sm text-[#666] mt-1">
          당일 거래증가율·거래량·거래대금 상위 30종목 · KIS API FHPST01710000
        </p>
      </div>

      {/* 컨트롤 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
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

        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`text-xs font-bold px-3 py-2 transition-colors ${
                sort === s
                  ? 'bg-[#FF9500] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>

        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="text-right px-4 py-2.5 w-14">순위</th>
                <th className="text-left px-4 py-2.5 w-24">종목코드</th>
                <th className="text-left px-4 py-2.5">종목명</th>
                <th className="text-right px-4 py-2.5 w-28">현재가</th>
                <th className="text-right px-4 py-2.5 w-24">등락률</th>
                <th className="text-right px-4 py-2.5 w-28">거래량</th>
                <th className="text-right px-4 py-2.5 w-28">평균거래량</th>
                <th className="text-left px-4 py-2.5 w-36">배수</th>
                <th className="text-right px-4 py-2.5 w-24">거래대금</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-[#999]">
                    데이터 없음
                  </td>
                </tr>
              )}
              {items.map((r) => {
                const barPct = Math.min(100, Math.round((r.spike / maxSpike) * 100));
                const isExtreme = r.spike >= 10;
                const isHigh = r.spike >= 5 && r.spike < 10;
                const barColor = isExtreme
                  ? 'bg-[#FF3B30]/30'
                  : isHigh
                  ? 'bg-[#FF9500]/25'
                  : 'bg-[#0ABAB5]/20';
                const spikeTextColor = isExtreme
                  ? 'text-[#FF3B30]'
                  : isHigh
                  ? 'text-[#FF9500]'
                  : 'text-[#0ABAB5]';
                const priceColor = r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]';

                return (
                  <tr
                    key={r.symbol}
                    className="border-t border-[#F0F0F0] hover:bg-[#FAFAFA]"
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
                        {isExtreme && (
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white">
                            급등
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${priceColor}`}>
                      {fmt(r.price)}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${priceColor}`}>
                      {r.changePercent >= 0 ? '+' : ''}
                      {r.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#333]">
                      {fmt(r.volume)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#888]">
                      {fmt(r.avgVolume)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="relative h-5 flex items-center">
                        <div
                          className={`absolute inset-y-0 left-0 rounded ${barColor}`}
                          style={{ width: `${barPct}%` }}
                        />
                        <span className={`relative pl-1.5 font-bold tabular-nums ${spikeTextColor}`}>
                          {r.spike > 0 ? `${r.spike}x` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-[#555]">
                      {fmtAmount(r.tradeAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#999] mt-4 text-center">
        데이터 출처: 한국투자증권 KIS OpenAPI · 장중 5분 캐시 · 장마감 후 배수는 1.0x 로 수렴
      </p>
    </div>
  );
}
