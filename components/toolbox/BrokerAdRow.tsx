'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { boardBrokerAd, type BoardBrokerAd } from '@/lib/ads';

// 종목 리스트 10개마다 들어가는 증권사 광고(하우스/데모 → 유료 교체).
// 소재 있을 때만 렌더(없는 언어권은 슬롯만 배선·비노출). 랭킹과 시각 분리: '광고' 라벨 + 옅은 배경.
// "거래처 안내"지 "투자권유" 아님(§5 KR).
function AdInner({ ad }: { ad: BoardBrokerAd }) {
  const t = useTranslations('Feed');
  return (
    <a
      href={ad.url}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      className="flex items-center gap-2.5 px-2 py-2.5 transition-colors hover:bg-unjong-mint/[0.1]"
    >
      <span className="shrink-0 rounded bg-unjong-mint/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-mint">{t('ad')}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${ad.domain}&sz=64`}
        alt=""
        width={22}
        height={22}
        className="h-[22px] w-[22px] shrink-0 rounded"
        onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
      />
      <span className="shrink-0 text-sm font-medium text-unjong-primary">{ad.name}</span>
      {ad.note ? <span className="hidden truncate text-xs text-unjong-muted sm:inline">{ad.note}</span> : null}
      <span className="ml-auto flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] text-unjong-muted">
        {ad.cta ?? t('goto')} <ExternalLink size={12} />
      </span>
    </a>
  );
}

// PC 표 안 = colSpan tr / 모바일 카드 = div. 소재 없으면 null(비노출).
export function BrokerAdTr({ locale = 'ko', colSpan = 6 }: { locale?: string; colSpan?: number }) {
  const ad = boardBrokerAd(locale);
  if (!ad) return null;
  return (
    <tr className="border-b border-unjong-border bg-unjong-mint/[0.05]">
      <td colSpan={colSpan} className="p-0">
        <AdInner ad={ad} />
      </td>
    </tr>
  );
}

export function BrokerAdCard({ locale = 'ko' }: { locale?: string }) {
  const ad = boardBrokerAd(locale);
  if (!ad) return null;
  return (
    <div className="border-b border-unjong-border bg-unjong-mint/[0.05]">
      <AdInner ad={ad} />
    </div>
  );
}
