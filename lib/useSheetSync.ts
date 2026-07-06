'use client';

import { useEffect, useRef } from 'react';

/**
 * 보드의 "선택된 종목(시트/펼침)" 상태를 URL 쿼리(?s=SYMBOL)에 동기화한다.
 *
 * 목적: 모바일에서 종목 시트를 열고 → AI 렌즈로 종목 페이지 이동 → "뒤로"를 누르면
 *       맨 보드(=홈처럼 보임)가 아니라 "그 종목 시트가 다시 열린 상태"로 복원되게 한다.
 *
 * 원리: 시트를 열 때 history에 ?s=SYMBOL 한 칸을 push → 종목 페이지에서 router.back()
 *       하면 그 항목으로 돌아오고, popstate/최초 마운트에서 ?s를 읽어 시트를 되살린다.
 */
type HasSymbol = { symbol: string };

export function useSheetSync<T extends HasSymbol>(
  rows: T[],
  setSelected: (r: T | null) => void,
  setExpanded?: (b: boolean) => void,
) {
  const restored = useRef(false);

  // (1) 최초로 rows가 채워질 때 URL에 ?s=가 있으면 그 시트를 복원
  useEffect(() => {
    if (restored.current || rows.length === 0) return;
    restored.current = true;
    const s = new URLSearchParams(window.location.search).get('s');
    if (!s) return;
    const row = rows.find((r) => r.symbol === s);
    if (row) setSelected(row);
  }, [rows, setSelected]);

  // (2) 뒤로/앞으로(popstate) → URL ?s= 기준으로 시트 상태를 맞춤
  useEffect(() => {
    function onPop() {
      const s = new URLSearchParams(window.location.search).get('s');
      const row = s ? rows.find((r) => r.symbol === s) ?? null : null;
      setSelected(row);
      setExpanded?.(false);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [rows, setSelected, setExpanded]);
}

/** 시트 열기: 보드에서 처음 열면 push(뒤로 1번=시트 복원), 시트끼리 전환이면 replace(칸 안 쌓음). */
export function openSheetUrl(symbol: string) {
  const url = new URL(window.location.href);
  const had = url.searchParams.get('s');
  url.searchParams.set('s', symbol);
  if (had) window.history.replaceState({ s: symbol }, '', url);
  else window.history.pushState({ s: symbol }, '', url);
}

/** 시트 닫기(사용자 동작): URL에 ?s=가 있으면 history.back()으로 그 칸을 제거(그러면 popstate가 닫음). 없으면 false 반환→직접 닫기. */
export function closeSheetUrl(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('s')) {
    window.history.back();
    return true;
  }
  return false;
}

/** 프로그램상 닫기(탭 전환 등, history 이동 없이): URL의 ?s=만 조용히 제거. */
export function stripSheetUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (url.searchParams.has('s')) {
    url.searchParams.delete('s');
    window.history.replaceState({}, '', url);
  }
}
