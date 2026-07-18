'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Sparkles, Layers } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';
import { TLensLogo } from '@/components/AiLensBadge';
import { formatPrice } from '@/lib/currency';

function pct(v?: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}
function pctColor(v?: number | null): string {
  if (v == null) return 'text-unjong-muted';
  return v >= 0 ? 'text-unjong-up' : 'text-unjong-down';
}
function gradeBadgeClass(tier: string): string {
  if (tier === 'strong') return 'bg-unjong-accent/12 text-unjong-success';
  if (tier === 'partial') return 'bg-amber-400/10 text-amber-300';
  return 'bg-unjong-background text-unjong-muted';
}

type LensItem = { key: string; name: string; grade: string; gradeTier: string; verdict?: { phrase: string; tone: string } | null };
export type LensRow = { symbol: string; name: string; nameEn?: string | null; price?: number | null; changePercent?: number | null; r1w?: number | null; r1m?: number | null; r3m?: number | null; r6m?: number | null; r1y?: number | null };

export default function LensPreview({ stock, market, compact = false, example = false }: { stock: LensRow | null; market: string; compact?: boolean; example?: boolean }) {
  const t = useTranslations('LensPreview');
  const tb = useTranslations('Board'); // 범례 라벨(강점/주의/보통) 재사용 — 보드 행 도트와 동일 용어(STEP 756b)
  const locale = useLocale(); // 렌즈 엔진은 ?lang=으로 언어를 받는다(기본 ko) — 안 보내면 en 화면에도 한국어가 온다
  const [lenses, setLenses] = useState<LensItem[] | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [brief, setBrief] = useState('');
  const [briefState, setBriefState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [etf, setEtf] = useState<{ isFund?: boolean; fundType?: string; category?: string | null; expenseRatio?: number | null; holdings?: { sym: string; name: string; weight: number }[] } | null>(null);

  useEffect(() => {
    if (!stock) { setState('idle'); setLenses(null); return; }
    let alive = true; setState('loading');
    fetch('/api/lens?symbol=' + encodeURIComponent(stock.symbol) + '&lang=' + locale)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setLenses(j.lenses || []); setState('done'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [stock?.symbol, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  // ETF/펀드면 구성 요약(렌즈 대신) — /api/etf-holdings
  useEffect(() => {
    if (!stock) { setEtf(null); return; }
    let alive = true; setEtf(null);
    fetch('/api/etf-holdings?symbol=' + encodeURIComponent(stock.symbol))
      .then((r) => r.json())
      .then((j) => { if (alive) setEtf(j); })
      .catch(() => {});
    return () => { alive = false; };
  }, [stock?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!stock) { setBriefState('idle'); setBrief(''); return; }
    let alive = true; setBriefState('idle');
    const timer = setTimeout(() => {
      setBriefState('loading');
      fetch('/api/brief?symbol=' + encodeURIComponent(stock.symbol) + '&lang=' + locale)
        .then((r) => r.json())
        .then((j) => { if (!alive) return; if (j.brief) { setBrief(j.brief); setBriefState('done'); } else setBriefState('error'); })
        .catch(() => { if (alive) setBriefState('error'); });
    }, 700);
    return () => { alive = false; clearTimeout(timer); };
  }, [stock?.symbol, locale]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) {
    if (compact) return null;
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-4 text-center">
        <TLensLogo size={22} color="#2DD4BF" />
        <p className="mt-2 text-sm font-semibold text-unjong-primary">{t('emptyTitle')}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-unjong-muted">{t('emptyDesc')}</p>
      </div>
    );
  }
  const displayName = locale === 'en' ? (stock.nameEn ?? stock.name) : stock.name;
  return (
    <div className={compact ? '' : 'rounded-2xl border border-unjong-border bg-unjong-surface p-4'}>
      {example && stock ? <p className="mb-2 text-[11px] text-unjong-muted">{t('exampleLabel')}</p> : null}
      {!compact && (
        <>
          <div className="flex items-center gap-2.5">
            <StockLogo code={stock.symbol} name={displayName} size={32} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-unjong-primary">{displayName}</p>
              <p className="text-[12px] tabular-nums text-unjong-muted">{stock.price ? formatPrice(stock.price, market) : '—'}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-y-2">
            {([
              [t('period.d1'), stock.changePercent],
              [t('period.w1'), stock.r1w],
              [t('period.m1'), stock.r1m],
              [t('period.m3'), stock.r3m],
              [t('period.m6'), stock.r6m],
              [t('period.y1'), stock.r1y],
            ] as [string, number | null | undefined][]).map(([l, v]) => (
              <div key={l} className="flex flex-col">
                <span className="whitespace-nowrap text-[11px] text-unjong-muted">{l}</span>
                <span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {etf?.isFund ? (
        <div className={compact ? 'mt-3' : 'mt-3 border-t border-unjong-border pt-3'}>
          <div className="mb-1.5 flex items-center gap-1">
            <Layers size={12} className="text-unjong-accent" />
            <span className="text-[12px] font-semibold text-unjong-primary">{etf.fundType === 'etn' ? t('productInfo') : t('productComposition')}</span>
            <span className="ml-auto text-[10px] text-unjong-muted">{t('notAi')}</span>
          </div>
          {etf.fundType === 'etn' ? (
            <p className="text-[12px] leading-5 text-unjong-muted">{t('etnDesc')}</p>
          ) : (
            <>
              {etf.category ? <p className="text-[12px] text-unjong-muted">{t('categoryLabel')} <span className="font-medium text-unjong-primary">{etf.category}</span></p> : null}
              <ul className="mt-1 space-y-1">
                {(etf.holdings ?? []).slice(0, 3).map((h) => (
                  <li key={h.sym || h.name} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="min-w-0 truncate text-unjong-primary">{h.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-unjong-primary">{(h.weight * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
              {etf.expenseRatio != null ? <p className="mt-1 text-[11px] text-unjong-muted">{t('expenseRatio', { v: (etf.expenseRatio * 100).toFixed(2) })}</p> : null}
            </>
          )}
        </div>
      ) : (
        <>
      <div className={compact ? 'mt-3' : 'mt-3 border-t border-unjong-border pt-3'}>
        <div className="mb-1.5 flex items-center justify-between gap-1">
          <span className="flex items-center gap-1">
            <TLensLogo size={12} color="#2DD4BF" />
            <span className="text-[12px] font-semibold text-unjong-primary">{t('lensTitle')}</span>
          </span>
          <span className="flex items-center gap-2 text-[11px] text-unjong-muted">
            <span className="flex items-center gap-1"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-accent" />{tb('legendPos')}</span>
            <span className="flex items-center gap-1"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-amber-400" />{tb('legendWarn')}</span>
            <span className="flex items-center gap-1"><span className="h-[7px] w-[7px] shrink-0 rounded-full bg-unjong-muted" />{tb('legendFlat')}</span>
          </span>
        </div>
        {state === 'loading' ? (
          <p className="text-[12px] text-unjong-muted">{t('lensLoading')}</p>
        ) : state === 'error' ? (
          <p className="text-[12px] text-unjong-muted">{t('lensError')}</p>
        ) : lenses?.length ? (
          <div className="space-y-2">
          <ul className="space-y-1">
            {lenses.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-unjong-primary">{l.name}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {l.verdict?.phrase ? (
                    <span className={`font-medium ${l.verdict.tone === 'pos' ? 'text-unjong-accent' : l.verdict.tone === 'warn' ? 'text-amber-400' : 'text-unjong-muted'}`}>{l.verdict.phrase}</span>
                  ) : null}
                  <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${gradeBadgeClass(l.gradeTier)}`}>{l.grade}</span>
                </span>
              </li>
            ))}
            {/* 재무 데이터 없는 종목: 재무 기반 렌즈(퀄리티·자산성장)를 숨기지 않고 "재무 데이터 없음"으로 정직하게 표시(왜 못 주는지 명시) */}
            {([['quality', t('noFin.quality')], ['assetgrowth', t('noFin.assetgrowth')]] as [string, string][])
              .filter(([k]) => !lenses.some((l) => l.key === k))
              .map(([k, label]) => (
                <li key={k} className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="text-unjong-muted">{label}</span>
                  <span className="shrink-0 text-[11px] text-unjong-muted">{t('noFin.label')}</span>
                </li>
              ))}
          </ul>
          <p className="text-[11px] leading-snug text-unjong-muted">{t('material')}</p>
          </div>
        ) : (
          <p className="text-[12px] leading-5 text-unjong-muted">{t('insufficient')}</p>
        )}
      </div>
      {briefState !== 'idle' && briefState !== 'error' && (
        <div className="mt-3 border-t border-unjong-border pt-3">
          <div className="mb-1.5 flex items-center gap-1">
            <Sparkles size={12} className="text-unjong-accent" />
            <span className="text-[12px] font-semibold text-unjong-accent">{t('briefTitle')}</span>
            <span className="ml-auto text-[10px] text-unjong-muted">{t('briefBadge')}</span>
          </div>
          {briefState === 'loading' ? (
            <p className="text-[12px] text-unjong-muted">{t('briefLoading')}</p>
          ) : (
            <p className="text-[13px] leading-6 text-unjong-primary">{brief}</p>
          )}
        </div>
      )}
        </>
      )}
      <Link href={`/stock/${stock.symbol}`} className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-accent/10 py-2 text-[12px] font-semibold text-unjong-accent hover:bg-unjong-accent/15">
        {etf?.isFund ? (etf.fundType === 'etn' ? t('ctaEtn') : t('ctaEtf')) : t('ctaLens')} →
      </Link>
    </div>
  );
}
