'use client';

import { useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import { TONE_DOT_CLASS as TONE_DOT, changeColorClass, type Tone } from '@/lib/lensTones';
import { pickLocale } from '@/lib/lensCopy';
import { resolveWatchlistName } from '@/lib/displayName';

type WatchItem = { symbol: string; name_ko: string | null; name_en?: string | null; market: string; country: string; price: number | null; changePercent: number | null; tones?: Tone[] | null };
type LensState = { state: 'loading' | 'done' | 'error'; tones: Tone[] };

function pctText(v: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function LensSummary({ lens, t }: { lens: LensState | undefined; t: ReturnType<typeof useTranslations> }) {
  // 아직 시작 전(레이스) 또는 로딩 중: 회색 점 7개 스켈레톤
  if (!lens || lens.state === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 items-center gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-border" />
          ))}
        </div>
        <span className="text-[11px] text-unjong-muted">{t('lensLoading')}</span>
      </div>
    );
  }
  // 실패 또는 na(집계할 렌즈 없음): 조용히 숨김
  if (lens.state === 'error' || lens.tones.length === 0) return null;

  const pos = lens.tones.filter((x) => x === 'pos').length;
  const warn = lens.tones.filter((x) => x === 'warn').length;
  const flat = lens.tones.filter((x) => x === 'flat').length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 items-center gap-1">
        {lens.tones.map((tone, i) => (
          <span key={i} className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT[tone]}`} />
        ))}
      </div>
      <span className="whitespace-nowrap text-[11px] font-medium text-unjong-muted">
        {t('lensSummary', { pos, warn, flat })}
      </span>
    </div>
  );
}

export default function WatchlistClient() {
  const t = useTranslations('Favorites');
  const tb = useTranslations('Board'); // '관심종목 해제' 재사용(dedup)
  const locale = pickLocale(useLocale()); // 등락색 로케일 분기(STEP 777 §2)에 타입 필요 — 값은 무변(ko/en 그대로)
  const [items, setItems] = useState<WatchItem[]>([]);
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lensMap, setLensMap] = useState<Record<string, LensState>>({});
  const lensStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/watchlist/quotes')
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const list: WatchItem[] = j.watchlist ?? [];
        setItems(list);
        setAuth(j.auth !== false);
        setLoading(false);
        // 선계산(lens_scores) 톤이 있는 항목은 즉시 렌더 — 스켈레톤·fetch 없이 바로 채움
        const seed: Record<string, LensState> = {};
        for (const it of list) if (it.tones != null) seed[it.symbol] = { state: 'done', tones: it.tones };
        setLensMap(seed);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // 행별 지연 렌즈 요약 — 선계산(lens_scores) 밖 종목만 동시성 4개 제한 큐로 실시간 폴백. 관심목록이 처음 채워질 때 한 번만 시작.
  useEffect(() => {
    if (items.length === 0 || lensStarted.current) return;
    lensStarted.current = true;
    let cancelled = false;
    const queue = items.filter((x) => x.tones == null); // 선계산 없는 것만(top-N 밖·비KR/US)
    const CONCURRENCY = 4;

    async function worker() {
      while (!cancelled) {
        const item = queue.shift();
        if (!item) return;
        setLensMap((m) => ({ ...m, [item.symbol]: { state: 'loading', tones: [] } }));
        try {
          const j = await (await fetch(`/api/lens?symbol=${encodeURIComponent(item.symbol)}&lang=${locale}`)).json();
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
          setLensMap((m) => ({ ...m, [item.symbol]: { state: 'done', tones } }));
        } catch {
          if (!cancelled) setLensMap((m) => ({ ...m, [item.symbol]: { state: 'error', tones: [] } }));
        }
      }
    }
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker());
    return () => { cancelled = true; };
  }, [items, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = (symbol: string, market: string) => {
    setItems((prev) => prev.filter((x) => !(x.symbol === symbol && x.market === market)));
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, market, add: false }),
    }).catch(() => {});
  };

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">{t('loading')}</p>;
  if (!auth) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm text-unjong-muted">{t('loginForWatchlist')}</p>
        <Link href="/auth/login" className="mt-2 inline-block text-sm font-semibold text-unjong-accent">{t('loginLink')}</Link>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm leading-relaxed text-unjong-muted">{t.rich('emptyWatchlist', { br: () => <br /> })}</p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {items.map((f) => (
        <li key={`${f.symbol}:${f.market}`} className="group flex items-start gap-2 border-b border-unjong-border px-3 py-2.5 last:border-0 hover:bg-unjong-background active:bg-unjong-background">
          {/* 행(로고·이름·티커·가격·렌즈요약) 전체 클릭 → 종목 상세. 해제(X)만 분리. */}
          <Link href={`/stock/${f.symbol}`} className="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:flex-1">
              <StockLogo code={f.symbol} name={resolveWatchlistName(locale, f)} size={22} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{resolveWatchlistName(locale, f)}</span>
              <span className="shrink-0 font-mono text-xs text-unjong-muted">{f.symbol}</span>
              <span className="ml-auto shrink-0 text-right sm:ml-0">
                <span className="block text-sm font-semibold tabular-nums text-unjong-primary">{f.price != null ? formatPrice(f.price, f.country) : '—'}</span>
                <span className={`block text-[11px] font-medium tabular-nums ${changeColorClass(f.changePercent, locale)}`}>{pctText(f.changePercent)}</span>
              </span>
            </div>
            <div className="shrink-0 sm:flex sm:w-64 sm:justify-end">
              <LensSummary lens={lensMap[f.symbol]} t={t} />
            </div>
          </Link>
          <button type="button" onClick={() => remove(f.symbol, f.market)} aria-label={tb('watchRemove')} className="mt-1 shrink-0 text-unjong-border transition-colors hover:text-unjong-danger">
            <X size={15} />
          </button>
        </li>
      ))}
    </ul>
  );
}
