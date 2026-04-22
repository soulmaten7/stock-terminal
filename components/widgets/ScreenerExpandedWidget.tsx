'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';
import WidgetHeader from '@/components/dashboard/WidgetHeader';

const PRESETS = [
  { key: 'low-per',   label: '저PER',  url: '/api/stocks/screener?maxPER=15&limit=10&orderBy=per&order=asc' },
  { key: 'high-divi', label: '고배당',  url: '/api/stocks/screener?minYield=3&limit=10&orderBy=dividend_yield&order=desc' },
  { key: 'gainers',   label: '급등',    url: '/api/kis/movers?dir=up&limit=10' },
  { key: 'losers',    label: '급락',    url: '/api/kis/movers?dir=down&limit=10' },
  { key: 'blue-chip', label: '우량주',  url: '/api/stocks/screener?minCap=10000000000000&limit=10&orderBy=market_cap&order=desc' },
  { key: 'small-cap', label: '초소형', url: '/api/stocks/screener?maxCap=100000000000&limit=10&orderBy=market_cap&order=asc' },
] as const;

type PresetKey = typeof PRESETS[number]['key'];

type Row = {
  code: string;
  name: string;
  price: number | null;
  changePct: number | null;
  extra: string;
};

function normalizeScreener(d: Record<string, unknown>): Row[] {
  const stocks = (d.stocks ?? []) as Record<string, unknown>[];
  return stocks.map((s) => ({
    code: (s.symbol as string) ?? '',
    name: (s.name_ko ?? s.name_en ?? '') as string,
    price: null,
    changePct: null,
    extra: s.per != null ? `PER ${Number(s.per).toFixed(1)}` :
           s.dividend_yield != null ? `배당 ${Number(s.dividend_yield).toFixed(2)}%` :
           s.market_cap != null ? `${(Number(s.market_cap) / 1e12).toFixed(1)}조` : '—',
  }));
}

function normalizeMovers(d: Record<string, unknown>): Row[] {
  const items = (d.items ?? []) as Record<string, unknown>[];
  return items.map((m) => ({
    code: (m.symbol as string) ?? '',
    name: (m.name as string) ?? '',
    price: (m.price as number) ?? null,
    changePct: (m.changePercent as number) ?? null,
    extra: (m.priceText as string) ?? '',
  }));
}

export default function ScreenerExpandedWidget() {
  const [active, setActive] = useState<PresetKey>('low-per');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  useEffect(() => {
    const preset = PRESETS.find((p) => p.key === active)!;
    setLoading(true);
    fetch(preset.url)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: Record<string, unknown>) => {
        if ('stocks' in d) setRows(normalizeScreener(d));
        else if ('items' in d) setRows(normalizeMovers(d));
        else setRows([]);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [active]);

  const filtered = search.trim()
    ? rows.filter((r) => r.name.includes(search) || r.code.includes(search))
    : rows;

  const searchInput = (
    <div className="flex items-center gap-1 border border-[#E5E7EB] rounded px-2">
      <Search className="w-3.5 h-3.5 text-[#999]" />
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="종목 검색"
        className="w-28 h-6 text-xs outline-none"
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader title="종목 발굴" href="/screener" actions={searchInput} />
      <div className="px-3 py-2">
      <div className="flex gap-1 mb-3 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActive(p.key)}
            className={`px-3 h-7 text-xs rounded border ${
              active === p.key
                ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]'
                : 'bg-white text-[#444] border-[#E5E7EB] hover:bg-[#F3F4F6]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#666] border-b border-[#E5E7EB]">
            <th className="text-left py-1.5 w-7 font-normal">#</th>
            <th className="text-left font-normal">종목명</th>
            <th className="text-left w-20 font-normal">코드</th>
            <th className="text-right w-24 font-normal">현재가</th>
            <th className="text-right w-20 font-normal">등락</th>
            <th className="text-right w-28 font-normal">기타</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={6} className="text-center py-4 text-[#999]">로딩 중…</td></tr>
          )}
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={6} className="text-center py-4 text-[#999]">데이터 없음</td></tr>
          )}
          {!loading && filtered.map((r, i) => (
            <tr
              key={r.code}
              onClick={() => r.code && setSelected({ code: r.code, name: r.name, market: 'KR' })}
              className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] cursor-pointer"
            >
              <td className="py-1.5 text-[#999]">{i + 1}</td>
              <td className="truncate max-w-[140px] font-medium">{r.name}</td>
              <td className="text-[#666] tabular-nums">{r.code}</td>
              <td className="text-right tabular-nums">{r.price != null ? r.price.toLocaleString() : '—'}</td>
              <td className={`text-right tabular-nums font-bold ${
                r.changePct == null ? 'text-[#999]' :
                r.changePct >= 0 ? 'text-[#0ABAB5]' : 'text-[#FF4D4D]'
              }`}>
                {r.changePct != null
                  ? `${r.changePct >= 0 ? '+' : ''}${r.changePct.toFixed(2)}%`
                  : '—'}
              </td>
              <td className="text-right text-[#666]">{r.extra}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
