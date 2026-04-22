'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Search, Calendar, ExternalLink } from 'lucide-react';
import {
  classifyDartType,
  TYPE_COLOR,
  fmtDartDateFull,
} from '@/lib/dart-classify';

interface DartDisclosure {
  corp_name: string;
  corp_code: string;
  stock_code: string;
  report_nm: string;
  rcept_no: string;
  rcept_dt: string;
  flr_nm: string;
  url: string;
  is_important: boolean;
}

type CorpCls = '' | 'Y' | 'K' | 'N';

const CORP_CLS_LABELS: Record<CorpCls, string> = {
  '': '전체',
  'Y': 'KOSPI',
  'K': 'KOSDAQ',
  'N': 'KONEX',
};

export default function DisclosuresPageClient() {
  const sp = useSearchParams();
  const initialImportant = sp.get('important') === '1';
  const initialCorpCls = (sp.get('corp_cls') || '') as CorpCls;
  const initialSymbol = sp.get('symbol') || '';

  const [disclosures, setDisclosures] = useState<DartDisclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSymbol);
  const [onlyImportant, setOnlyImportant] = useState(initialImportant);
  const [corpCls, setCorpCls] = useState<CorpCls>(initialCorpCls);
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const bgnDe = dateFilter.replace(/-/g, '');
      const params = new URLSearchParams({
        endpoint: 'list',
        bgn_de: bgnDe,
        page_count: '100',
      });
      if (corpCls) params.set('corp_cls', corpCls);
      const res = await fetch(`/api/dart?${params}`);
      const data = await res.json();
      if (data.disclosures) {
        setDisclosures(data.disclosures);
        setTotal(data.total || 0);
      } else {
        setDisclosures([]);
        setTotal(0);
      }
    } catch {
      setDisclosures([]);
    }
    setLoading(false);
  }, [dateFilter, corpCls]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
  };

  const filtered = disclosures
    .filter((d) => (onlyImportant ? d.is_important : true))
    .filter((d) =>
      searchQuery.trim()
        ? d.corp_name.includes(searchQuery) ||
          d.report_nm.includes(searchQuery) ||
          (d.stock_code && d.stock_code.includes(searchQuery))
        : true
    );

  return (
    <div className="w-full px-6 py-6 max-w-screen-2xl mx-auto">
      {/* 상단 헤더 */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-black">
              <FileText className="w-6 h-6 text-[#0ABAB5]" />
              DART 공시 전체
            </h1>
            <p className="text-sm text-[#666] mt-1">
              금융감독원 DART 전자공시시스템 실시간 공시
            </p>
          </div>
          {total > 0 && (
            <span className="text-xs text-[#888]">
              총 <span className="text-black font-bold tabular-nums">{total.toLocaleString()}</span>건
            </span>
          )}
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="mb-4 bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-4 py-3 flex flex-wrap items-center gap-3">
        {/* 검색 */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="기업명·종목코드·공시제목 검색"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#E5E7EB] rounded focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"
          />
        </form>

        {/* 날짜 */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999] pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 pr-3 py-2 text-sm bg-white border border-[#E5E7EB] rounded text-black focus:outline-none focus:ring-2 focus:ring-[#0ABAB5]/30 focus:border-[#0ABAB5]"
          />
        </div>

        {/* 시장구분 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          {(Object.keys(CORP_CLS_LABELS) as CorpCls[]).map((key) => (
            <button
              key={key || 'all'}
              type="button"
              onClick={() => setCorpCls(key)}
              className={`text-xs font-medium px-3 py-2 transition-colors ${
                corpCls === key
                  ? 'bg-[#0ABAB5] text-white'
                  : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
              }`}
            >
              {CORP_CLS_LABELS[key]}
            </button>
          ))}
        </div>

        {/* 중요 토글 */}
        <div className="inline-flex rounded overflow-hidden border border-[#E5E7EB] bg-white">
          <button
            type="button"
            onClick={() => setOnlyImportant(false)}
            className={`text-xs font-medium px-3 py-2 transition-colors ${
              !onlyImportant ? 'bg-[#666] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setOnlyImportant(true)}
            className={`text-xs font-medium px-3 py-2 transition-colors ${
              onlyImportant ? 'bg-[#FF3B30] text-white' : 'bg-white text-[#666] hover:bg-[#F0F0F0]'
            }`}
          >
            중요만
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#666] text-xs">
                <th className="text-left px-4 py-3 w-28">접수일</th>
                <th className="text-left px-4 py-3 w-24">종목코드</th>
                <th className="text-left px-4 py-3 w-40">기업명</th>
                <th className="text-left px-4 py-3 w-24">유형</th>
                <th className="text-left px-4 py-3">공시 제목</th>
                <th className="text-left px-4 py-3 w-32">제출인</th>
                <th className="text-center px-4 py-3 w-14">원문</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#F0F0F0]">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-5 bg-[#F0F0F0] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <FileText className="w-10 h-10 text-[#E5E7EB] mx-auto mb-3" />
                    <p className="text-sm text-[#666]">
                      {searchQuery
                        ? '검색 결과가 없습니다'
                        : onlyImportant
                        ? '중요 공시가 없습니다'
                        : '해당 날짜의 공시가 없습니다'}
                    </p>
                    <p className="text-xs text-[#999] mt-1">
                      날짜·시장구분·필터를 조정해 보세요
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const type = classifyDartType(d.report_nm);
                  return (
                    <tr
                      key={d.rcept_no}
                      className={`border-t border-[#F0F0F0] hover:bg-[#FAFAFA] transition-colors ${
                        d.is_important ? 'bg-[#FF3B30]/[0.03]' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-[#888] tabular-nums text-xs">
                        {fmtDartDateFull(d.rcept_dt)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-xs text-[#333]">
                        {d.stock_code || '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-black">{d.corp_name}</span>
                          {d.is_important && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white shrink-0">
                              중요
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLOR[type]}`}
                        >
                          {type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#333] hover:text-[#0ABAB5] hover:underline line-clamp-1"
                        >
                          {d.report_nm.trim()}
                        </a>
                      </td>
                      <td className="px-4 py-2.5 text-[#888] text-xs">{d.flr_nm}</td>
                      <td className="px-4 py-2.5 text-center">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[#F0F0F0] text-[#999] hover:text-[#0ABAB5] transition-colors"
                          aria-label="DART 원문 열기"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-[#999] mt-4 text-center">
        데이터 출처: 금융감독원 DART 전자공시시스템 (opendart.fss.or.kr)
      </p>
    </div>
  );
}
