'use client';

/**
 * DisclosuresTab — DART 공시 라이브 조회.
 *
 * 기존 V2: `disclosures` DB 테이블 조회 (시딩 파이프라인 미비로 실질 빈 상태)
 * V3: `/api/stocks/disclosures?symbol=...` 로 DART list.json 라이브 호출 — 시딩 불요
 */

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils/format';
import { ExternalLink, ChevronDown } from 'lucide-react';

interface DisclosuresTabProps {
  stockId: number; // 호환용 — 이번 라이브 fetch 에선 미사용
  symbol: string;
}

type DisclosureItem = {
  rcept_no: string;
  report_name: string;
  disclosure_type: string;
  filer_name: string;
  published_at: string | null;
  remark: string;
  corp_name: string;
  source_url: string;
};

const FILTER_TYPES = [
  { key: 'all', label: '전체' },
  { key: '정기보고', label: '정기보고' },
  { key: '주요사항', label: '주요사항' },
  { key: '유상증자', label: '유상증자' },
  { key: '무상증자', label: '무상증자' },
  { key: '자사주', label: '자사주' },
  { key: 'CB발행', label: 'CB발행' },
  { key: '대주주변동', label: '대주주변동' },
  { key: '합병분할', label: '합병분할' },
  { key: '감사·재무', label: '감사·재무' },
  { key: 'IR', label: 'IR' },
  { key: '기타', label: '기타' },
] as const;

const PAGE_SIZE = 20;

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case '유상증자': return 'bg-[#FF3B30]/10 text-[#FF3B30]';
    case '무상증자': return 'bg-green-500/10 text-green-600';
    case '자사주': return 'bg-[#0ABAB5]/10 text-[#0ABAB5]';
    case 'CB발행': return 'bg-yellow-500/10 text-yellow-600';
    case '대주주변동': return 'bg-purple-500/10 text-purple-600';
    case '합병분할': return 'bg-orange-500/10 text-orange-600';
    case '정기보고': return 'bg-[#007AFF]/10 text-[#007AFF]';
    case '주요사항': return 'bg-[#F59E0B]/10 text-[#F59E0B]';
    case '감사·재무': return 'bg-slate-500/10 text-slate-600';
    case 'IR': return 'bg-indigo-500/10 text-indigo-600';
    default: return 'bg-[#F5F7FA] text-[#666666]';
  }
}

export default function DisclosuresTab({ symbol }: DisclosuresTabProps) {
  const [items, setItems] = useState<DisclosureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [totalCount, setTotalCount] = useState(0);
  const [months, setMonths] = useState(3);

  useEffect(() => {
    const ctl = new AbortController();
    setLoading(true);
    setErr('');
    fetch(`/api/stocks/disclosures?symbol=${encodeURIComponent(symbol)}&months=${months}&limit=100`, {
      signal: ctl.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? '공시 조회 실패');
        setItems(d.items ?? []);
        setTotalCount(d.total_count ?? 0);
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setErr(e.message);
        setItems([]);
      })
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [symbol, months]);

  const filtered = filter === 'all' ? items : items.filter((i) => i.disclosure_type === filter);
  const displayed = filtered.slice(0, displayCount);
  const hasMore = displayed.length < filtered.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 기간 · 합계 */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-1">
          {[1, 3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMonths(m);
                setDisplayCount(PAGE_SIZE);
              }}
              className={`px-2 py-1 text-xs font-bold rounded ${
                months === m
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-[#F5F7FA] text-[#666666] hover:text-black'
              }`}
            >
              {m === 12 ? '1년' : `${m}개월`}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-[#666666]">
          전체 {totalCount}건 · 필터 후 {filtered.length}건
        </span>
      </div>

      {err && (
        <div className="px-3 py-2 bg-[#FF3B30]/5 border border-[#FF3B30]/30 rounded text-xs text-[#FF3B30]">
          ⚠ {err}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_TYPES.map((ft) => {
          const count = ft.key === 'all' ? items.length : items.filter((i) => i.disclosure_type === ft.key).length;
          if (ft.key !== 'all' && count === 0) return null;
          return (
            <button
              key={ft.key}
              onClick={() => {
                setFilter(ft.key);
                setDisplayCount(PAGE_SIZE);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                filter === ft.key
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-[#F5F7FA] text-[#666666] hover:text-black'
              }`}
            >
              {ft.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {displayed.length === 0 && !err ? (
        <div className="text-center text-[#666666] py-20 text-sm">
          최근 {months}개월 공시가 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((d) => (
            <div key={d.rcept_no} className="bg-white rounded border border-[#E5E7EB] p-3 hover:border-[#0ABAB5]/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[#666666] text-xs tabular-nums">
                      {d.published_at ? formatDate(d.published_at) : '—'}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${getTypeBadgeColor(d.disclosure_type)}`}>
                      {d.disclosure_type}
                    </span>
                    {d.remark && (
                      <span className="text-[10px] text-[#F59E0B] font-bold">[{d.remark}]</span>
                    )}
                  </div>
                  <p className="text-black text-sm font-medium truncate">{d.report_name}</p>
                  <p className="text-[#999999] text-[11px] mt-0.5">{d.filer_name}</p>
                </div>
                <a
                  href={d.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#666666] hover:text-[#0ABAB5] transition-colors shrink-0"
                  aria-label="DART 원본 열기"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <button
            onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}
            className="inline-flex items-center gap-1 px-5 py-1.5 bg-[#F5F7FA] text-[#666666] hover:text-black rounded text-xs border border-[#E5E7EB] transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
            더 불러오기 ({displayed.length} / {filtered.length})
          </button>
        </div>
      )}

      <p className="text-[10px] text-[#999999] text-center">데이터: DART OpenAPI (금융감독원 전자공시시스템)</p>
    </div>
  );
}
