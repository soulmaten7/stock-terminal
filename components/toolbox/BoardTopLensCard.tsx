'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';

type Tone = 'pos' | 'warn' | 'flat';
type LensState = { state: 'loading' | 'done' | 'error'; tones: Tone[] };
type TopStock = { symbol: string; name: string; nameEn?: string | null; price?: number | null; changePercent?: number | null };

// 톤 점 색 — components/favorites/WatchlistClient.tsx TONE_DOT과 동일(강점=민트·주의=앰버·보통=중립).
const TONE_DOT: Record<Tone, string> = {
  pos: 'bg-unjong-accent',
  warn: 'bg-amber-400',
  flat: 'bg-unjong-muted',
};

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}

export default function BoardTopLensCard({ stock, market }: { stock: TopStock | null; market: string }) {
  const t = useTranslations('Board');
  const tf = useTranslations('Favorites'); // 카운트·로딩 라벨 재사용(신규 키 없이 패리티 무리스크)
  const locale = useLocale();
  const [lens, setLens] = useState<LensState | null>(null);

  useEffect(() => {
    if (!stock) { setLens(null); return; }
    let cancelled = false;
    setLens({ state: 'loading', tones: [] });
    fetch('/api/lens?symbol=' + encodeURIComponent(stock.symbol) + '&lang=' + locale)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const tones: Tone[] = [];
        for (const l of (j.lenses ?? []) as { verdict?: { tone?: string } | null }[]) {
          const tone = l?.verdict?.tone;
          if (tone === 'pos' || tone === 'warn' || tone === 'flat') tones.push(tone);
        }
        const fs = j.fscore as { supported?: boolean; score?: number } | null;
        if (fs?.supported) {
          const score = fs.score ?? 0;
          tones.push(score >= 7 ? 'pos' : score <= 3 ? 'warn' : 'flat');
        }
        setLens({ state: 'done', tones });
      })
      .catch(() => { if (!cancelled) setLens({ state: 'error', tones: [] }); });
    return () => { cancelled = true; };
  }, [stock?.symbol, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) return null;
  const displayName = locale === 'en' ? (stock.nameEn ?? stock.name) : stock.name;

  const pos = lens?.tones.filter((x) => x === 'pos').length ?? 0;
  const warn = lens?.tones.filter((x) => x === 'warn').length ?? 0;
  const flat = lens?.tones.filter((x) => x === 'flat').length ?? 0;
  const showSkeleton = !lens || lens.state === 'loading';
  const showSummary = lens?.state === 'done' && lens.tones.length > 0;

  return (
    <Link href={`/stock/${stock.symbol}`} className="block rounded-2xl border border-unjong-border bg-unjong-surface p-3">
      <p className="mb-2 text-[11px] text-unjong-muted">{t('topExample')}</p>
      <div className="flex items-center gap-2">
        <StockLogo code={stock.symbol} name={displayName} size={22} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary">{displayName}</span>
        <span className="shrink-0 font-mono text-xs text-unjong-muted">{stock.symbol}</span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-semibold tabular-nums text-unjong-primary">{stock.price != null ? formatPrice(stock.price, market) : '—'}</span>
          <span className={`block text-[11px] font-medium tabular-nums ${pctColor(stock.changePercent)}`}>{pct(stock.changePercent)}</span>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex shrink-0 items-center gap-1">
            {showSkeleton
              ? Array.from({ length: 7 }).map((_, i) => <span key={i} className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-border" />)
              : (lens?.tones ?? []).map((tone, i) => <span key={i} className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT[tone]}`} />)}
          </div>
          {showSkeleton ? (
            <span className="text-[11px] text-unjong-muted">{tf('lensLoading')}</span>
          ) : showSummary ? (
            <span className="text-[11px] font-medium text-unjong-muted">{tf('lensSummary', { pos, warn, flat })}</span>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-unjong-accent">
          {t('viewLens')} <ArrowRight size={11} />
        </span>
      </div>
    </Link>
  );
}
