'use client';

import WidgetCard from '@/components/home/WidgetCard';

// Investing.com 공식 경제 캘린더 위젯 — 무료, iframe 임베드
// countries: 5=US, 35=JP, 17=UK, 43=EU, 11=KR (investing.com 코드)
// timeZone=88 → Asia/Seoul, lang=18 → 한국어
const CALENDAR_SRC =
  'https://sslecal2.investing.com?' +
  'columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous' +
  '&features=datepicker,timezone' +
  '&countries=5,11,35,17,43' +
  '&calType=week' +
  '&timeZone=88' +
  '&lang=18';

export default function EconCalendarWidget() {
  return (
    <WidgetCard title="경제캘린더" subtitle="Investing.com">
      <iframe
        src={CALENDAR_SRC}
        className="w-full h-full border-0 min-h-[120px]"
        title="경제 캘린더 — Investing.com"
        scrolling="yes"
        allowFullScreen
      />
    </WidgetCard>
  );
}
