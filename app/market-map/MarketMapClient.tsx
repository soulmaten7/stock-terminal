'use client';

import { useEffect, useState } from 'react';
import WidgetHeader from '@/components/dashboard/WidgetHeader';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface Sector { sector: string; change: number; count: number; }
interface Stock { symbol: string; name: string; }

type Market = 'KR' | 'US';

function heatColor(change: number): string {
  const c = Math.max(-5, Math.min(5, change));
  if (c > 0) {
    const a = Math.round((c / 5) * 200 + 30);
    return `rgba(255,59,48,${(a / 255).toFixed(2)})`;
  }
  if (c < 0) {
    const a = Math.round((Math.abs(c) / 5) * 200 + 30);
    return `rgba(0,81,204,${(a / 255).toFixed(2)})`;
  }
  return '#F3F4F6';
}

function textColor(change: number): string {
  return Math.abs(change) > 1.5 ? '#FFFFFF' : '#222222';
}

export default function MarketMapClient() {
  const [market, setMarket] = useState<Market>('KR');
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [sectorStocks, setSectorStocks] = useState<Stock[]>([]);
  const [stocksLoading, setStocksLoading] = useState(false);
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  useEffect(() => {
    setLoading(true);
    setSelectedSector(null);
    setSectorStocks([]);
    fetch(`/api/home/sectors?market=${market}`)
      .then((r) => (r.ok ? r.json() : { sectors: [] }))
      .then((d) => setSectors(d.sectors ?? []))
      .catch(() => setSectors([]))
      .finally(() => setLoading(false));
  }, [market]);

  const openSector = (sector: string) => {
    setSelectedSector(sector);
    setStocksLoading(true);
    if (market === 'KR') {
      fetch(`/api/stocks/screener?limit=100&orderBy=market_cap&order=desc`)
        .then((r) => (r.ok ? r.json() : { stocks: [] }))
        .then((d) => {
          const filtered = (d.stocks ?? [])
            .filter((s: Record<string, unknown>) => s.sector === sector)
            .slice(0, 10)
            .map((s: Record<string, unknown>) => ({
              symbol: String(s.symbol ?? ''),
              name: String(s.name_ko ?? ''),
            }));
          setSectorStocks(filtered);
        })
        .catch(() => setSectorStocks([]))
        .finally(() => setStocksLoading(false));
    } else {
      setSectorStocks([]);
      setStocksLoading(false);
    }
  };

  const marketToggle = (
    <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB]">
      {(['KR', 'US'] as Market[]).map((m) => (
        <button
          key={m}
          onClick={() => setMarket(m)}
          className={`px-3 h-7 text-xs font-bold ${
            market === m ? 'bg-[#0ABAB5] text-white' : 'bg-white text-[#666] hover:bg-[#F3F4F6]'
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-[1600px] min-w-[1280px] mx-auto px-4 py-4">
      <div className="bg-white border border-[#E5E7EB]">
        <WidgetHeader
          title="섹터 지도"
          subtitle={market === 'KR' ? 'KRX 섹터 ETF' : 'SPDR 섹터 ETF'}
          actions={marketToggle}
        />

        <div className="grid grid-cols-12 gap-0 min-h-[600px]">
          {/* 좌측: 히트맵 그리드 */}
          <div className="col-span-8 border-r border-[#E5E7EB] p-4">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-28 bg-[#F0F0F0] animate-pulse rounded" />
                ))}
              </div>
            ) : sectors.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-sm text-[#999]">데이터 없음</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                {sectors.map((s) => (
                  <button
                    key={s.sector}
                    onClick={() => openSector(s.sector)}
                    title={`${s.sector} · ${s.change >= 0 ? '+' : ''}${s.change.toFixed(2)}% · ${s.count}개 종목`}
                    className={`h-28 rounded p-3 flex flex-col justify-between text-left transition-all hover:scale-[1.02] ${
                      selectedSector === s.sector ? 'ring-2 ring-[#0ABAB5]' : ''
                    }`}
                    style={{ background: heatColor(s.change) }}
                  >
                    <span className="text-xs font-semibold leading-tight" style={{ color: textColor(s.change) }}>
                      {s.sector}
                    </span>
                    <div style={{ color: textColor(s.change) }}>
                      <div className="text-2xl font-bold tabular-nums">
                        {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                      </div>
                      <div className="text-[10px] opacity-80">{s.count}개 종목</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 섹터별 종목 리스트 */}
          <div className="col-span-4 p-4">
            <div className="text-xs font-bold text-[#222] mb-3">
              {selectedSector ? `${selectedSector} — 주요 종목` : '섹터를 선택하세요'}
            </div>
            {stocksLoading && <div className="text-xs text-[#999]">로딩 중...</div>}
            {!stocksLoading && selectedSector && sectorStocks.length === 0 && (
              <div className="text-xs text-[#999]">해당 섹터 종목 데이터 없음</div>
            )}
            {!stocksLoading && sectorStocks.length > 0 && (
              <ol className="space-y-1">
                {sectorStocks.map((stock, i) => (
                  <li
                    key={stock.symbol}
                    onClick={() => setSelected({ code: stock.symbol, name: stock.name, market: 'KR' })}
                    className="flex items-center gap-2 py-2 px-2 rounded hover:bg-[#F3F4F6] cursor-pointer"
                  >
                    <span className="text-[#999] text-xs w-5">{i + 1}</span>
                    <span className="font-medium text-xs text-black flex-1 truncate">{stock.name}</span>
                    <span className="text-[10px] text-[#999] tabular-nums">{stock.symbol}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
