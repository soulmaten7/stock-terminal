'use client';

import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';

// 관심종목 별 토글 버튼 — 탐색 리스트(ExploreClient) 전용이던 것을 공용 추출(STEP 781 §2).
// 기본 className(생략 시)은 탐색의 기존 스타일과 byte 동일 — 탐색 쪽 호출부는 프롭 없이 그대로 써서 회귀 없음.
export function WatchStar({ symbol, watched, onToggle, className }: {
  symbol: string; watched: boolean; onToggle: (symbol: string) => void; className?: string;
}) {
  const t = useTranslations('Board');
  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(symbol); }}
      aria-label={watched ? t('watchRemove') : t('watchAdd')}
      className={className ?? `hidden h-11 w-11 shrink-0 items-center justify-center transition-colors sm:flex ${watched ? 'text-unjong-mint' : 'text-unjong-border'}`}
    >
      <Star size={18} fill={watched ? 'currentColor' : 'none'} />
    </button>
  );
}
