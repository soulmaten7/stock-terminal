'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search as SearchIcon, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { StockLogo } from '@/components/ui/StockLogo';
import { pickLocale } from '@/lib/lensCopy';

// 헤더 전역 검색 — 2026-09-05(ORDER_트릴리언모델잔재정리_0905 §13) /explore 폐지로 사라지는
// 전역 종목 검색을 헤더로 옮김. /api/search는 그대로 재사용(로직·응답 계약 무변경). 모바일에서도
// 접근 가능해야 해서(explore 탭 폐지로 하단 탭바에 대체 진입로가 없음) 아이콘은 항상 노출하고,
// 클릭 시 전체화면 오버레이로 연다 — 언어 선택 드롭다운(작은 패널)과 달리 입력+결과 목록이 필요해
// 이 저장소에 별도 모달 컴포넌트가 없는 점을 감안해 오버레이 방식을 새로 택함(판단 근거).
type SearchItem = { symbol: string; name: string; country: string; type: 'stock' | 'etf' };
const RECENTS_KEY = 'header_recent_searches';

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export default function HeaderSearch() {
  const t = useTranslations('Search');
  const lang = pickLocale(useLocale());
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recents, setRecents] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch { /* localStorage 불가 환경 무시 */ }
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  function saveRecent(item: SearchItem) {
    setRecents((prev) => {
      const next = [item, ...prev.filter((r) => r.symbol !== item.symbol)].slice(0, 3);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* 무시 */ }
      return next;
    });
  }
  function removeRecent(symbol: string) {
    setRecents((prev) => {
      const next = prev.filter((r) => r.symbol !== symbol);
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* 무시 */ }
      return next;
    });
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const j = await fetchJson<{ items: SearchItem[] }>(`/api/search?q=${encodeURIComponent(q)}&lang=${lang}`);
      setResults(j?.items ?? []);
      setActiveIdx(-1);
      setLoading(false);
    }, 300); // IME 안전: compositionend 대신 값 기반 디바운스만
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, lang]);

  function close() {
    setOpen(false);
    setQuery('');
    setResults([]);
  }
  function goToResult(item: SearchItem) {
    saveRecent(item);
    close();
    router.push(`/stock/${item.symbol}`);
  }
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { close(); return; }
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); goToResult(results[activeIdx]); }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 min-w-11 items-center justify-center text-white/70 transition-colors hover:text-white"
        aria-label={t('searchPlaceholder')}
        title={t('searchPlaceholder')}
      >
        <SearchIcon size={18} />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[60] bg-black/50 px-4 pt-[10vh] sm:px-6" onClick={close}>
          <div className="mx-auto max-w-[560px]" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-unjong-muted" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t('searchPlaceholder')}
                className="h-[52px] w-full rounded-2xl border border-unjong-border bg-unjong-surface pl-11 pr-11 text-[15px] text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-mint"
              />
              <button type="button" onClick={close} aria-label={t('searchClear')} className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-unjong-muted">
                <X size={16} />
              </button>
            </div>
            <div role="listbox" aria-live="polite" className="mt-1.5 max-h-[70vh] overflow-y-auto rounded-2xl border border-unjong-border bg-unjong-surface py-1.5 shadow-lg">
              {!query.trim() ? (
                recents.length === 0 ? null : (
                  <>
                    <p className="px-4 pb-1 pt-2 text-[11px] font-medium text-unjong-muted">{t('recentSearches')}</p>
                    {recents.map((r) => (
                      <div key={`${r.symbol}-${r.country}`} className="flex w-full items-center gap-2.5 px-4 py-2.5 hover:bg-unjong-background active:bg-unjong-background">
                        <button type="button" onClick={() => goToResult(r)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                          <StockLogo code={r.symbol} name={r.name} size={28} />
                          <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-unjong-primary">{r.name}</span>
                          <span className="shrink-0 text-[12px] font-medium text-unjong-muted">{r.country}</span>
                        </button>
                        <button type="button" onClick={() => removeRecent(r.symbol)} aria-label={t('removeRecent')} className="flex h-11 w-11 shrink-0 items-center justify-center text-unjong-muted hover:text-unjong-primary active:bg-unjong-background">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </>
                )
              ) : loading ? (
                <p className="py-6 text-center text-[15px] text-unjong-muted">…</p>
              ) : results.length === 0 ? (
                <p className="py-6 text-center text-[15px] text-unjong-muted">{t('noSearchResults')}</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={`${r.symbol}-${r.country}`}
                    type="button"
                    role="option"
                    aria-selected={i === activeIdx}
                    onClick={() => goToResult(r)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-unjong-background active:bg-unjong-background ${i === activeIdx ? 'bg-unjong-background' : ''}`}
                  >
                    <StockLogo code={r.symbol} name={r.name} size={28} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-unjong-primary">{r.name}</span>
                    <span className="shrink-0 text-[12px] font-medium text-unjong-muted">{r.country}</span>
                    <span className="shrink-0 rounded bg-unjong-background px-1.5 py-0.5 text-[10px] font-medium text-unjong-muted">{r.type.toUpperCase()}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
