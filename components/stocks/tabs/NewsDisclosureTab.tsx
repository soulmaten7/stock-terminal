'use client';

import { useState } from 'react';
import NewsTab from '@/components/stocks/dashboard/NewsTab';
import DisclosuresTab from '@/components/stocks/dashboard/DisclosuresTab';

export default function NewsDisclosureTab({ stockId, symbol }: { stockId: number; symbol: string }) {
  const [sub, setSub] = useState<'news' | 'disclosures'>('news');

  return (
    <div className="space-y-3">
      <div className="flex gap-1 border-b border-[#E5E7EB]">
        {(['news', 'disclosures'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={`px-4 py-2 text-sm font-bold ${
              sub === s ? 'text-[#0ABAB5] border-b-2 border-[#0ABAB5]' : 'text-[#666666] hover:text-black'
            }`}
          >
            {s === 'news' ? '뉴스' : '공시'}
          </button>
        ))}
      </div>
      {sub === 'news' ? (
        <NewsTab stockId={stockId} />
      ) : (
        <DisclosuresTab stockId={stockId} symbol={symbol} />
      )}
    </div>
  );
}
