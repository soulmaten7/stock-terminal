'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ThemeStock { symbol: string; name: string; price: number; change: number; }
interface Theme { name: string; change: number; count: number; stocks: ThemeStock[]; }

export default function ThemeGroups() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/themes');
        const json = await res.json();
        if (json.themes) {
          const sorted = [...json.themes].sort((a: Theme, b: Theme) => b.change - a.change);
          setThemes(sorted);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="bg-white border-[3px] border-[#0ABAB5] p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-bold text-black">테마별 종목</h2>
        <span className="text-[10px] text-[#999]">큐레이션 · 평균 등락률 기준</span>
      </div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-[#F0F0F0] animate-pulse" />
          ))}
        </div>
      ) : themes.length === 0 ? (
        <p className="text-sm text-[#999] text-center py-8">데이터를 불러올 수 없습니다</p>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {themes.map((t) => (
            <div key={t.name} className="border-b border-[#F0F0F0] pb-3 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-sm text-black">{t.name}</span>
                  <span className="text-[10px] text-[#999] ml-2">{t.count}종목</span>
                </div>
                <span className={`font-mono-price font-bold text-sm ${t.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                  {t.change >= 0 ? '▲' : '▼'}{Math.abs(t.change).toFixed(2)}%
                </span>
              </div>
              <div className="space-y-1">
                {t.stocks.map((s) => (
                  <Link
                    key={s.symbol}
                    href={`/stocks/${s.symbol}`}
                    className="flex items-center justify-between py-1 px-2 hover:bg-[#F5F5F5]"
                  >
                    <span className="text-black text-sm truncate">{s.name}</span>
                    <span className={`font-mono-price text-xs font-bold shrink-0 ${s.change >= 0 ? 'text-[#FF3B30]' : 'text-[#007AFF]'}`}>
                      {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
