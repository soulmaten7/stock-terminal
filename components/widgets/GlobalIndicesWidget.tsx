'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface QuoteItem {
  label: string;
  price: string;
  change: string;
  up: boolean;
}

const PLACEHOLDER: QuoteItem[] = [
  { label: 'KOSPI',      price: '—',    change: '—',      up: true },
  { label: 'KOSPI 200',  price: '—',    change: '—',      up: true },
  { label: 'KOSDAQ',     price: '—',    change: '—',      up: true },
  { label: 'S&P 500 선물', price: '—', change: '—',      up: false },
  { label: 'NASDAQ 선물', price: '—',  change: '—',      up: false },
  { label: 'USD/KRW',    price: '—',    change: '—',      up: true },
  { label: 'USD/JPY',    price: '—',    change: '—',      up: true },
  { label: 'WTI 원유',   price: '—',    change: '—',      up: true },
  { label: '미국채 10Y', price: '—',    change: '—',      up: false },
];

export default function GlobalIndicesWidget() {
  const [items, setItems] = useState<QuoteItem[]>(PLACEHOLDER);
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
    <WidgetCard
      title="글로벌 지수·환율·선물·채권"
      subtitle="Yahoo Finance"
      href="/global"
      action={
        loading ? (
          <span className="text-[10px] text-[#BBB]">로딩 중…</span>
        ) : undefined
      }
    >
      <div role="table" aria-label="글로벌 지수 목록">
        {items.map((idx) => (
          <div
            key={idx.label}
            role="row"
            className="flex items-center justify-between px-3 py-2.5 border-b border-[#F0F0F0] hover:bg-[#F8F9FA]"
          >
            <span role="cell" className="text-sm text-[#555]">{idx.label}</span>
            <div className="flex items-center gap-3">
              <span role="cell" className="text-sm font-bold text-black">{idx.price}</span>
              <span
                role="cell"
                className={`text-sm font-bold w-20 text-right ${
                  idx.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'
                }`}
              >
                {idx.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
