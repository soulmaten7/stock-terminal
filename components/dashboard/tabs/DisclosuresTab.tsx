'use client';

import { useState, useEffect } from 'react';
import { useSelectedSymbolStore } from '@/stores/selectedSymbolStore';

interface DisclosureItem {
  report_name: string;
  published_at: string | null;
  source_url: string;
  disclosure_type?: string;
  filer_name?: string;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function DisclosuresTab() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const _selected = useSelectedSymbolStore((s) => s.selected);
  const selected = mounted ? _selected : null;
  const [items, setItems] = useState<DisclosureItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [source, setSource] = useState<'DART' | 'SEC' | null>(null);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(false);
    setItems([]);
    const market = selected.market === 'KR' ? 'KR' : 'US';
    const params = market === 'KR'
      ? `symbol=${selected.code}&market=KR&months=6&limit=50`
      : `symbol=${selected.code}&market=US&limit=50`;
    fetch(`/api/stocks/disclosures?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setItems(d?.items ?? []);
        setSource(market === 'KR' ? 'DART' : 'SEC');
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [selected?.code, selected?.market]);

  if (!selected) {
    return <div className="py-8 text-center text-xs text-[#999]">좌측에서 종목을 선택하세요</div>;
  }

  if (loading) return <ListSkeleton count={5} />;
  if (error) return <div className="py-8 text-center text-xs text-[#999]">공시를 불러오지 못했습니다</div>;
  if (!items.length) return <div className="py-8 text-center text-xs text-[#999]">최근 공시가 없습니다</div>;

  return (
    <div className="py-2">
      <div className="text-[10px] text-[#999] mb-2">
        출처: {source === 'SEC' ? 'SEC EDGAR' : 'DART'}{source === 'DART' ? ' (최근 6개월)' : ''}
      </div>
      <ul className="divide-y divide-[#F0F0F0]">
        {items.map((item, i) => (
          <li key={i} className="py-2">
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-[#F9F9F9] -mx-2 px-2 py-1 rounded"
            >
              <div className="text-xs text-black font-medium leading-snug mb-0.5 line-clamp-2">
                {item.report_name}
              </div>
              <div className="text-[10px] text-[#999] flex gap-1.5">
                {item.published_at && <span>{fmtDate(item.published_at)}</span>}
                {item.disclosure_type && item.disclosure_type !== item.report_name && (
                  <><span>·</span><span>{item.disclosure_type}</span></>
                )}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <ul className="py-2 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="border-b border-[#F0F0F0] pb-3 last:border-0 animate-pulse">
          <div className="h-3 bg-[#F0F0F0] rounded w-4/6 mb-1.5" />
          <div className="h-2 bg-[#F0F0F0] rounded w-1/4" />
        </li>
      ))}
    </ul>
  );
}
