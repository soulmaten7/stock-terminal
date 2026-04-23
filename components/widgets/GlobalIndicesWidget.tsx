'use client';

import { useEffect, useState } from 'react';
import WidgetHeader from '@/components/dashboard/WidgetHeader';

// ── compact 모드 (기존 R4 위젯) ──────────────────────────────────────────────

interface CompactQuoteItem {
  label: string;
  price: string;
  change: string;
  up: boolean;
}

const PLACEHOLDER: CompactQuoteItem[] = [
  { label: 'KOSPI',      price: '—', change: '—', up: true },
  { label: 'KOSPI 200',  price: '—', change: '—', up: true },
  { label: 'KOSDAQ',     price: '—', change: '—', up: true },
  { label: 'S&P 500 선물', price: '—', change: '—', up: false },
  { label: 'NASDAQ 선물', price: '—', change: '—', up: false },
  { label: 'USD/KRW',    price: '—', change: '—', up: true },
  { label: 'USD/JPY',    price: '—', change: '—', up: true },
  { label: 'WTI 원유',   price: '—', change: '—', up: true },
  { label: '미국채 10Y', price: '—', change: '—', up: false },
];

function CompactWidget() {
  const [items, setItems] = useState<CompactQuoteItem[]>(PLACEHOLDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      fetch('/api/home/global')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => { if (d.items?.length) setItems(d.items); })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <WidgetHeader
        title="글로벌 지수·환율·선물·채권"
        subtitle="Yahoo Finance"
        href="/global"
        actions={loading ? <span className="text-[10px] text-[#BBB]">로딩 중…</span> : undefined}
      />
      <div role="table" aria-label="글로벌 지수 목록" className="flex-1 overflow-auto">
        {items.map((idx) => (
          <div
            key={idx.label}
            role="row"
            className="flex items-center justify-between px-3 py-2.5 border-b border-[#F0F0F0] hover:bg-[#F8F9FA]"
          >
            <span role="cell" className="text-sm text-[#555]">{idx.label}</span>
            <div className="flex items-center gap-3">
              <span role="cell" className="text-sm font-bold text-black">{idx.price}</span>
              <span role="cell" className={`text-sm font-bold w-20 text-right ${idx.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                {idx.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── expanded 모드 (Section 2 전용) ────────────────────────────────────────────

interface GlobalQuote {
  section: string;
  symbol: string;
  label: string;
  price: number;
  change: number;
  changePercent: number;
}

const EXPANDED_GROUPS = [
  {
    title: '지수',
    items: [
      { symbol: '^GSPC',     label: 'S&P 500' },
      { symbol: '^DJI',      label: 'DOW' },
      { symbol: '^IXIC',     label: 'NASDAQ' },
      { symbol: '^N225',     label: '닛케이' },
      { symbol: '^HSI',      label: '항셍' },
      { symbol: '000001.SS', label: '상하이' },
    ],
  },
  {
    title: '환율',
    items: [
      { symbol: 'USDKRW=X', label: 'USD/KRW' },
      { symbol: 'JPYKRW=X', label: 'JPY/KRW' },
      { symbol: 'EURUSD=X', label: 'EUR/USD' },
      { symbol: 'CNYKRW=X', label: 'CNY/KRW' },
    ],
  },
  {
    title: '원자재',
    items: [
      { symbol: 'CL=F', label: 'WTI' },
      { symbol: 'GC=F', label: '금' },
      { symbol: 'HG=F', label: '구리' },
    ],
  },
  {
    title: '채권',
    items: [
      { symbol: '^TNX', label: '미국채 10Y' },
      // TODO: 한국채 10Y (Yahoo Finance 미제공 — STEP 77+)
    ],
  },
  {
    title: '암호화폐',
    items: [
      { symbol: 'BTC-USD', label: 'Bitcoin' },
      { symbol: 'ETH-USD', label: 'Ethereum' },
    ],
  },
] as const;

function fmtQuote(price: number, symbol: string): string {
  if (!price) return '—';
  // 채권 yield는 소수 3자리
  if (symbol === '^TNX' || symbol === '^FVX' || symbol === '^TYX') return price.toFixed(3) + '%';
  if (price >= 10_000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 100) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return price.toFixed(4);
}

// SVG 스파크라인 — points 없으면 null 반환
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 56, H = 18, PAD = 1;
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * (W - 2 * PAD) + PAD;
      const y = H - PAD - ((v - min) / range) * (H - 2 * PAD);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const up = points[points.length - 1] >= points[0];
  return (
    <svg width={W} height={H} aria-hidden="true">
      <polyline points={coords} fill="none" stroke={up ? '#0ABAB5' : '#FF4D4D'} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function QuoteCell({ label, quote }: { label: string; quote: GlobalQuote | undefined }) {
  const pct = quote?.changePercent ?? 0;
  const up = pct >= 0;
  const pctCls = pct > 0 ? 'text-[#0ABAB5]' : pct < 0 ? 'text-[#FF4D4D]' : 'text-[#888]';
  return (
    <div className="bg-[#FAFAFA] rounded px-2 py-2 min-w-0">
      <div className="text-[9px] text-[#999] truncate mb-0.5">{label}</div>
      <div className="text-xs font-bold tabular-nums text-black leading-tight">
        {quote ? fmtQuote(quote.price, quote.symbol) : '—'}
      </div>
      <div className={`text-[9px] font-bold tabular-nums mt-0.5 ${pctCls}`}>
        {quote ? `${up ? '+' : ''}${pct.toFixed(2)}%` : '—'}
      </div>
    </div>
  );
}

function ExpandedWidget() {
  const [quoteMap, setQuoteMap] = useState<Record<string, GlobalQuote>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      fetch('/api/global')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d?.items) return;
          const map: Record<string, GlobalQuote> = {};
          for (const item of d.items) map[item.symbol] = item;
          setQuoteMap(map);
          setUpdatedAt(d.updatedAt ?? null);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white min-w-0">
      <WidgetHeader
        title="글로벌 지수 · 환율 · 원자재 · 채권 · 암호화폐"
        subtitle={`Yahoo Finance${updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준` : ''}`}
        href="/global"
      />

      {loading ? (
        <div className="flex-1 p-3 grid grid-cols-6 gap-1.5 content-start animate-pulse">
          {Array.from({ length: 17 }).map((_, i) => (
            <div key={i} className="h-14 bg-[#F0F0F0] rounded" />
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3 space-y-3">
          {EXPANDED_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-[9px] font-bold text-[#BBB] tracking-wider uppercase mb-1.5">{group.title}</h4>
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(group.items.length, 2)}, minmax(0, 1fr))` }}>
                {group.items.map((item) => (
                  <QuoteCell key={item.symbol} label={item.label} quote={quoteMap[item.symbol]} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── public export ─────────────────────────────────────────────────────────────

interface Props {
  expanded?: boolean;
  size?: 'large';
}

export default function GlobalIndicesWidget({ expanded, size }: Props) {
  if (expanded) return <ExpandedWidget />;
  return <CompactWidget />;
}
