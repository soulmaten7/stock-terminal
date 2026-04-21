'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface Filing {
  corp_name: string;
  report_nm: string;
  rcept_dt: string;
  url: string;
  is_important: boolean;
}

const TYPE_COLOR: Record<string, string> = {
  '주요사항': 'text-[#FF9500] bg-[#FF9500]/10',
  '정기공시': 'text-[#0ABAB5] bg-[#0ABAB5]/10',
  '지분공시': 'text-[#9B59B6] bg-[#9B59B6]/10',
  '감사보고': 'text-[#0066CC] bg-[#0066CC]/10',
  '공시':     'text-[#999] bg-[#F0F0F0]',
};

function classifyType(reportNm: string): string {
  if (/주요사항|유상증자|무상증자|합병|분할|자사주|해산/.test(reportNm)) return '주요사항';
  if (/사업보고서|분기보고서|반기보고서|연결/.test(reportNm)) return '정기공시';
  if (/주요주주|대량보유|주식등/.test(reportNm)) return '지분공시';
  if (/감사보고/.test(reportNm)) return '감사보고';
  return '공시';
}

function fmtTime(rcept_dt: string): string {
  // rcept_dt: "20260420" → "04/20"
  if (rcept_dt.length !== 8) return '';
  return `${rcept_dt.slice(4, 6)}/${rcept_dt.slice(6, 8)}`;
}

interface Props { inline?: boolean }

export default function DartFilingsWidget({ inline = false }: Props = {}) {
  const [items, setItems] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/dart?endpoint=list&page_count=20')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.disclosures ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const content = (
    <>
      {loading && (
        <div className="flex items-center justify-center h-24 text-xs text-[#999]">로딩 중…</div>
      )}
      {error && (
        <div className="flex items-center justify-center h-24 text-xs text-[#FF3B30]">
          공시를 불러오지 못했습니다
        </div>
      )}
      {!loading && !error && (
        <ul aria-label="DART 공시 목록" className="divide-y divide-[#F0F0F0]">
          {items.slice(0, 15).map((d, i) => {
            const type = classifyType(d.report_nm);
            return (
              <li key={i} className="flex items-start gap-2 px-3 py-2 hover:bg-[#F8F9FA]">
                <span className="text-[10px] text-[#999] mt-0.5 shrink-0 w-9">
                  {fmtTime(d.rcept_dt)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">{d.corp_name}</p>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#555] truncate block hover:text-[#0ABAB5] hover:underline"
                  >
                    {d.report_nm}
                  </a>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${TYPE_COLOR[type]}`}>
                  {type}
                </span>
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="px-3 py-4 text-xs text-[#999] text-center">공시 없음</li>
          )}
        </ul>
      )}
    </>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard title="DART 공시 피드" subtitle="DART OpenAPI" href="/filings">
      {content}
    </WidgetCard>
  );
}
