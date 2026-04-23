'use client';

import { useEffect, useState } from 'react';
import WidgetHeader from '@/components/dashboard/WidgetHeader';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface NetItem {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  foreignBuy: number;
  institutionBuy: number;
}

type Tab = 'foreign' | 'inst';
type Mode = 'buy' | 'sell';

function fmtBn(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toLocaleString('ko-KR')}`;
}

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function NetBuyTopWidget({ inline = false, size = 'default' }: Props = {}) {
  const [tab, setTab] = useState<Tab>('foreign');
  const [mode, setMode] = useState<Mode>('buy');
  const [data, setData] = useState<{ foreignTop: NetItem[]; institutionTop: NetItem[] }>({
    foreignTop: [],
    institutionTop: [],
  });
  const [loading, setLoading] = useState(true);
  const setSelected = useSelectedSymbolStore((s) => s.setSelected);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kis/investor-rank?sort=${mode}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setData({ foreignTop: d.foreignTop ?? [], institutionTop: d.institutionTop ?? [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode]);

  const items = tab === 'foreign' ? data.foreignTop : data.institutionTop;
  const netKey: 'foreignBuy' | 'institutionBuy' = tab === 'foreign' ? 'foreignBuy' : 'institutionBuy';

  // 막대 정규화: |값|의 최대치를 기준으로
  const maxAbs = Math.max(1, ...items.slice(0, 10).map((x) => Math.abs(x[netKey])));

  const header = (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <button
          onClick={() => setTab('foreign')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            tab === 'foreign' ? 'bg-[#0ABAB5] text-white' : 'text-[#999]'
          }`}
        >
          외국인
        </button>
        <button
          onClick={() => setTab('inst')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            tab === 'inst' ? 'bg-[#0ABAB5] text-white' : 'text-[#999]'
          }`}
        >
          기관
        </button>
      </div>
      <div className="w-px h-3 bg-[#E5E7EB]" />
      <div className="flex gap-1">
        <button
          onClick={() => setMode('buy')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            mode === 'buy' ? 'bg-[#FF3B30] text-white' : 'text-[#999]'
          }`}
        >
          매수
        </button>
        <button
          onClick={() => setMode('sell')}
          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            mode === 'sell' ? 'bg-[#0051CC] text-white' : 'text-[#999]'
          }`}
        >
          매도
        </button>
      </div>
    </div>
  );

  const body = (
    <>
      {loading && (
        <div className="flex items-center justify-center h-20 text-xs text-[#999]">로딩 중…</div>
      )}
      {!loading && (
        <div role="table" aria-label="수급 TOP 목록">
          <div role="rowgroup">
            <div
              role="row"
              className="grid grid-cols-[1fr_110px_70px] px-3 py-1.5 text-xs text-[#999] font-bold border-b border-[#F0F0F0]"
            >
              <span>종목</span>
              <span className="text-right">순{mode === 'buy' ? '매수' : '매도'} (억)</span>
              <span className="text-right">등락</span>
            </div>
          </div>
          <div role="rowgroup">
            {items.slice(0, 10).map((r) => {
              const val = r[netKey];
              const barPct = Math.round((Math.abs(val) / maxAbs) * 100);
              const isBuy = val >= 0;
              const valText = fmtBn(Math.abs(val));
              return (
                <div
                  key={r.symbol}
                  role="row"
                  onClick={() => setSelected({ code: r.symbol, name: r.name, market: 'KR' })}
                  className="grid grid-cols-[1fr_110px_70px] px-3 py-2.5 text-sm border-b border-[#F0F0F0] hover:bg-[#F8F9FA] cursor-pointer"
                >
                  <span className="font-bold text-black truncate">{r.name}</span>
                  <span className="relative pr-1">
                    <span
                      className={`absolute inset-y-1 right-0 rounded ${
                        isBuy ? 'bg-[#FF3B30]/15' : 'bg-[#0051CC]/15'
                      }`}
                      style={{ width: `${barPct}%` }}
                    />
                    <span
                      className={`relative text-right font-bold tabular-nums block ${
                        isBuy ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                      }`}
                    >
                      {isBuy ? '+' : '-'}
                      {valText.replace('+', '').replace('-', '')}
                    </span>
                  </span>
                  <span
                    className={`text-right font-bold tabular-nums ${
                      r.changePercent >= 0 ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                    }`}
                  >
                    {r.changePercent >= 0 ? '+' : ''}
                    {r.changePercent.toFixed(2)}%
                  </span>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="px-3 py-4 text-xs text-[#999] text-center">데이터 없음</div>
            )}
          </div>
        </div>
      )}
    </>
  );

  const widgetHeader = (
    <WidgetHeader
      title="실시간 수급 TOP"
      subtitle="KIS API · 외국인·기관 순매수/매도"
      href={`/net-buy?tab=top&who=${tab}&mode=${mode}`}
      actions={header}
    />
  );

  if (inline) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {widgetHeader}
        <div className="flex-1 overflow-auto">{body}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {widgetHeader}
      <div className="flex-1 overflow-auto">{body}</div>
    </div>
  );
}
