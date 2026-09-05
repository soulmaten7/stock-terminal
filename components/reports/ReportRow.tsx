'use client';

// 리포트 피드 카드 — 홈("오늘의 증권사 리포트"/"오늘의 실적 가이던스")과 /reports 목록이
// 공유(ORDER_트릴리언홈피드_0905 STEP2). 상세(reasons·earningsSummary)는 종목 페이지에서 보여준다.
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/lib/lensCopy';
import { TONE_DOT_CLASS as TONE_DOT, type Tone } from '@/lib/lensTones';
import { StockLogo } from '@/components/ui/StockLogo';
import type { HomeReportItem } from '@/lib/channelReports';

// 판별 결과는 채널 수집 코드가 쓰는 한국어 고정 어휘 — en 화면에서도 뜻이 통하도록 표시용
// 라벨만 병기(원본 값은 그대로 저장). '신규제시'는 US 가이던스 적재(2026-09-05)로 새로 들어온 값.
const VERDICT_LABEL: Record<string, { ko: string; en: string }> = {
  '상향': { ko: '상향', en: 'Raised' },
  '유지': { ko: '유지', en: 'Maintained' },
  '하향': { ko: '하향', en: 'Lowered' },
  '신규제시': { ko: '신규제시', en: 'New guidance' },
};

const CURRENT_PRICE_LABEL: Record<Locale, string> = { ko: '현재 주가', en: 'Current price' };

export function verdictLabel(loc: Locale, verdict: string | null): string {
  if (!verdict) return '—';
  return VERDICT_LABEL[verdict]?.[loc] ?? verdict;
}

function verdictTone(verdict: string | null): Tone {
  if (verdict === '상향') return 'pos';
  if (verdict === '하향') return 'warn';
  return 'flat'; // 유지·신규제시 — 상향/하향과 구분되는 중립 톤
}

// compact=true(홈) — 증권사·판정 줄을 뺀 2줄 카드(제목이 이미 훅 역할, 상세는 클릭하면 종목
// 페이지에서). /reports 목록(compact 미지정)은 기존처럼 증권사·판정 줄까지 보여준다.
export function ReportRow({ item, loc, compact = false }: { item: HomeReportItem; loc: Locale; compact?: boolean }) {
  return (
    <Link
      href={`/stock/${item.symbol}`}
      className="flex items-center gap-2.5 border-b border-unjong-border py-2.5 last:border-0 hover:bg-unjong-background/60 active:bg-unjong-background"
    >
      <StockLogo code={item.symbol} name={item.stock_name} size={30} />
      <div className="min-w-0 flex-1">
        {/* 종목명(강조)·영상 제목(보조 톤)을 한 줄에 — 종목명은 잘리지 않게, 제목만 넘치면 말줄임 */}
        <p className="flex items-baseline gap-1.5 overflow-hidden">
          <span className="shrink-0 text-[17px] font-semibold text-unjong-primary sm:text-sm">{item.stock_name}</span>
          {item.title ? <span className="truncate text-[13px] text-unjong-muted sm:text-[11px]">{item.title}</span> : null}
        </p>
        {!compact ? (
          <p className="flex items-center gap-1.5 text-[15px] text-unjong-muted sm:text-[12px]">
            <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT[verdictTone(item.verdict)]}`} />
            <span className="truncate">{item.broker} · {verdictLabel(loc, item.verdict)}</span>
          </p>
        ) : null}
      </div>
      {/* 홈·목록 카드는 목표주가가 아니라 현재가만(2026-09-05) — 목표주가·상승여력은 클릭해
          종목 페이지에서. current_price가 없으면 자리 자체를 비운다(레이아웃은 유지, "—" 안 씀). */}
      {item.current_price ? (
        <div className="shrink-0 text-right">
          <p className="text-[11px] text-unjong-muted sm:text-[10px]">{CURRENT_PRICE_LABEL[loc]}</p>
          <span className="text-[15px] font-semibold tabular-nums text-unjong-primary sm:text-sm">{item.current_price}</span>
        </div>
      ) : null}
    </Link>
  );
}
