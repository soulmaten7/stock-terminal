'use client';

// 리포트 피드 카드 — 홈("오늘의 증권사 리포트"/"오늘의 실적 가이던스")과 /reports 목록이
// 공유(ORDER_트릴리언홈피드_0905 STEP2). 상세(reasons·earningsSummary)는 종목 페이지에서 보여준다.
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/lib/lensCopy';
import { TONE_DOT_CLASS as TONE_DOT, type Tone } from '@/lib/lensTones';
import { StockLogo } from '@/components/ui/StockLogo';
import type { HomeReportItem } from '@/lib/channelReports';

// 판별 결과는 채널 수집 코드(hankyung_consensus.py classify_target_change)가 쓰는 한국어
// 고정 어휘 3개뿐 — en 화면에서도 뜻이 통하도록 표시용 라벨만 병기(원본 값은 그대로 저장).
const VERDICT_LABEL: Record<string, { ko: string; en: string }> = {
  '상향': { ko: '상향', en: 'Raised' },
  '유지': { ko: '유지', en: 'Maintained' },
  '하향': { ko: '하향', en: 'Lowered' },
};

export function verdictLabel(loc: Locale, verdict: string | null): string {
  if (!verdict) return '—';
  return VERDICT_LABEL[verdict]?.[loc] ?? verdict;
}

function verdictTone(verdict: string | null): Tone {
  if (verdict === '상향') return 'pos';
  if (verdict === '하향') return 'warn';
  return 'flat';
}

export function ReportRow({ item, loc }: { item: HomeReportItem; loc: Locale }) {
  return (
    <Link
      href={`/stock/${item.symbol}`}
      className="flex items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 hover:bg-unjong-background/60 active:bg-unjong-background"
    >
      <StockLogo code={item.symbol} name={item.stock_name} size={30} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[17px] font-semibold text-unjong-primary sm:text-sm">{item.stock_name}</p>
        <p className="flex items-center gap-1.5 text-[15px] text-unjong-muted sm:text-[12px]">
          <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT[verdictTone(item.verdict)]}`} />
          <span className="truncate">{item.broker} · {verdictLabel(loc, item.verdict)}</span>
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="text-[15px] font-semibold tabular-nums text-unjong-primary sm:text-sm">{item.target_price ?? '—'}</span>
      </div>
    </Link>
  );
}
