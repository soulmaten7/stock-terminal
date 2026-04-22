'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trash2, Star, Plus, ArrowUpDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getWatchlist, removeFromWatchlist, addToWatchlist } from '@/lib/watchlist';

interface PriceData {
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface Row extends PriceData {
  id: number;
  symbol: string;
  createdAt: string;
}

type SortKey = 'name' | 'price' | 'change' | 'changePercent' | 'volume' | 'marketCap' | 'createdAt';

async function fetchPrice(symbol: string): Promise<PriceData> {
  try {
    const r = await fetch(`/api/kis/price?symbol=${symbol}`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return {
      name: d.name ?? symbol,
      price: d.price ?? 0,
      change: d.change ?? 0,
      changePercent: d.changePercent ?? 0,
      volume: d.volume ?? 0,
      marketCap: d.marketCap ?? 0,
    };
  } catch {
    return { name: symbol, price: 0, change: 0, changePercent: 0, volume: 0, marketCap: 0 };
  }
}

function fmtNum(n: number): string {
  return n.toLocaleString('ko-KR');
}

function fmtMarketCap(n: number): string {
  if (n <= 0) return '—';
  const 조 = n / 10000;
  return 조 >= 1 ? `${조.toFixed(2)}조` : `${n.toLocaleString('ko-KR')}억`;
}

function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

export default function WatchlistPageClient() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const loadAll = useCallback(async () => {
    if (!user) { setRows([]); setLoading(false); return; }
    const items = await getWatchlist(user.id);
    if (items.length === 0) { setRows([]); setLoading(false); return; }
    const prices = await Promise.all(
      items.map((it: { symbol: string }) => fetchPrice(it.symbol))
    );
    const merged: Row[] = items.map((it: { id: number; symbol: string; created_at: string }, i: number) => ({
      id: it.id,
      symbol: it.symbol,
      createdAt: it.created_at,
      ...prices[i],
    }));
    setRows(merged);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    loadAll();
    const t = setInterval(loadAll, 10_000);
    return () => clearInterval(t);
  }, [authLoading, loadAll]);

  const handleRemove = async (symbol: string) => {
    if (!user) return;
    const ok = await removeFromWatchlist(user.id, symbol);
    if (ok) setRows((prev) => prev.filter((r) => r.symbol !== symbol));
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    const sym = newSymbol.trim();
    if (!/^\d{6}$/.test(sym)) { setAddError('6자리 숫자 종목코드를 입력하세요'); return; }
    if (rows.some((r) => r.symbol === sym)) { setAddError('이미 등록된 종목입니다'); return; }
    setAdding(true);
    setAddError('');
    const ok = await addToWatchlist(user!.id, sym);
    if (ok) {
      setNewSymbol('');
      await loadAll();
    } else {
      setAddError('추가 실패. 다시 시도해주세요');
    }
    setAdding(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortTh = ({ col, label, align = 'right' }: { col: SortKey; label: string; align?: string }) => (
    <th
      className={`px-4 py-2.5 text-${align} font-bold text-[#666] text-xs cursor-pointer hover:text-black select-none`}
      onClick={() => toggleSort(col)}
    >
      <span className="inline-flex items-center gap-1 justify-end">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === col ? 'text-[#0ABAB5]' : 'text-[#CCC]'}`} />
      </span>
    </th>
  );

  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">관심종목</h1>
        <p className="text-sm text-[#666]">
          등록한 관심종목의 실시간 가격을 10초 간격으로 갱신합니다. KIS API 기반.
        </p>
      </div>

      {authLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[#999]">로딩 중…</div>
      ) : !user ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-10 h-10 text-[#999] mb-4" />
          <p className="text-black font-bold text-lg mb-2">로그인이 필요합니다</p>
          <p className="text-[#999] text-sm mb-4">로그인 후 관심종목을 관리하세요</p>
          <Link href="/auth/login" className="px-6 py-2 bg-[#0ABAB5] text-white font-bold hover:bg-[#088F8C]">
            로그인
          </Link>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[#999]">로딩 중…</div>
      ) : (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
            <span className="text-sm font-bold text-black">내 관심종목 ({rows.length})</span>
            <span className="text-[10px] text-[#999]">KIS API · 10초 갱신</span>
          </div>

          {/* 인라인 추가 폼 */}
          <form onSubmit={handleAdd} className="flex items-center gap-2 px-4 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA]">
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => { setNewSymbol(e.target.value); setAddError(''); }}
              placeholder="종목코드 6자리 (예: 005930)"
              className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-[#E5E7EB] rounded focus:outline-none focus:border-[#0ABAB5]"
              maxLength={6}
            />
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0ABAB5] text-white text-sm font-bold rounded hover:bg-[#088F8C] disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
            {addError && <span className="text-xs text-[#FF3B30]">{addError}</span>}
          </form>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Star className="w-10 h-10 text-[#999] mb-4" />
              <p className="text-black font-bold text-lg mb-2">관심종목이 없습니다</p>
              <p className="text-[#999] text-sm">위 입력창에서 종목코드를 추가하거나 종목 발굴 페이지를 이용하세요</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                    <SortTh col="name" label="종목명" align="left" />
                    <th className="px-4 py-2.5 text-left font-bold text-[#666] text-xs">종목코드</th>
                    <SortTh col="price" label="현재가" />
                    <SortTh col="change" label="전일비" />
                    <SortTh col="changePercent" label="등락률" />
                    <SortTh col="volume" label="거래량" />
                    <SortTh col="marketCap" label="시가총액" />
                    <SortTh col="createdAt" label="추가일" />
                    <th className="px-4 py-2.5 text-center font-bold text-[#666] text-xs w-12">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r) => (
                    <tr key={r.id} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                      <td className="px-4 py-2.5">
                        <Link href={`/stocks/${r.symbol}`} className="font-bold text-black hover:text-[#0ABAB5]">
                          {r.name}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-[#999] text-xs font-mono">{r.symbol}</td>
                      <td className="px-4 py-2.5 text-right text-[#333]">
                        {r.price > 0 ? fmtNum(r.price) : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${r.change >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                        {r.price > 0 ? `${r.change >= 0 ? '+' : ''}${fmtNum(r.change)}` : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-bold ${r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                        {r.changePercent >= 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#666] text-xs">
                        {r.volume > 0 ? fmtNum(r.volume) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#333]">
                        {fmtMarketCap(r.marketCap)}
                      </td>
                      <td className="px-4 py-2.5 text-[#999] text-xs">{fmtDate(r.createdAt)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => handleRemove(r.symbol)}
                          className="text-[#999] hover:text-[#FF3B30] p-1"
                          aria-label="관심종목 제거"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
