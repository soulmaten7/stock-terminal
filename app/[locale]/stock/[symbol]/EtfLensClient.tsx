'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/authStore';
import { ExternalLink, Layers, ArrowLeft, Star } from 'lucide-react';

// 현재가 통화기호용 국가 코드 — StockLensClient.tsx와 동일 규칙(중복은 기존 두 파일 관례).
const countryOf = (s: string) =>
  /^\d{6}(\.(KS|KQ))?$/i.test(s) ? 'KR'
  : /\.T$/i.test(s) ? 'JP'
  : /\.HK$/i.test(s) ? 'HK'
  : /\.(SS|SZ)$/i.test(s) ? 'CN'
  : /\.VN$/i.test(s) ? 'VN'
  : /\.L$/i.test(s) ? 'GB' : 'US';

type Holding = { sym: string; name: string; weight: number };
type Sector = { key: string; weight: number };
type EtfData = {
  isFund: boolean;
  fundType?: 'etf' | 'etn' | 'stock';
  symbol: string;
  family: string | null;
  category: string | null;
  expenseRatio: number | null;
  holdings: Holding[];
  sectors: Sector[];
  source?: string;
  sourceUrl?: string;
};

// 모듈 상수라 훅을 못 쓴다 → 값=ko.json 키. 매핑에 없는 섹터는 원문 키 그대로(번역 대상 아님).
type Translate = ReturnType<typeof useTranslations>;
const SECTOR_KEYS: Record<string, string> = {
  // Yahoo(US)
  realestate: 'sector.realestate', consumer_cyclical: 'sector.consumer_cyclical', basic_materials: 'sector.basic_materials',
  consumer_defensive: 'sector.consumer_defensive', technology: 'sector.technology', financial_services: 'sector.financial_services',
  healthcare: 'sector.healthcare', industrials: 'sector.industrials', communication_services: 'sector.communication_services',
  energy: 'sector.energy', utilities: 'sector.utilities',
  // 네이버(KR)
  it: 'sector.it', financials: 'sector.financials', materials: 'sector.materials', health_care: 'sector.health_care',
  consumer_discretionary: 'sector.consumer_discretionary', consumer_staples: 'sector.consumer_staples',
  communication: 'sector.communication', real_estate: 'sector.real_estate', unclassified: 'sector.unclassified', etc: 'sector.etc',
};
const sectorLabel = (k: string, t: Translate) => {
  const key = SECTOR_KEYS[(k ?? '').toLowerCase()];
  return key ? t(key) : k;
};
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

// 상세 헤더 아이콘 전용 관심 별(STEP 771 §2) — StockLensClient.tsx와 동일 구현(중복은 기존 두 파일 관례).
function WatchStarToggle({ symbol, name, country }: { symbol: string; name: string; country: string }) {
  const tb = useTranslations('Board'); // '관심종목 추가/해제' 재사용(dedup)
  const { user } = useAuthStore();
  const [watched, setWatched] = useState<boolean | null>(null); // null=조회 전
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (!user) { setWatched(false); return; }
    let alive = true;
    fetch('/api/watchlist').then((r) => r.json()).then((j) => {
      if (!alive) return;
      const set = new Set(((j.watchlist ?? []) as { symbol: string }[]).map((w) => w.symbol));
      setWatched(set.has(symbol));
    }).catch(() => { if (alive) setWatched(false); });
    return () => { alive = false; };
  }, [user, symbol]);

  function toggle() {
    if (!user) { window.location.href = '/auth/login'; return; }
    const next = !watched;
    setWatched(next);
    setPop(true);
    setTimeout(() => setPop(false), 200);
    const market = country === 'KR' ? 'KRX' : country;
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, name_ko: name, market, country, add: next }),
    }).catch(() => setWatched(!next));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={watched ? tb('watchRemove') : tb('watchAdd')}
      className={`flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-200 ${pop ? 'scale-125' : 'scale-100'} ${watched ? 'text-unjong-accent' : 'text-unjong-muted'}`}
    >
      <Star size={24} fill={watched ? 'currentColor' : 'none'} />
    </button>
  );
}

