'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface NetItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
}

type Who = 'foreign' | 'inst' | 'combined';
type Mode = 'buy' | 'sell';
type Market = 'all' | 'kospi' | 'kosdaq';

const WHO_LABELS: Record<Who, string> = {
  foreign: '외국인',
  inst: '기관',
  combined: '합산',
};

const MARKET_LABELS: Record<Market, string> = {
  all: '전체',
  kospi: 'KOSPI',
  kosdaq: 'KOSDAQ',
};

function fmtBn(val: number): string {
  return `${val >= 0 ? '+' : ''}${val.toLocaleString('ko-KR')}`;
}

function fmtPrice(val: number): string {
  return val.toLocaleString('ko-KR');
}

export default function TopTab() {
  const sp = useSearchParams();
  const initWho = (['foreign', 'inst', 'combined'].includes(sp.get('who') || '')
    ? sp.get('who')
    : 'combined') as Who;
  const initMode = sp.get('mode') === 'sell' ? 'sell' : 'buy';
  const initMarket = (['all', 'kospi', 'kosdaq'].includes(sp.get('market') || '')
    ? sp.get('market')
    : 'all') as Market;

  const [who, setWho] = useState<Who>(initWho);
  const [mode, setMode] = useState<Mode>(initMode);
  const [market, setMarket] = useState<Market>(initMarket);
  const [rows, setRows] = useState<NetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/kis/investor-rank?market=${market}&sort=${mode}`);
      if (!res.ok) throw new Error('load fail');
      const d = await res.json();
      const foreignTop: NetItem[] = d.foreignTop ?? [];
      const institutionTop: NetItem[] = d.institutionTop ?? [];
      const combined: NetItem[] = d.combined ?? [];
      const picked = who === 'foreign' ? foreignTop : who === 'inst' ? institutionTop : combined;
      setRows(picked);
    } catch {
      setError(true);
      setRows([]);
    }
    setLoading(false);
  }, [who, mode, market]);

  useEffect(() => {
    load();
  }, [load]);

  const netKey: 'foreignBuy' | 'institutionBuy' | null =
    who === 'foreign' ? 'foreignBuy' : who === 'inst' ? 'institutionBuy' : null;
  const buyColor = mode === 'buy' ? 'text-[#FF3B30]' : 'text-[#0051CC]';

  return (
    <div>
      {/* 컨트롤 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        {/* 투자자 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(WHO_LABELS) as Who[]).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWho(w)}
              className={`text-xs font-bold px-3 py-2 transition-colors ${
                who === w
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {WHO_LABELS[w]}
            </button>
          ))}
        </div>

        {/* 매수/매도 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={() => setMode('buy')}
            className={`text-xs font-bold px-3 py-2 transition-colors ${
              mode === 'buy' ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            순매수
          </button>
          <button
            type="button"
            onClick={() => setMode('sell')}
            className={`text-xs font-bold px-3 py-2 transition-colors ${
              mode === 'sell' ? 'bg-[#0051CC] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            순매도
          </button>
        </div>

        {/* 시장 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(MARKET_LABELS) as Market[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className={`text-xs font-medium px-3 py-2 transition-colors ${
                market === m
                  ? 'bg-[#FF9500] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {MARKET_LABELS[m]}
            </button>
          ))}
        </div>

        {loading && <span className="text-xs text-[#888]">로딩 중…</span>}
      </div>

      <p className="text-sm text-[#666] mb-3">
        {WHO_LABELS[who]} · {mode === 'buy' ? '순매수' : '순매도'} · {MARKET_LABELS[market]} 상위
        20종목. KIS API FHPTJ04400000 · 단위: 억원.
      </p>

      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="px-4 py-2.5 text-right w-14">순위</th>
                <th className="px-4 py-2.5 text-left w-24">종목코드</th>
                <th className="px-4 py-2.5 text-left">종목명</th>
                <th className="px-4 py-2.5 text-right w-32">외국인 순매수</th>
                <th className="px-4 py-2.5 text-right w-32">기관 순매수</th>
                <th className="px-4 py-2.5 text-right w-24">현재가</th>
                <th className="px-4 py-2.5 text-right w-24">등락률</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">
                    로딩 중…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#FF3B30]">
                    데이터를 불러오지 못했습니다
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-[#999]">
                    데이터 없음
                  </td>
                </tr>
              )}
              {!loading && !error &&
                rows.map((r, i) => {
                  const highlight = netKey ? r[netKey] : r.foreignBuy + r.institutionBuy;
                  return (
                    <tr
                      key={r.symbol}
                      className={`border-t border-[#F0F0F0] hover:bg-[#FAFAFA] ${
                        highlight > 0 ? '' : highlight < 0 ? '' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-right text-[#888] tabular-nums">{i + 1}</td>
                      <td className="px-4 py-2.5 text-[#333] tabular-nums text-xs">{r.symbol}</td>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/chart?symbol=${r.symbol}`}
                          className="font-bold text-black hover:text-[#0ABAB5] hover:underline"
                        >
                          {r.name}
                        </Link>
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                          r.foreignBuy >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                        } ${who === 'foreign' ? buyColor : ''}`}
                      >
                        {fmtBn(r.foreignBuy)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                          r.institutionBuy >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                        } ${who === 'inst' ? buyColor : ''}`}
                      >
                        {fmtBn(r.institutionBuy)}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#333] tabular-nums">
                        {fmtPrice(r.price)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                          r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                        }`}
                      >
                        {r.changePercent >= 0 ? '+' : ''}
                        {r.changePercent.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
