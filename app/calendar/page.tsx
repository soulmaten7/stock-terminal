import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const metadata = { title: "경제 캘린더 — 트릴리언" };

export default function CalendarPage() {
  return (
    <div className="max-w-screen-md mx-auto px-6 py-12 text-center">
      <h1 className="text-2xl font-bold text-unjong-primary mb-3">📅 경제 캘린더</h1>
      <p className="text-sm text-unjong-muted mb-6 leading-normal">
        FOMC·CPI·NFP·고용지표 등 글로벌 경제 일정.
        <br />
        가장 풍부한 경제 캘린더는 Investing.com 입니다.
      </p>
      <a
        href="https://kr.investing.com/economic-calendar/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-unjong-accent text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
      >
        Investing.com 경제 캘린더 열기
        <ExternalLink size={16} />
      </a>
      <p className="text-xs text-unjong-muted mt-4">트릴리언은 외부 정확한 정보로 동선 안내 (허브 정체성)</p>
      <div className="mt-8">
        <Link href="/" className="text-xs text-unjong-muted hover:text-unjong-primary">← 홈으로</Link>
      </div>
    </div>
  );
}
