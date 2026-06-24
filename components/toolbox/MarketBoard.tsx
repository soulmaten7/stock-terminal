'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star, X } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import BrokerRanking from './BrokerRanking';

type Row = {
  symbol: string;
  name: string;
  price: number;
  changePercent: number; // 1일
  r1w?: number | null;
  r1m?: number | null;
  r3m?: number | null;
  r6m?: number | null;
  r1y?: number | null;
};

type SubTab = 'stock' | 'etf' | 'etn' | 'reit';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
  { key: 'etn', label: 'ETN' },
  { key: 'reit', label: '리츠' },
];

type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row; hideSm?: boolean }[] = [
  { key: '1d', label: '1일', field: 'changePercent' },
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m', hideSm: true },
  { key: '3m', label: '3개월', field: 'r3m', hideSm: true },
  { key: '6m', label: '6개월', field: 'r6m', hideSm: true },
  { key: '1y', label: '1년', field: 'r1y' },
];

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}

async function fetchRows(tab: SubTab): Promise<Row[]> {
  if (tab === 'stock') {
    let raw: Record<string, unknown>[] = [];
    try {
      const j = await (await fetch('/api/krx/ranking?market=all&sort=amount&limit=2600')).json();
      raw = (j.stocks ?? []) as Record<string, unknown>[];
    } catch { raw = []; }
    if (raw.length === 0) {
      try {
        const j = await (await fetch('/api/kis/volume-rank?market=all&sort=amount&limit=100')).json();
        raw = (j.stocks ?? j.items ?? []) as Record<string, unknown>[];
      } catch { raw = []; }
    }
    const rows: Row[] = raw.map((s) => ({
      symbol: String(s.symbol ?? ''),
      name: String(s.name ?? ''),
      price: Number(s.price ?? 0),
      changePercent: Number(s.changePercent ?? 0),
    }));
    try {
      const j = await (await fetch('/api/yahoo/kr-performance')).json();
      const map: Record<string, Row> = {};
      for (const it of (j.items ?? []) as Row[]) if (it.symbol) map[String(it.symbol)] = it;
      return rows.map((r) => {
        const p = map[r.symbol];
        return p ? { ...r, r1w: p.r1w, r1m: p.r1m, r3m: p.r3m, r6m: p.r6m, r1y: p.r1y } : r;
      });
    } catch { return rows; }
  }
  const api = tab === 'etf' ? '/api/krx/etf-performance' : tab === 'etn' ? '/api/krx/etn-performance' : '/api/yahoo/reit-performance';
  try {
    const j = await (await fetch(api)).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y,
    }));
  } catch { return []; }
}

