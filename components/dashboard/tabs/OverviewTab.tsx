'use client';

import type { DetailTab } from '../DetailTabs';

interface Props {
  onNavigateTab: (tab: DetailTab) => void;
}

export default function OverviewTab({ onNavigateTab }: Props) {
  return (
    <div className="divide-y divide-[#E5E7EB]">
      {/* 블록 1: 핵심 투자지표 */}
      <section className="py-3">
        <h4 className="text-[11px] font-bold text-[#444] mb-2 tracking-wide">핵심 투자지표</h4>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <Metric label="PER" value="--" />
          <Metric label="PBR" value="--" />
          <Metric label="시총" value="--" />
          <Metric label="배당수익률" value="--" />
          <Metric label="52주 신고" value="--" />
          <Metric label="52주 신저" value="--" />
        </dl>
      </section>

      {/* 블록 2: 투자자 수급 미니 (🇰🇷 전용, US 시 숨김) */}
      <ComingSoon
        title="투자자 수급 🇰🇷"
        note="외인 / 기관 / 개인 순매수 (STEP 72)"
      />

      {/* 블록 3: 뉴스 하이라이트 3건 */}
      <ComingSoon
        title="뉴스 하이라이트"
        note="최근 3건 (STEP 72)"
        onMore={() => onNavigateTab('news')}
        moreLabel="뉴스 전체 보기 →"
      />

      {/* 블록 4: 공시 하이라이트 3건 */}
      <ComingSoon
        title="공시 하이라이트"
        note="최근 3건 (STEP 72)"
        onMore={() => onNavigateTab('disclosures')}
        moreLabel="공시 전체 보기 →"
      />

      {/* 블록 5: 재무 미니 */}
      <ComingSoon
        title="재무 미니"
        note="매출·영업이익 4분기 (STEP 72)"
        onMore={() => onNavigateTab('financials')}
        moreLabel="재무 전체 보기 →"
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-[#999]">{label}</dt>
      <dd className="font-medium text-black tabular-nums">{value}</dd>
    </div>
  );
}

function ComingSoon({
  title,
  note,
  onMore,
  moreLabel,
}: {
  title: string;
  note: string;
  onMore?: () => void;
  moreLabel?: string;
}) {
  return (
    <section className="py-3">
      <h4 className="text-[11px] font-bold text-[#444] mb-1 tracking-wide">{title}</h4>
      <p className="text-[11px] text-[#BBB]">{note}</p>
      {onMore && moreLabel && (
        <button
          onClick={onMore}
          className="mt-1 text-[11px] text-[#0ABAB5] hover:underline"
        >
          {moreLabel}
        </button>
      )}
    </section>
  );
}
