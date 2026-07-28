'use client';

import { useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import { TONE_DOT_CLASS as TONE_DOT, changeColorClass, type Tone } from '@/lib/lensTones';
import { pickLocale } from '@/lib/lensCopy';
import { resolveWatchlistName } from '@/lib/displayName';
import { useAuthStore } from '@/stores/authStore';

type WatchItem = { symbol: string; name_ko: string | null; name_en?: string | null; market: string; country: string; price: number | null; changePercent: number | null; tones?: Tone[] | null; unsupportedMarket?: boolean };
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
  const pathname = usePathname(); // 로그인 후 관심 화면으로 복귀(next)
  const tb = useTranslations('Board'); // '관심종목 해제' 재사용(dedup)
  const locale = pickLocale(useLocale()); // 등락색 로케일 분기(STEP 777 §2)에 타입 필요 — 값은 무변(ko/en 그대로)
  const { user, isLoading: authLoading } = useAuthStore();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [auth, setAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false); // 조회 실패 — '없음'과 구분(STEP 804 §4)
  const [reloadKey, setReloadKey] = useState(0); // 재시도 트리거
  const [actionError, setActionError] = useState<string | null>(null); // 해제 실패 알림(STEP 804 §5)
  const [lensMap, setLensMap] = useState<Record<string, LensState>>({});
  const lensStarted = useRef(false);
  const removing = useRef<Set<string>>(new Set()); // 해제 연타 방지(in-flight 가드)

  // user 변화 구독(STEP 800 §4) — 로그아웃(다른 탭 포함·AuthProvider가 onAuthStateChange로 store 갱신) 시 즉시 초기화.
  // 예전엔 deps []로 1회만 로드 → 로그아웃 후에도 이전 사용자 관심목록이 그대로 남던 개인정보 노출(TodayClient·ExploreClient엔 이미 있는 가드).
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]); setLensMap({}); setAuth(false); setLoading(false); setLoadError(false); lensStarted.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    lensStarted.current = false; // 사용자 바뀌면 렌즈 큐 재시작 허용
    fetch('/api/watchlist/quotes')
      .then((r) => { if (!r.ok) throw new Error('quotes'); return r.json(); }) // HTTP 오류도 실패로(빈목록으로 위장 금지·STEP 804 §4)
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
      .catch(() => { if (!cancelled) { setLoadError(true); setLoading(false); } }); // 실패는 '없음'이 아니라 에러로 표시
    return () => { cancelled = true; };
  }, [user, authLoading, reloadKey]);

  // 행별 지연 렌즈 요약 — 선계산(lens_scores) 밖 종목만 동시성 4개 제한 큐로 실시간 폴백. 관심목록이 처음 채워질 때 한 번만 시작.
  useEffect(() => {
    if (items.length === 0 || lensStarted.current) return;
    lensStarted.current = true;
    let cancelled = false;
    const queue = items.filter((x) => x.tones == null && !x.unsupportedMarket); // 선계산 없는 것만(top-N 밖·비KR/US) — 지원 종료 시장은 조회 자체를 안 함(STEP 799)
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
    const key = `${symbol}:${market}`;
    if (removing.current.has(key)) return; // 연타 방지
    removing.current.add(key);
    const snapshot = items; // 롤백용
    setActionError(null);
    setItems((prev) => prev.filter((x) => !(x.symbol === symbol && x.market === market)));
    fetch('/api/watchlist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, market, add: false }),
    })
      .then((res) => { if (!res.ok) throw new Error('remove'); }) // res.ok 검사 — 실패면 롤백(STEP 804 §5)
      .catch(() => { setItems(snapshot); setActionError(t('removeFailed')); })
      .finally(() => { removing.current.delete(key); });
  };

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">{t('loading')}</p>;
  if (loadError) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm text-unjong-muted">{t('loadError')}</p>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-2 inline-block text-sm font-semibold text-unjong-accent">{t('retry')}</button>
      </div>
    );
  }
  if (!auth) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface py-10 text-center">
        <p className="text-sm text-unjong-muted">{t('loginForWatchlist')}</p>
        <Link href={`/auth/login?next=${encodeURIComponent(pathname)}`} className="mt-2 inline-block text-sm font-semibold text-unjong-accent">{t('loginLink')}</Link>
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
    <>
    {actionError && <p className="mb-2 rounded-lg bg-unjong-danger/10 px-3 py-2 text-center text-[13px] text-unjong-danger">{actionError}</p>}
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
                {f.unsupportedMarket ? (
                  <span className="block text-[11px] font-medium text-unjong-muted">{t('marketNotSupported')}</span>
                ) : (
                  <>
                    <span className="block text-sm font-semibold tabular-nums text-unjong-primary">{f.price != null ? formatPrice(f.price, f.country) : '—'}</span>
                    <span className={`block text-[11px] font-medium tabular-nums ${changeColorClass(f.changePercent, locale)}`}>{pctText(f.changePercent)}</span>
                  </>
                )}
              </span>
            </div>
            <div className="shrink-0 sm:flex sm:w-64 sm:justify-end">
              {f.unsupportedMarket ? null : <LensSummary lens={lensMap[f.symbol]} t={t} />}
            </div>
          </Link>
          {/* 히트영역 44px(STEP 795 §7) — 아이콘은 15px 유지, 패딩으로 확대. -my-1.5로 행 높이 영향 최소화. */}
          <button type="button" onClick={() => remove(f.symbol, f.market)} aria-label={tb('watchRemove')} className="-my-1.5 -mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center text-unjong-border transition-colors hover:text-unjong-danger">
            <X size={15} />
          </button>
        </li>
      ))}
    </ul>
    </>
  );
}
