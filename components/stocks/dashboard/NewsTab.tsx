'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils/format';
import type { News } from '@/types/stock';
import { ExternalLink, Clock } from 'lucide-react';

interface NewsTabProps {
  stockId: number;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return formatDate(dateStr);
}

export default function NewsTab({ stockId }: NewsTabProps) {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data } = await supabase
        .from('news')
        .select('*')
        .eq('stock_id', stockId)
        .gte('published_at', thirtyDaysAgo.toISOString())
        .order('published_at', { ascending: false })
        .limit(50);

      setNews((data as News[]) ?? []);
      setLoading(false);
    }
    load();
  }, [stockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center text-[#666666] py-20">
        최근 30일 이내 뉴스가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((n) => (
        <a
          key={n.id}
          href={n.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white rounded-lg border border-[#E5E7EB] p-4 hover:border-[#0ABAB5]/50 transition-colors group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-black text-sm font-medium group-hover:text-[#0ABAB5] transition-colors">
                {n.title}
              </p>
              {n.summary_ko && (
                <p className="text-[#666666] text-xs mt-2 leading-relaxed">
                  {n.summary_ko}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[#666666] text-xs">{n.source}</span>
                <span className="flex items-center gap-1 text-[#666666] text-xs">
                  <Clock className="w-3 h-3" />
                  {timeAgo(n.published_at)}
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#666666] group-hover:text-[#0ABAB5] transition-colors shrink-0 mt-1" />
          </div>
        </a>
      ))}
    </div>
  );
}
