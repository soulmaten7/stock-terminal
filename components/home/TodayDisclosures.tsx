'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';

interface DartDisclosure {
  corp_name: string; corp_code: string; stock_code: string;
  report_nm: string; rcept_no: string; rcept_dt: string; flr_nm: string; url: string;
  is_important?: boolean;
}

const HIGHLIGHT_KEYWORDS = ['유상증자', '무상증자', '합병', '분할', '실적', '매출', '영업이익', '배당', '자사주', '최대주주변경'];

function highlightKeywords(text: string) {
  let result = text;
  for (const kw of HIGHLIGHT_KEYWORDS) {
    if (result.includes(kw)) {
      result = result.replace(kw, `<b>${kw}</b>`);
    }
  }
  return result;
}

export default function TodayDisclosures() {
  const [disclosures, setDisclosures] = useState<DartDisclosure[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dart?endpoint=list&page_count=5');
      const data = await res.json();
      if (data.disclosures) setDisclosures(data.disclosures);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  const formatRceptDate = (dt: string) => dt.length === 8 ? `${dt.slice(4, 6)}.${dt.slice(6, 8)}` : dt;

  return (
    <div className="bg-white p-5 border-[3px] border-[#0ABAB5]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 text-black">
          <FileText className="w-4 h-4 text-[#0ABAB5]" />
          오늘의 주요 공시
        </h3>
        <Link href="/disclosures" className="text-xs text-black hover:text-[#0ABAB5] flex items-center gap-1 font-bold">
          더보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-6 bg-[#F0F0F0] animate-pulse" />))}
        </div>
      ) : disclosures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="w-8 h-8 text-[#999999] mb-3" />
          <p className="text-[#999999] text-sm font-bold">오늘 등록된 공시가 없습니다</p>
          <p className="text-[#999999] text-xs mt-1">장 시작 후 주요 공시가 업데이트됩니다</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {disclosures.map((d) => (
            <li key={d.rcept_no} className="flex items-start gap-2 text-sm py-1.5 border-b border-[#F0F0F0] last:border-0">
              {d.is_important && <span className="text-[#FF4D4D] text-xs mt-1 shrink-0">●</span>}
              <span className="text-[#999999] text-sm shrink-0 mt-0.5 font-mono-price font-medium">{formatRceptDate(d.rcept_dt)}</span>
              <div className="min-w-0 flex-1">
                {d.stock_code ? (
                  <Link href={`/stocks/${d.stock_code}`} className="text-[#0ABAB5] hover:underline mr-2 text-xs font-bold">{d.corp_name}</Link>
                ) : (
                  <span className="text-[#0ABAB5] mr-2 text-xs font-bold">{d.corp_name}</span>
                )}
                <a href={d.url} target="_blank" rel="noopener noreferrer"
                  className="text-black font-medium text-sm hover:text-[#0ABAB5]"
                  dangerouslySetInnerHTML={{ __html: highlightKeywords(d.report_nm) }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
