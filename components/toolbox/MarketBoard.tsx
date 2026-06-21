'use client';

import { useEffect, useMemo, useState } from 'react';
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
  return v >= 0 ? 'text-[#F04452]' : 'text-[#3182F6]';
}

async function fetchRows(tab: SubTab): Promise<Row[]> {
  if (tab === 'stock') {
    let raw: Record<string, unknown>[] = [];
    try {
      const j = await (await fetch('/api/krx/ranking?market=all&sort=amount&limit=100')).json();
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

export default function MarketBoard() {
  const [tab, setTab] = useState<SubTab>('stock');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<PeriodKey>('1d');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRows(tab).then((r) => { if (!cancelled) { setRows(r); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tab]);

  const sortField = PERIODS.find((p) => p.key === sortKey)!.field;
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortField] as number | null | undefined;
      const bv = b[sortField] as number | null | undefined;
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === 'desc' ? bv - av : av - bv;
    }).slice(0, 100);
  }, [rows, sortField, sortDir]);

  function clickHeader(k: PeriodKey) {
    if (sortKey === k) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(k); setSortDir('desc'); }
  }

  return (
    <section className="min-w-0">
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">종목·상품</h2>
      </div>

      {/* 컨트롤 줄: 좌=하위탭 / 우(w-72)=증권사 바로가기 헤더 */}
      <div className="mb-2 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {SUBTABS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setTab(s.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${tab === s.key ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'}`}
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
          {loading ? (
            <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>
          ) : sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">데이터가 없습니다. 잠시 후 다시 시도해 주세요.</p>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="px-2 py-2.5 text-left font-medium">#</th>
                  <th className="w-full px-2 py-2.5 text-left font-medium">종목명</th>
                  <th className="whitespace-nowrap px-2 py-2.5 text-right font-medium">현재가</th>
                  {PERIODS.map((p) => (
                    <th key={p.key} className="whitespace-nowrap px-2 py-2.5 text-right font-medium">
                      <button
                        type="button"
                        onClick={() => clickHeader(p.key)}
                        className={`inline-flex items-center gap-0.5 hover:text-unjong-primary ${sortKey === p.key ? 'font-bold text-unjong-accent' : ''}`}
                      >
                        {p.label}{sortKey === p.key ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={r.symbol} className="border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                    <td className="px-2 py-2.5 tabular-nums text-unjong-muted">{i + 1}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <StockLogo code={r.symbol} name={r.name} size={22} />
                        <span className="font-medium text-unjong-primary">{r.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums text-unjong-primary">{r.price ? r.price.toLocaleString() : '—'}</td>
                    {PERIODS.map((p) => {
                      const v = r[p.field] as number | null | undefined;
                      return <td key={p.key} className={`whitespace-nowrap px-2 py-2.5 text-right font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 우측: 증권사 리스트(헤더는 위 컨트롤 줄로 이동) — 스크롤 따라오게 sticky */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-11">
            <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
            <BrokerRanking hideHeader />
          </div>
        </aside>
      </div>
    </section>
  );
}
