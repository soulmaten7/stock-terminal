'use client';

import { useEffect, useMemo, useState } from 'react';
import { Star, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { getCache, setCache } from '@/lib/clientCache';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import BrokerRanking from './BrokerRanking';

// ETF 행은 r1w..r1y를 가짐(us-etf-performance가 한 번에 줌, 동기).
// 주식 행은 us-list가 현재가·1일·amount만 줌 → 기간 수익률은 periodMap으로 lazy 보강.
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
  amount?: number; // 거래대금(USD) — 정렬 전용(표시 X)
};

// 하위 카테고리 탭 — 미국 시장 기준(주식 | ETF). 둘 다 라이브(각각 별도 라우트 fetch).
type SubTab = 'stock' | 'etf';
const SUBTABS: { key: SubTab; label: string }[] = [
  { key: 'stock', label: '주식' },
  { key: 'etf', label: 'ETF' },
];

// 기간 드롭다운: 현재가 다음 단일 컬럼을 선택 기간으로 표시(1일부터). 1일=changePercent(리스트 행에 있음·non-lazy), 1주일~1년=lazy(periodMap).
type PeriodKey = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';
const PERIODS: { key: PeriodKey; label: string; field: keyof Row }[] = [
  { key: '1d', label: '1일', field: 'changePercent' },
  { key: '1w', label: '1주일', field: 'r1w' },
  { key: '1m', label: '1개월', field: 'r1m' },
  { key: '3m', label: '3개월', field: 'r3m' },
  { key: '6m', label: '6개월', field: 'r6m' },
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
// 하위탭별 데이터 소스 — 주식=전종목 목록(us-list, batch quote / 기간은 lazy), ETF=us-etf-performance(기간 포함).
const ENDPOINTS: Record<SubTab, string> = {
  stock: '/api/yahoo/us-list',
  etf: '/api/yahoo/us-etf-performance',
};
const CACHE_KEYS: Record<SubTab, string> = { stock: 'us-stock-list', etf: 'us-etf' };

async function fetchRows(tab: SubTab): Promise<Row[]> {
  try {
    const j = await (await fetch(ENDPOINTS[tab])).json();
    return ((j.items ?? []) as Row[]).map((r) => ({
      symbol: r.symbol, name: r.name, price: r.price, changePercent: r.changePercent,
      r1w: r.r1w, r1m: r.r1m, r3m: r.r3m, r6m: r.r6m, r1y: r.r1y, amount: r.amount,
    }));
  } catch { return []; }
}

export default function UsMarketBoard({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>(() => getCache<Row[]>(CACHE_KEYS.stock) ?? []);
  const [loading, setLoading] = useState(() => getCache(CACHE_KEYS.stock) === undefined);
  const [period, setPeriod] = useState<PeriodKey>('1d'); // 기본 1일
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc'); // 1일 정렬 방향 토글(긴 기간은 amount 고정이라 무영향)
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  // 주식 기간 수익률 lazy 캐시 — `${sym}|${period}` 키. 보이는 페이지 50종목만 채움. ETF는 미사용.
  const [periodMap, setPeriodMap] = useState<Record<string, number | null>>(
    () => getCache<Record<string, number | null>>('us-stock-periodmap') ?? {}
  );
  const [periodLoading, setPeriodLoading] = useState(false);

  // 탭별 데이터 로드 — 주식/ETF 각각 별도 라우트·캐시 키(서버 30분 캐시 + 클라 메모리 캐시 SWR).
  // 탭 전환 시 해당 탭 캐시를 즉시 표시 후 백그라운드 재검증.
  useEffect(() => {
    let cancelled = false;
    setSearch('');
    setPage(0);
    const key = CACHE_KEYS[tab];
    const cached = getCache<Row[]>(key);
    if (cached) { setRows(cached); setLoading(false); } else { setRows([]); setLoading(true); }
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setCache(key, r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);

  // 관심종목 동기화(로그인 시) — KR과 동일하게 symbol 집합 관리.
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.watchlist) setWatchSet(new Set((j.watchlist as { symbol: string }[]).map((w) => w.symbol)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const toggleWatch = (r: Row) => {
    if (!isLoggedIn) { window.location.href = '/auth/login'; return; }
    const add = !watchSet.has(r.symbol);
    setWatchSet((prev) => { const n = new Set(prev); add ? n.add(r.symbol) : n.delete(r.symbol); return n; });
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: r.symbol, name_ko: r.name, market: 'US', country: 'US', add }),
    }).then((res) => { if (!res.ok) throw new Error('watchlist'); }).catch(() => {
      setWatchSet((prev) => { const n = new Set(prev); add ? n.delete(r.symbol) : n.add(r.symbol); return n; });
    });
  };

  const PAGE_SIZE = 50;
  // 기본=거래대금(amount) 내림차순(최다거래 우선). 드롭다운 '1일' 선택 시 changePercent 정렬(데이터가 리스트 행에 있음).
  // '1주일~1년'은 lazy(periodMap)라 전 행이 안 채워져 정렬 불가 → amount-desc 유지(옵션 A). 검색 필터(티커·이름) 공통.
  const sorted = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q ? rows.filter((r) => r.name.toUpperCase().includes(q) || r.symbol.toUpperCase().includes(q)) : rows;
    if (period === '1d') {
      const dir = sortDir === 'desc' ? -1 : 1;
      return [...base].sort((a, b) => ((a.changePercent ?? 0) - (b.changePercent ?? 0)) * dir);
    }
    return [...base].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }, [rows, search, period, sortDir]);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const periodField = PERIODS.find((p) => p.key === period)?.field ?? 'r1w';

  // 보이는 페이지의 sym 목록(검색+페이지 반영). 의존성 키로 쓰려고 문자열로 고정.
  const visibleSyms = paginated.map((r) => r.symbol);
  const visibleKey = visibleSyms.join(',');

  // 주식 탭 전용 기간 lazy: 보이는 50종목 중 `${sym}|${period}` 미캐시분만 us-quote로 요청 → periodMap 머지.
  // visibleKey 또는 period가 바뀌면 재평가. ETF 탭은 이 effect를 건너뜀(행이 r필드를 직접 가짐).
  useEffect(() => {
    if (tab !== 'stock') return;
    if (period === '1d') return; // 1일은 리스트 행 changePercent 사용 — lazy fetch 불필요
    if (visibleSyms.length === 0) return;
    const need = visibleSyms.filter((s) => periodMap[`${s}|${period}`] === undefined);
    if (need.length === 0) return; // 전부 캐시됨 → 재fetch 없음
    let cancelled = false;
    setPeriodLoading(true);
    fetch(`/api/yahoo/us-quote?syms=${encodeURIComponent(need.join(','))}&period=${period}`)
      .then((r) => r.json())
      .then((j: { rets?: Record<string, number | null> }) => {
        if (cancelled) return;
        setPeriodMap((prev) => {
          const next = { ...prev };
          for (const s of need) next[`${s}|${period}`] = (j.rets?.[s] ?? null);
          setCache('us-stock-periodmap', next);
          return next;
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPeriodLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, visibleKey, period]);

  // 기간 셀 값 통합: 1일=changePercent(리스트 행, non-lazy). ETF 긴 기간=r필드, 주식 긴 기간=periodMap(lazy). undefined=로딩 중(…)·null=데이터 없음(—).
  function periodCell(r: Row): number | null | undefined {
    if (period === '1d') return r.changePercent;
    if (tab === 'etf') return r[periodField] as number | null | undefined;
    return periodMap[`${r.symbol}|${period}`];
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
      {/* 컨트롤 줄: 좌=하위탭+검색(같은 줄) / 우(w-72)=증권사 바로가기 헤더 — KR 미러 */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
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
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="티커·종목명 검색"
              className="w-32 rounded-lg border border-unjong-border bg-unjong-surface px-3 py-1.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent sm:w-48"
            />
            {search && <button type="button" onClick={() => { setSearch(''); setPage(0); }} className="shrink-0 text-xs text-unjong-muted hover:text-unjong-accent">초기화</button>}
          </div>
        </div>
        <div className="hidden w-72 shrink-0 lg:block">
          <p className="text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        </div>
      </div>

      {/* 좌: 종목 표 / 우: 증권사 리스트 — KR 미러(flex gap-4) */}
      <div className="flex gap-4">
        <div className="min-w-0 flex-1 overflow-x-auto">
          {loading ? (
            <div className="space-y-2 py-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded bg-unjong-background" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">{search ? `"${search}" 검색 결과 없음` : '데이터가 없습니다. 잠시 후 다시 시도해 주세요.'}</p>
          ) : (
            <table className="w-full min-w-[320px] table-fixed text-sm sm:min-w-[600px]">
              <thead>
                <tr className="h-[46px] border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="w-8 py-2.5 pl-2 pr-0.5 text-left font-medium sm:px-2">#</th>
                  <th className="w-full py-2.5 pl-0.5 pr-2 text-left font-medium sm:px-2">종목명</th>
                  <th className="w-[104px] whitespace-nowrap px-3 py-2.5 text-right font-medium sm:px-4">현재가</th>
                  {/* 기간 드롭다운(1일부터) — '1일'은 자동 정렬(changePercent), 긴 기간은 표시만(lazy, amount 정렬 유지). KR 미러 */}
                  <th className="w-[116px] whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-medium sm:pr-4">
                    <span className="inline-flex items-center justify-end gap-0.5">
                      <select value={period} onChange={(e) => { setPeriod(e.target.value as PeriodKey); setSortDir('desc'); setPage(0); }} className={`rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none ${tab === 'stock' && periodLoading ? 'opacity-60' : ''}`}>
                        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => { if (period === '1d') setSortDir((d) => (d === 'desc' ? 'asc' : 'desc')); }}
                        aria-label="선택 기간으로 정렬"
                        title={period === '1d' ? '1일 등락순 정렬' : '긴 기간은 거래대금순 고정(표시만)'}
                        className={`ml-1.5 shrink-0 hover:text-unjong-primary ${period === '1d' ? 'text-unjong-accent' : 'cursor-default text-unjong-border'}`}
                      >
                        {period === '1d' ? (sortDir === 'desc' ? <ChevronDown size={16} /> : <ChevronUp size={16} />) : <ArrowUpDown size={16} />}
                      </button>
                    </span>
                  </th>
                  <th className="w-9 px-1 py-2.5 text-center font-medium"><Star size={12} className="mx-auto text-unjong-muted" /></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r, i) => (
                  <tr key={r.symbol} onClick={() => setSelectedStock(r)} className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                    <td className="py-2.5 pl-2 pr-0.5 tabular-nums text-unjong-muted sm:px-2">{page * PAGE_SIZE + i + 1}</td>
                    <td className="py-2.5 pl-0.5 pr-2 sm:px-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <StockLogo code={r.symbol} name={r.name} size={32} />
                        <span className="min-w-0">
                          <span className="font-bold text-unjong-primary">{r.symbol}</span>
                          <span title={r.name} className="ml-1.5 truncate text-xs text-unjong-muted">{r.name}</span>
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums text-unjong-primary sm:px-4">{r.price ? formatPrice(r.price, 'US') : '—'}</td>
                    <td className={`whitespace-nowrap py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums sm:pr-4 ${pctColor(periodCell(r))}`}>{periodCell(r) === undefined ? <span className="text-unjong-muted">…</span> : pct(periodCell(r))}</td>
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
          {/* 페이지네이션 — 숫자 페이지 (KR MarketBoard와 동일 방식) */}
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

        {/* 우측: 증권사 리스트(헤더는 위 컨트롤 줄로 이동) — KR과 동일하게 BrokerRanking 재사용 */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <p className="flex h-[46px] items-center border-b border-unjong-border px-1 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
          <BrokerRanking hideHeader />
        </aside>
      </div>

      {/* 모바일: 증권사 바로가기 (표 아래 — 데스크탑은 우측 aside) — KR 미러 */}
      <div className="mt-5 lg:hidden">
        <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        <p className="border-b border-unjong-border px-1 py-2 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
        <BrokerRanking hideHeader />
      </div>
      {/* 종목 클릭 → 증권사 바텀시트 (모바일 전용) — KR 미러 */}
      {selectedStock && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedStock(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-snug text-unjong-primary">{selectedStock.symbol}</p>
                <p className="font-mono text-xs text-unjong-muted">
                  {selectedStock.name} · {selectedStock.price ? formatPrice(selectedStock.price, 'US') : '—'}
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
