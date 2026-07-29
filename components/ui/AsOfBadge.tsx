'use client';

import { useTranslations } from 'next-intl';
import { marketToday } from '@/lib/marketDate';
import type { Locale } from '@/lib/lensCopy';

// 데이터 기준일 배지 — 오늘·탐색·관심이 공유(STEP 829 §7: 화면 간 같은 컴포넌트·같은 규칙).
// 규칙: 기준일이 그 시장 로컬 '오늘'과 다를 때만 노출("금요일 기준"). 신선하면 아무것도 안 뜬다.
//   UTC 대신 marketToday로 비교 — KST 새벽(UTC 하루 뒤처짐)에 어제 데이터가 '오늘'로 오판돼 배지가 숨던 버그 방지(STEP 804 §3).
function weekdayOf(dateStr: string, loc: Locale): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return new Intl.DateTimeFormat(loc === 'en' ? 'en-US' : 'ko-KR', { weekday: 'long', timeZone: 'UTC' }).format(d);
}

export function AsOfBadge({ date, loc, market = 'KR' }: { date: string | null; loc: Locale; market?: string }) {
  const t = useTranslations('Today');
  if (!date || date === marketToday(market)) return null;
  return <span className="ml-2 rounded-full bg-unjong-background px-2 py-0.5 text-[13px] font-medium text-unjong-muted sm:text-[11px]">{t('asOfDay', { day: weekdayOf(date, loc) })}</span>;
}
