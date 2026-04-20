'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@/components/home/WidgetCard';

interface OvernightItem {
  label: string;
  val: string;
  change: string;
  up: boolean;
}

interface BriefingData {
  overnight: OvernightItem[];
  schedule: string[];
}

export default function PreMarketBriefingWidget() {
  const [data, setData] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/home/briefing')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="장전 브리핑" subtitle="Yahoo Finance · DART" href="/briefing">
      {loading && (
        <div className="flex items-center justify-center h-24 text-xs text-[#999]">로딩 중…</div>
      )}
      {!loading && (
        <div className="px-3 py-2">
          <p className="text-[10px] font-bold text-[#999] mb-1.5 uppercase tracking-wider">간밤 미증시</p>
          <div className="space-y-1 mb-3">
            {(data?.overnight ?? []).map((o) => (
              <div key={o.label} className="flex items-center justify-between text-xs">
                <span className="text-[#555]">{o.label}</span>
                <div className="flex gap-2">
                  <span className="font-bold text-black">{o.val}</span>
                  <span className={`font-bold ${o.up ? 'text-[#FF3B30]' : 'text-[#0051CC]'}`}>
                    {o.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {data?.schedule && data.schedule.length > 0 && (
            <>
              <p className="text-[10px] font-bold text-[#999] mb-1.5 uppercase tracking-wider">
                오늘 주요 공시
              </p>
              <ul className="space-y-1">
                {data.schedule.map((e, i) => (
                  <li key={i} className="text-xs text-[#333] flex items-start gap-1.5">
                    <span className="text-[#0ABAB5] mt-0.5">•</span>
                    <span className="line-clamp-1">{e}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {data?.schedule?.length === 0 && (
            <p className="text-[10px] text-[#BBB]">오늘 주요 공시 없음</p>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
