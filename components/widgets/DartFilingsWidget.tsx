'use client';

import { useEffect, useMemo, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';
import { classifyDartType, TYPE_COLOR, fmtDartDate } from '@/lib/dart-classify';

interface Filing {
  corp_name: string;
  report_nm: string;
  rcept_dt: string;
  url: string;
  is_important: boolean;
}

interface Props {
  inline?: boolean;
  size?: 'default' | 'large';
}

export default function DartFilingsWidget({ inline = false, size = 'default' }: Props = {}) {
  const [items, setItems] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [onlyImportant, setOnlyImportant] = useState(false);

  useEffect(() => {
    fetch('/api/dart?endpoint=list&page_count=30')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setItems(d.disclosures ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (onlyImportant ? items.filter((d) => d.is_important) : items).slice(0, 15),
    [items, onlyImportant]
  );

  const href = onlyImportant ? '/disclosures?important=1' : '/disclosures';

  const action = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setOnlyImportant(false)}
        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
          !onlyImportant
            ? 'bg-[#0ABAB5] text-white'
            : 'bg-[#F0F0F0] text-[#666] hover:bg-[#E5E7EB]'
        }`}
      >
        전체
      </button>
      <button
        type="button"
        onClick={() => setOnlyImportant(true)}
        className={`text-[10px] font-medium px-2 py-0.5 rounded transition-colors ${
          onlyImportant
            ? 'bg-[#FF3B30] text-white'
            : 'bg-[#F0F0F0] text-[#666] hover:bg-[#E5E7EB]'
        }`}
      >
        중요
      </button>
    </div>
  );

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
          {filtered.map((d, i) => {
            const type = classifyDartType(d.report_nm);
            return (
              <li
                key={i}
                className={`flex items-start gap-2 px-3 py-2 hover:bg-[#F8F9FA] ${
                  d.is_important ? 'border-l-2 border-[#FF3B30]' : 'border-l-2 border-transparent'
                }`}
              >
                <span className="text-[10px] text-[#999] mt-0.5 shrink-0 w-9">
                  {fmtDartDate(d.rcept_dt)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-bold text-black truncate">{d.corp_name}</p>
                    {d.is_important && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-[#FF3B30] text-white shrink-0">
                        중요
                      </span>
                    )}
                  </div>
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
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-xs text-[#999] text-center">
              {onlyImportant ? '중요 공시 없음' : '공시 없음'}
            </li>
          )}
        </ul>
      )}
    </>
  );

  if (inline) {
    return <div className="h-full overflow-auto">{content}</div>;
  }

  return (
    <WidgetCard title="DART 공시 피드" subtitle="DART OpenAPI" href={href} size={size} action={action}>
      {content}
    </WidgetCard>
  );
}
