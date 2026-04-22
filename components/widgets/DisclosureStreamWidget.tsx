'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface DisclosureItem {
  corp_name: string;
  report_name: string;
  published_at: string;
  source_url: string;
}

type Market = 'KR' | 'US';

function fmtDate(iso: string): string {
  return iso.slice(5).replace('-', '/');
}

export default function DisclosureStreamWidget() {
  const [market, setMarket] = useState<Market>('KR');
  const [items, setItems] = useState<DisclosureItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setItems([]);
    const url = market === 'KR'
      ? '/api/home/disclosures?limit=25'
      : 'https://efts.sec.gov/LATEST/search-index?q=%22material%22&dateRange=custom&startdt=2024-01-01&forms=8-K';

    if (market === 'KR') {
      fetch(url)
        .then((r) => (r.ok ? r.json() : { disclosures: [] }))
        .then((d) => setItems(d.disclosures ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      // US: SEC EDGAR RSS-style recent 8-K filings
      fetch('/api/home/disclosures?market=US&limit=25')
        .then((r) => (r.ok ? r.json() : { disclosures: [] }))
        .then((d) => setItems(d.disclosures ?? []))
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, [market]);

  return (
    <div className="p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-sm font-bold text-[#222]">공시 스트림</h3>
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB]">
          {(['KR', 'US'] as Market[]).map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={`px-3 h-6 text-xs font-bold ${
                market === m ? 'bg-[#0ABAB5] text-white' : 'bg-white text-[#666] hover:bg-[#F3F4F6]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-0">
        {loading && Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="py-2 border-b border-[#F3F4F6]">
            <div className="h-3 w-2/3 bg-[#F0F0F0] animate-pulse rounded mb-1.5" />
            <div className="h-2.5 w-1/3 bg-[#F0F0F0] animate-pulse rounded" />
          </div>
        ))}
        {!loading && items.map((it, i) => (
          <a
            key={`${it.source_url}-${i}`}
            href={it.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2 py-2 border-b border-[#F3F4F6] hover:bg-[#FAFAFA] last:border-0"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#222] leading-snug line-clamp-2 group-hover:text-[#0ABAB5]">
                {it.report_name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-[#555] truncate max-w-[80px]">{it.corp_name}</span>
                <span className="text-[10px] text-[#999]">{fmtDate(it.published_at)}</span>
              </div>
            </div>
            <ExternalLink className="w-3 h-3 text-[#CCC] group-hover:text-[#0ABAB5] shrink-0 mt-0.5" />
          </a>
        ))}
        {!loading && items.length === 0 && (
          <div className="py-8 text-center text-xs text-[#999]">
            {market === 'KR' ? 'DART 공시를 불러올 수 없습니다' : 'SEC 공시를 불러올 수 없습니다'}
          </div>
        )}
      </div>
    </div>
  );
}
