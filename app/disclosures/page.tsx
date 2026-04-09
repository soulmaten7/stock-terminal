'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Search, Calendar, ExternalLink } from 'lucide-react';

interface DartDisclosure {
  corp_name: string;
  corp_code: string;
  stock_code: string;
  report_nm: string;
  rcept_no: string;
  rcept_dt: string;
  flr_nm: string;
  url: string;
}

export default function DisclosuresPage() {
  const [disclosures, setDisclosures] = useState<DartDisclosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
      const res = await fetch(`/api/dart?endpoint=list&bgn_de=${bgnDe}&page_count=50`);
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
  }, [dateFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (dt: string) => {
    if (dt.length === 8) {
      return `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`;
    }
    return dt;
  };

  const filtered = searchQuery.trim()
    ? disclosures.filter(
        (d) =>
          d.corp_name.includes(searchQuery) ||
          d.report_nm.includes(searchQuery) ||
          d.stock_code.includes(searchQuery)
      )
    : disclosures;

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <FileText className="w-6 h-6 text-accent" />
            DART 공시 전체
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            금융감독원 DART 전자공시시스템 실시간 공시
          </p>
        </div>
        {total > 0 && (
          <span className="text-text-secondary text-sm">
            총 <span className="text-text-primary font-mono-price">{total.toLocaleString()}</span>건
          </span>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="기업명, 종목코드, 공시제목 검색"
            className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-border rounded-lg text-sm placeholder:text-text-secondary focus:outline-none focus:border-accent"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-dark-700 border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-700 rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-dark-800 text-text-secondary text-xs">
              <th className="text-left px-4 py-3 w-24">접수일</th>
              <th className="text-left px-4 py-3 w-28">종목코드</th>
              <th className="text-left px-4 py-3 w-40">기업명</th>
              <th className="text-left px-4 py-3">공시 제목</th>
              <th className="text-left px-4 py-3 w-32">제출인</th>
              <th className="text-center px-4 py-3 w-16">원문</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-t border-border/50">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="h-5 bg-dark-600 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <FileText className="w-10 h-10 text-text-secondary/30 mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">
                    {searchQuery ? '검색 결과가 없습니다' : '해당 날짜의 공시가 없습니다'}
                  </p>
                  <p className="text-text-secondary/60 text-xs mt-1">
                    날짜를 변경하거나 검색어를 확인해주세요
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.rcept_no} className="border-t border-border/50 hover:bg-dark-600/30 transition-colors">
                  <td className="px-4 py-2.5 text-text-secondary font-mono-price text-xs">
                    {formatDate(d.rcept_dt)}
                  </td>
                  <td className="px-4 py-2.5 font-mono-price text-xs">
                    {d.stock_code || '-'}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{d.corp_name}</td>
                  <td className="px-4 py-2.5">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-primary hover:text-accent transition-colors line-clamp-1"
                    >
                      {d.report_nm.trim()}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary text-xs">{d.flr_nm}</td>
                  <td className="px-4 py-2.5 text-center">
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-dark-600 text-text-secondary hover:text-accent transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-text-secondary/50 text-xs mt-4 text-center">
        데이터 출처: 금융감독원 DART 전자공시시스템 (opendart.fss.or.kr)
      </p>
    </div>
  );
}
