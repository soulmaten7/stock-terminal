'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';

type WatchItem = { symbol: string; name_ko: string | null; market: string; country: string };

export default function WatchlistClient() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/watchlist')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setItems(j.watchlist ?? []); setAuth(j.auth !== false); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const remove = (symbol: string, market: string) => {
    setItems((prev) => prev.filter((x) => !(x.symbol === symbol && x.market === market)));
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, market, add: false }),
    }).catch(() => {});
  };

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</p>;
  if (!auth) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm text-unjong-muted">로그인하면 관심종목을 모아볼 수 있어요.</p>
        <Link href="/auth/login" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">로그인 →</Link>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm leading-relaxed text-unjong-muted">관심종목이 없어요.<br />종목·상품 탭에서 ⭐를 눌러 추가하세요.</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {items.map((f) => (
        <li key={`${f.symbol}:${f.market}`} className="group flex items-center gap-2 border-b border-unjong-border px-3 py-2.5 last:border-0 hover:bg-unjong-background">
          {/* 행(로고·이름·티커) 전체 클릭 → 종목 상세. 앱 공통 동선(LensPreview '자세히 보기'와 동일 /stock/[symbol]). 해제(X)만 분리. */}
          <Link href={`/stock/${f.symbol}`} className="flex min-w-0 flex-1 items-center gap-2">
            <StockLogo code={f.symbol} name={f.name_ko ?? f.symbol} size={22} />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{f.name_ko ?? f.symbol}</span>
            <span className="shrink-0 font-mono text-xs text-unjong-muted">{f.symbol}</span>
          </Link>
          <button type="button" onClick={() => remove(f.symbol, f.market)} aria-label="관심종목 해제" className="shrink-0 text-unjong-border transition-colors hover:text-unjong-danger">
            <X size={15} />
          </button>
        </li>
      ))}
    </ul>
  );
}
