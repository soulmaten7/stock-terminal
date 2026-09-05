'use client';

import { useEffect, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { StockLogo } from '@/components/ui/StockLogo';
import { formatPrice } from '@/lib/currency';
import { changeColorClass } from '@/lib/lensTones';
import { pickLocale } from '@/lib/lensCopy';
import { resolveWatchlistName } from '@/lib/displayName';
import { useAuthStore } from '@/stores/authStore';
import { AsOfBadge } from '@/components/ui/AsOfBadge';
import { marketToday } from '@/lib/marketDate';

type WatchItem = { symbol: string; name_ko: string | null; name_en?: string | null; market: string; country: string; price: number | null; changePercent: number | null; unsupportedMarket?: boolean };

function pctText(v: number | null): string {
  if (v == null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
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
  const [asOf, setAsOf] = useState<Record<string, string>>({}); // 시장별 스냅샷 기준일(STEP 829 §7)
  const removing = useRef<Set<string>>(new Set()); // 해제 연타 방지(in-flight 가드)

  // user 변화 구독(STEP 800 §4) — 로그아웃(다른 탭 포함·AuthProvider가 onAuthStateChange로 store 갱신) 시 즉시 초기화.
  // 예전엔 deps []로 1회만 로드 → 로그아웃 후에도 이전 사용자 관심목록이 그대로 남던 개인정보 노출(TodayClient엔 이미 있는 가드).
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setItems([]); setAuth(false); setLoading(false); setLoadError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    fetch('/api/watchlist/quotes')
      .then((r) => { if (!r.ok) throw new Error('quotes'); return r.json(); }) // HTTP 오류도 실패로(빈목록으로 위장 금지·STEP 804 §4)
      .then((j) => {
        if (cancelled) return;
        const list: WatchItem[] = j.watchlist ?? [];
        setItems(list);
        setAsOf((j.asOf ?? {}) as Record<string, string>);
        setAuth(j.auth !== false);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setLoadError(true); setLoading(false); } }); // 실패는 '없음'이 아니라 에러로 표시
    return () => { cancelled = true; };
  }, [user, authLoading, reloadKey]);

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

  // 데이터 기준일 배지 — 홈 시장(ko=KR·en=US) 스냅샷이 오늘과 다를 때만(오늘·탐색과 같은 규칙·STEP 829 §7).
  //   관심목록은 시장 혼재 플랫 리스트라 TodayClient 관심 섹션과 같이 홈 시장 기준 단일 배지.
  const homeMarket = locale === 'en' ? 'US' : 'KR';
  const homeAsOf = asOf[homeMarket] ?? null;
  const showAsOf = homeAsOf != null && homeAsOf !== marketToday(homeMarket);

  return (
    <>
    {/* STEP 830 §9: 동적 에러를 스크린리더에 알림(관심 해제 실패 등) */}
    {actionError && <p role="alert" aria-live="assertive" className="mb-2 rounded-lg bg-unjong-danger/10 px-3 py-2 text-center text-[13px] text-unjong-danger">{actionError}</p>}
    {showAsOf && (
      <div className="mb-2 flex justify-end">
        <AsOfBadge date={homeAsOf} loc={locale} market={homeMarket} />
      </div>
    )}
    <ul className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface">
      {items.map((f) => (
        <li key={`${f.symbol}:${f.market}`} className="group flex items-start gap-2 border-b border-unjong-border px-3 py-2.5 last:border-0 hover:bg-unjong-background active:bg-unjong-background">
          {/* 행(로고·이름·티커·가격) 전체 클릭 → 종목 상세. 해제(X)만 분리.
              2026-09-05(ORDER_트릴리언모델잔재정리_0905 §24): 렌즈 요약 도트 제거(관심종목 기능 자체는 유지). */}
          <Link href={`/stock/${f.symbol}`} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
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
