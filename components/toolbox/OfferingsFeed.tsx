'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import IpoFeed from './IpoFeed';

// 🅿️ 2026-08-16 STEP1048 — 배당 탭 파킹(KR 파일럿 스키마 DB 제거에 따른 조치).
// 토글은 그대로 두되(라벨 'Home.category.ipo'="공모주·배당"은 US 탭에서 여전히 사실이라 무접촉),
// '배당' 선택 시 <DividendFeed/>(dividends 테이블 조회) 대신 사유를 밝히는 문구만 보여준다.
// 활성화 방법: docs/PARKED_KR_DIVIDEND_ACTIVATION.md
// (DividendFeed.tsx·app/api/dividend/feed/route.ts는 삭제하지 않고 그대로 남아 있다 — 호출만 끊었다.)
export default function OfferingsFeed() {
  const t = useTranslations('Feed');
  const [view, setView] = useState<'ipo' | 'div'>('ipo');
  return (
    <div>
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setView('ipo')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'ipo' ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          {t('offerings.ipo')}
        </button>
        <button
          type="button"
          onClick={() => setView('div')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'div' ? 'bg-unjong-strong text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          {t('offerings.dividend')}
        </button>
      </div>
      {view === 'ipo' ? (
        <IpoFeed />
      ) : (
        <div className="py-8 text-center">
          <p className="text-sm text-unjong-muted">{t('offerings.dividendPaused')}</p>
        </div>
      )}
    </div>
  );
}
