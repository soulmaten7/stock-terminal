import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CalendarPageClient from '@/components/calendar/CalendarPageClient';

export const metadata = { title: '경제 캘린더 — StockTerminal' };

export default function CalendarPage() {
  return (
    <div className="w-full px-6 py-6">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">경제 캘린더</h1>
        <p className="text-sm text-[#666]">
          향후 60일간 주요 경제 지표 발표 일정. 큐레이션 데이터(상단) + Investing.com 공식 위젯(하단) 병렬 제공.
        </p>
      </div>

      <CalendarPageClient />
    </div>
  );
}