export default function EtfLensClient({ symbol, initialName }: { symbol: string; initialName?: string }) {
  const t = useTranslations('EtfLens');
  const router = useRouter();
  const ticker = symbol.split('.')[0];
  const [data, setData] = useState<EtfData | null>(null);
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetch('/api/etf-holdings?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (alive) { setData(j); setState('done'); } })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [symbol]);

  const hasHoldings = (data?.holdings?.length ?? 0) > 0;
  const maxW = hasHoldings ? Math.max(...data!.holdings.map((h) => h.weight)) : 1;
  const isEtn = data?.fundType === 'etn';
  // 영문명(en 로케일)에도 걸리게 — 한국어 키워드만 보던 시절엔 /en에서 경고가 꺼졌다. 'bear'는 종목명에 흔해 오탐이라 제외.
  const leveraged = /레버리지|인버스|leverage|inverse|\b\d+x\b/i.test(initialName ?? '');

  return (
    // 너비·뒤로가기는 종목 상세(StockLensClient)와 동일하게 — max-w-7xl main + max-w-4xl 콘텐츠 + router.back()
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <button type="button" onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) router.back(); else router.push('/'); }} className="inline-flex min-h-11 items-center gap-1.5 text-sm text-unjong-muted hover:text-unjong-accent">
        <ArrowLeft size={20} />
        {t('back')}
      </button>

      <div className="mt-3 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-unjong-primary">{initialName || ticker}</h1>
            <span className="rounded bg-unjong-background px-1.5 py-0.5 text-[13px] sm:text-[11px] font-medium text-unjong-muted">{isEtn ? t('badgeEtn') : t('badgeEtf')}</span>
          </div>
          <p className="mt-0.5 text-[13px] sm:text-[12px] tabular-nums text-unjong-muted">{ticker}</p>
        </div>
        <WatchStarToggle symbol={symbol} name={initialName || ticker} country={countryOf(symbol)} />
      </div>

      {isEtn ? (
        /* ETN = 전략형(바스켓 없음) → 상품 정보 + 주의 */
        <div className="mt-4 rounded-2xl border border-unjong-border bg-unjong-surface p-5">
          <div className="mb-2 flex items-center gap-1.5">
            <Layers size={14} className="text-unjong-accent" />
            <span className="text-[13px] font-semibold text-unjong-primary">{t('etnTitle')}</span>
            <span className="ml-auto text-[13px] sm:text-[10px] text-unjong-muted">{t('etnBadge')}</span>
          </div>
          <p className="text-[13px] leading-6 text-unjong-primary">{t.rich('etnBody', { b: (c) => <b>{c}</b> })}</p>
          <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-2.5 text-[13px] sm:text-[12px] leading-5 text-amber-300">{t('etnWarn')}{leveraged ? t('etnWarnLeveraged') : ''}</p>
        </div>
      ) : (
        <>
      {/* 개요 카드 */}
      <div className="mt-4 rounded-2xl border border-unjong-border bg-unjong-surface p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Layers size={14} className="text-unjong-accent" />
          <span className="text-[13px] font-semibold text-unjong-primary">{t('compositionTitle')}</span>
          <span className="ml-auto text-[13px] sm:text-[10px] text-unjong-muted">{t('compositionBadge')}</span>
        </div>
        <div className="grid grid-cols-3 gap-y-2 text-center">
          <div><p className="text-[13px] sm:text-[11px] text-unjong-muted">{t('family')}</p><p className="truncate text-sm font-semibold text-unjong-primary">{data?.family ?? '—'}</p></div>
          <div><p className="text-[13px] sm:text-[11px] text-unjong-muted">{t('category')}</p><p className="truncate text-sm font-semibold text-unjong-primary">{data?.category ?? '—'}</p></div>
          <div><p className="text-[13px] sm:text-[11px] text-unjong-muted">{t('expense')}</p><p className="text-sm font-semibold text-unjong-primary">{data?.expenseRatio != null ? pct(data.expenseRatio) : '—'}</p></div>
        </div>
      </div>

      {state === 'loading' ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-unjong-background" />
      ) : !hasHoldings ? (
        <div className="mt-4 rounded-2xl border border-unjong-border bg-unjong-surface p-6 text-center">
          <p className="text-sm font-medium text-unjong-primary">{t('emptyTitle')}</p>
          <p className="mt-1 text-[13px] sm:text-[12px] text-unjong-muted">{t('emptyDesc')}</p>
        </div>
      ) : (
        <>
          {/* 상위 보유종목 */}
          <div className="mt-4 rounded-2xl border border-unjong-border bg-unjong-surface p-4">
            <p className="mb-2 text-[13px] font-semibold text-unjong-primary">{t('holdingsTitle')} <span className="font-normal text-unjong-muted">{t('holdingsCount', { n: data!.holdings.length })}</span></p>
            <ul className="space-y-2">
              {data!.holdings.map((h) => (
                <li key={h.sym || h.name} className="flex items-center gap-2 text-[13px]">
                  <span className="w-16 shrink-0 truncate tabular-nums text-unjong-muted">{h.sym}</span>
                  <span className="min-w-0 flex-1 truncate text-unjong-primary">{h.name}</span>
                  <span className="relative h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-unjong-background">
                    <span className="absolute inset-y-0 left-0 rounded-full bg-unjong-accent/60" style={{ width: `${Math.max(6, (h.weight / maxW) * 100)}%` }} />
                  </span>
                  <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-unjong-primary">{pct(h.weight)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 섹터 비중 */}
          {data!.sectors.length > 0 && (
            <div className="mt-4 rounded-2xl border border-unjong-border bg-unjong-surface p-4">
              <p className="mb-2 text-[13px] font-semibold text-unjong-primary">{t('sectorsTitle')}</p>
              <ul className="space-y-1.5">
                {[...data!.sectors].sort((a, b) => b.weight - a.weight).map((s) => (
                  <li key={s.key} className="flex items-center gap-2 text-[13px] sm:text-[12px]">
                    <span className="w-20 shrink-0 truncate text-unjong-muted">{sectorLabel(s.key, t)}</span>
                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-unjong-background">
                      <span className="absolute inset-y-0 left-0 rounded-full bg-unjong-strong/30" style={{ width: `${s.weight * 100}%` }} />
                    </span>
                    <span className="w-12 shrink-0 text-right tabular-nums text-unjong-primary">{pct(s.weight)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
        </>
      )}

      {/* 출처 */}
      {data?.sourceUrl && (
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1 text-[13px] sm:text-[11px] text-unjong-muted hover:text-unjong-accent">
          {t('sourcePrefix')} {data.source} <ExternalLink size={11} />
        </a>
      )}
      <p className="mt-3 text-[13px] sm:text-[11px] leading-relaxed text-unjong-muted">{t('disclaimer')}</p>
      </div>
    </div>
  );
}
