'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils/format';
import type { Disclosure } from '@/types/stock';
import { ExternalLink, ChevronDown } from 'lucide-react';

interface DisclosuresTabProps {
  stockId: number;
  symbol: string;
}

const FILTER_TYPES = [
  { key: 'all', label: '전체' },
  { key: '유상증자', label: '유상증자' },
  { key: '무상증자', label: '무상증자' },
  { key: '자사주', label: '자사주' },
  { key: 'CB발행', label: 'CB발행' },
  { key: '대주주변동', label: '대주주변동' },
  { key: '합병분할', label: '합병분할' },
  { key: '기타', label: '기타' },
] as const;

const PAGE_SIZE = 20;

function getTypeBadgeColor(type: string | null): string {
  switch (type) {
    case '유상증자': return 'bg-red-500/20 text-red-400';
    case '무상증자': return 'bg-green-500/20 text-green-400';
    case '자사주': return 'bg-teal-500/20 text-teal-400';
    case 'CB발행': return 'bg-yellow-500/20 text-yellow-400';
    case '대주주변동': return 'bg-purple-500/20 text-purple-400';
    case '합병분할': return 'bg-orange-500/20 text-orange-400';
    default: return 'bg-dark-800 text-text-secondary';
  }
}

export default function DisclosuresTab({ stockId, symbol }: DisclosuresTabProps) {
  const [disclosures, setDisclosures] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadDisclosures(reset = false) {
    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    const supabase = createClient();
    let query = supabase
      .from('disclosures')
      .select('*')
      .or(`stock_id.eq.${stockId},symbol.eq.${symbol}`)
      .order('published_at', { ascending: false })
      .range(currentOffset, currentOffset + PAGE_SIZE - 1);

    if (filter !== 'all') {
      query = query.eq('disclosure_type', filter);
    }

    const { data } = await query;
    const results = (data as Disclosure[]) ?? [];

    if (reset) {
      setDisclosures(results);
      setOffset(PAGE_SIZE);
    } else {
      setDisclosures((prev) => [...prev, ...results]);
      setOffset(currentOffset + PAGE_SIZE);
    }

    setHasMore(results.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    loadDisclosures(true);
  }, [stockId, symbol, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TYPES.map((ft) => (
          <button
            key={ft.key}
            onClick={() => setFilter(ft.key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === ft.key
                ? 'bg-accent text-white'
                : 'bg-dark-700 text-text-secondary hover:text-text-primary'
            }`}
          >
            {ft.label}
          </button>
        ))}
      </div>

      {disclosures.length === 0 ? (
        <div className="text-center text-text-secondary py-20">
          공시 데이터가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {disclosures.map((d) => (
            <div key={d.id} className="bg-dark-700 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-text-secondary text-xs font-mono-price">
                      {formatDate(d.published_at)}
                    </span>
                    {d.disclosure_type && (
                      <span className={`px-2 py-0.5 text-xs rounded ${getTypeBadgeColor(d.disclosure_type)}`}>
                        {d.disclosure_type}
                      </span>
                    )}
                  </div>
                  <p className="text-text-primary text-sm font-medium">{d.title}</p>
                  {d.ai_summary && (
                    <p className="text-text-secondary text-xs mt-2 leading-relaxed">{d.ai_summary}</p>
                  )}
                </div>
                {d.source_url && (
                  <a
                    href={d.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary hover:text-accent transition-colors shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && disclosures.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => loadDisclosures(false)}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2 bg-dark-700 text-text-secondary hover:text-text-primary rounded-lg border border-border transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <div className="animate-spin w-4 h-4 border-2 border-accent border-t-transparent rounded-full" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            더 불러오기
          </button>
        </div>
      )}
    </div>
  );
}
