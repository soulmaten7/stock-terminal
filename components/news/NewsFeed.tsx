'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { FeedItem } from './NewsClient';

const SOURCE_COLORS: Record<string, string> = {
  '한국경제': 'bg-[#2196F3] text-white', '매일경제': 'bg-[#34C759] text-white',
  '서울경제': 'bg-[#8B5CF6] text-white', '연합뉴스': 'bg-[#FF4D4D] text-white',
  '조선비즈': 'bg-[#FF9500] text-white', '공시': 'bg-[#FF4D4D] text-white',
};

const IMPORTANT_KW = ['유상증자', '무상증자', '합병', '분할', '실적', '매출', '영업이익', '배당', '자사주', '최대주주변경'];

function highlightKeywords(text: string) {
  let result = text;
  for (const kw of IMPORTANT_KW) {
    if (result.includes(kw)) result = result.replace(kw, `<b class="text-[#FF4D4D]">${kw}</b>`);
  }
  return result;
}

export default function NewsFeed({ items }: { items: FeedItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const visible = items.slice(0, visibleCount);

  return (
    <div>
      {visible.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#999999] text-sm font-bold">해당 조건의 뉴스/공시가 없습니다</p>
        </div>
      )}
      <div className="space-y-0">
        {visible.map((item) => {
          const isExpanded = expanded === item.id;
          return (
            <div key={item.id} className={`border-b border-[#F0F0F0] ${item.isImportant ? 'bg-[#FFF5F5]' : ''}`}>
              <div className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#FAFAFA]"
                onClick={() => item.type === 'disclosure' ? setExpanded(isExpanded ? null : item.id) : window.open(item.url, '_blank')}>
                {item.isImportant && <span className="text-[#FF4D4D] text-xs mt-1 shrink-0">●</span>}
                <span className="text-[#999999] text-xs font-mono-price font-bold shrink-0 mt-0.5 w-12">{item.time}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 shrink-0 mt-0.5 ${SOURCE_COLORS[item.source] || 'bg-[#E5E7EB] text-black'}`}>{item.source}</span>
                <div className="flex-1 min-w-0">
                  {item.corpName && (
                    <Link href={`/stocks/${item.stockCode}`} onClick={(e) => e.stopPropagation()}
                      className="text-[#0ABAB5] font-bold text-xs mr-2 hover:underline">{item.corpName}</Link>
                  )}
                  <span className="text-black text-sm font-medium" dangerouslySetInnerHTML={{ __html: highlightKeywords(item.title) }} />
                </div>
                {item.type === 'disclosure' && (
                  isExpanded ? <ChevronUp className="w-4 h-4 text-[#999999] shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-[#999999] shrink-0 mt-0.5" />
                )}
                {item.type === 'news' && <ExternalLink className="w-3.5 h-3.5 text-[#999999] shrink-0 mt-0.5" />}
              </div>
              {isExpanded && item.type === 'disclosure' && (
                <div className="px-4 pb-4 pl-24 bg-[#FAFAFA] border-t border-[#F0F0F0]">
                  <div className="flex gap-3 mt-3">
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0ABAB5] text-white text-xs font-bold hover:bg-[#088F8C]">
                      <ExternalLink className="w-3 h-3" /> DART 원문 보기
                    </a>
                  </div>
                  {item.corpName && (
                    <p className="text-[#999999] text-xs mt-2">기업: <span className="text-black font-bold">{item.corpName}</span> ({item.stockCode})</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {visibleCount < items.length && (
        <button onClick={() => setVisibleCount((v) => v + 20)}
          className="w-full py-4 text-center text-[#0ABAB5] font-bold text-sm hover:bg-[#FAFAFA] border-t border-[#E5E7EB]">
          더보기 ({items.length - visibleCount}건 남음)
        </button>
      )}
    </div>
  );
}
