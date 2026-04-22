'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowUpRight } from 'lucide-react';

type Market = 'KOSPI' | 'KOSDAQ';

export default function ScreenerMiniWidget() {
  const [market, setMarket] = useState<Market>('KOSPI');
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ market });
    if (keyword.trim()) params.set('q', keyword.trim());
    router.push(`/screener?${params.toString()}`);
  };

  return (
    <div className="h-full bg-white border border-[#E5E7EB] p-3 flex flex-col justify-center relative">
      <Link
        href="/screener"
        className="absolute top-1 right-1 text-[#BBBBBB] hover:text-[#0ABAB5] transition-colors"
        title="종목 발굴 상세 페이지"
        aria-label="종목 발굴 상세 페이지로 이동"
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* 시장 토글 */}
        <div className="flex gap-1 shrink-0">
          {(['KOSPI', 'KOSDAQ'] as Market[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMarket(m)}
              className={`px-2.5 py-1.5 text-xs font-bold border transition-colors ${
                market === m
                  ? 'bg-[#0ABAB5] text-white border-[#0ABAB5]'
                  : 'bg-white text-[#999999] border-[#E5E7EB] hover:border-[#0ABAB5]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-[#E5E7EB] shrink-0" />

        {/* 키워드 검색 */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999] pointer-events-none" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="종목명/코드 검색 → 엔터"
            className="w-full pl-7 pr-2 py-1.5 bg-[#F5F5F5] border border-[#E5E7EB] text-xs focus:border-[#0ABAB5] focus:bg-white focus:outline-none"
          />
        </div>

        {/* 검색 버튼 */}
        <button
          type="submit"
          className="shrink-0 px-3 py-1.5 text-xs font-bold text-white bg-[#0ABAB5] hover:bg-[#089A95] border border-[#0ABAB5]"
        >
          발굴
        </button>
      </form>
    </div>
  );
}