export default function MarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>('market:stock') ?? []);
  const [loading, setLoading] = useState(() => getCache('market:stock') === undefined);
  const [sortKey, setSortKey] = useState<PeriodKey | 'amount'>('amount');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [mobilePeriod, setMobilePeriod] = useState<PeriodKey>('1d');
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => {
        if (j.watchlist) setWatchSet(new Set((j.watchlist as { symbol: string }[]).map((w) => w.symbol)));
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const toggleWatch = (r: Row) => {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    const add = !watchSet.has(r.symbol);
    setWatchSet((prev) => { const n = new Set(prev); add ? n.add(r.symbol) : n.delete(r.symbol); return n; });
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: r.symbol, name_ko: r.name, market: 'KRX', country: 'KR', add }),
    }).catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    const ck = 'market:' + tab;
    const cached = getCache<Row[]>(ck);
    if (cached) { setRows(cached); setLoading(false); } else { setLoading(true); }
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setCache(ck, r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);

  const sortField = sortKey === 'amount' ? null : PERIODS.find((p) => p.key === sortKey)!.field;
  const mobileField = PERIODS.find((p) => p.key === mobilePeriod)!.field;
  const PAGE_SIZE = 50;
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    if (!sortField) return base;
    return [...base].sort((a, b) => {
      const av = a[sortField] as number | null | undefined;
      const bv = b[sortField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [rows, sortField, sortDir, search]);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  function clickHeader(k: PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  function pageNumbers(): (number | '…')[] {
    const out: (number | '…')[] = [];
    const cur = page + 1;
    const win = 2;
    const start = Math.max(1, cur - win);
    const end = Math.min(totalPages, cur + win);
    if (start > 1) { out.push(1); if (start > 2) out.push('…'); }
    for (let i = start; i <= end; i++) out.push(i);
    if (end < totalPages) { if (end < totalPages - 1) out.push('…'); out.push(totalPages); }
    return out;
  }

  return (
    <section className="min-w-0">
      {/* 컨트롤 줄: 좌=하위탭 / 우(w-72)=증권사 바로가기 헤더 */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {SUBTABS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setTab(s.key)}
              className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors sm:py-1.5 ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="hidden w-72 shrink-0 lg:block">
          <p className="text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        </div>
      </div>

      {/* 좌: 종목 표 / 우: 증권사 순위 (기존 미리보기 자리) */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          {/* 검색 */}
          <div className="mb-2 flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="종목명·코드 검색"
              className="w-full max-w-xs rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="text-xs text-unjong-muted hover:text-unjong-accent">초기화</button>}
          </div>
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">{search ? `"${search}" 검색 결과 없음` : '데이터가 없습니다. 잠시 후 다시 시도해 주세요.'}</p>
          ) : (
            <table className="w-full min-w-[320px] table-fixed text-sm sm:min-w-[760px]">
              <thead>
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">
                    <button type="button" onClick={() => { setSortKey('amount'); setSortDir('desc'); }} title="거래대금순" className={`hover:text-unjong-primary ${sortKey === 'amount' ? 'font-bold text-unjong-accent' : ''}`}>#</button>
                  </th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
                  <th className="w-[88px] whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                  <th className="w-[84px] whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-medium sm:hidden">
                    <select value={mobilePeriod} onChange={(e) => setMobilePeriod(e.target.value as PeriodKey)} className="rounded border border-unjong-border bg-unjong-surface px-1 py-1 text-xs font-medium text-unjong-primary outline-none">
                      {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                    </select>
                  </th>
                  {PERIODS.map((p) => (
                    <th key={p.key} className="hidden w-[84px] whitespace-nowrap px-2 py-2.5 text-right font-medium sm:table-cell">
                      <button
                        type="button"
                        onClick={() => clickHeader(p.key)}
                        className={`inline-flex items-center gap-0.5 hover:text-unjong-primary ${sortKey === p.key ? 'font-bold text-unjong-accent' : ''}`}
                      >
                        {p.label}{sortKey === p.key ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
                      </button>
                    </th>
                  ))}
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r.symbol} onClick={() => setSelectedStock(r)} className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <StockLogo code={r.symbol} name={r.name} size={24} />
                        <span className="truncate font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{r.price ? r.price.toLocaleString() : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-1 pr-2 text-right font-semibold tabular-nums sm:hidden ${pctColor(r[mobileField] as number | null | undefined)}`}>{pct(r[mobileField] as number | null | undefined)}</td>
                    {PERIODS.map((p) => {
                      const v = r[p.field] as number | null | undefined;
                      return <td key={p.key} className={`hidden whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums sm:table-cell ${pctColor(v)}`}>{pct(v)}</td>;
                    })}
                    <td className="w-9 px-1 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                        aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
                        className={`transition-colors ${watchSet.has(r.symbol) ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
                      >
                        <Star size={14} fill={watchSet.has(r.symbol) ? 'currentColor' : 'none'} className="mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* 페이지네이션 — 숫자 페이지 (리딩방과 동일 방식) */}
          {!loading && sorted.length > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-center gap-1 border-t border-unjong-border px-2 py-3 text-xs">
              <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">←</button>
              {pageNumbers().map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="px-1 text-unjong-muted">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage((n as number) - 1)}
                    className={`h-7 min-w-[1.75rem] rounded px-1 tabular-nums transition-colors ${page === (n as number) - 1 ? 'bg-unjong-primary font-bold text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
                  >
                    {n}
                  </button>
                )
              )}
              <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} className="rounded px-2 py-1 text-unjong-muted hover:bg-unjong-background disabled:opacity-30">→</button>
              <span className="ml-2 text-unjong-muted">총 {sorted.length.toLocaleString()} 종목</span>
            </div>
          )}
        </div>

        {/* 우측: 증권사 리스트(헤더는 위 컨트롤 줄로 이동) — 스크롤 따라오게 sticky */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
      </div>

      {/* 모바일: 증권사 바로가기 (표 아래 — 데스크탑은 우측 aside) */}
      <div className="mt-5 lg:hidden">
        <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        <p className="border-b border-unjong-border px-1 py-2 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
        <BrokerRanking hideHeader />
      </div>
      {/* 종목 클릭 → 증권사 바로가기 (모바일 전용 — PC는 우측 리스트로 한눈에 보임) */}
      {selectedStock && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedStock(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-unjong-primary">{selectedStock.name}</p>
                <p className="font-mono text-xs text-unjong-muted">
                  {selectedStock.symbol} · {selectedStock.price ? selectedStock.price.toLocaleString() : '—'}
                  <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                </p>
              </div>
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
            <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
            <BrokerRanking hideHeader />
          </div>
        </div>
      )}
    </section>
  );
}
