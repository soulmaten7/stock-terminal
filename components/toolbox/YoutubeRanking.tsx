'use client';

import { Fragment } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ListRow from './ListRow';
import AdSlotRow from './AdSlotRow';

export type YtChannel = {
  rank: number;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number;
  channel_url: string;
  week_label: string | null;
  description?: string | null;
};

// 구독자수 축약 — 언어권마다 자릿수 단위가 다르다(한국어=만·억 / 영어=K·M).
// 메시지 키로 나누면 로케일마다 '나눗셈'까지 달라져 키 1:1이 깨진다 → Intl 표준 compact 표기에 맡긴다.
//   ko: 12,000 → "1.2만" · 3,400,000 → "340만" · 340,000,000 → "3.4억"
//   en: 12,000 → "12K"   · 3,400,000 → "3.4M"
// 단, 각 언어의 첫 단위 미만은 그냥 원래 숫자로(ko가 5,000을 "5천"으로 쓰지 않도록).
const COMPACT_FLOOR: Record<string, number> = { ko: 10000, en: 1000 };

function fmtSubs(n: number, locale: string) {
  const floor = COMPACT_FLOOR[locale] ?? 10000;
  if (n < floor) return n.toLocaleString(locale);
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export default function YoutubeRanking({ channels }: { channels: YtChannel[] }) {
  const t = useTranslations('Feed');
  const locale = useLocale();
  if (!channels || channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="mb-2 text-2xl">📺</span>
        <p className="text-sm font-medium text-unjong-primary">{t('youtube.empty')}</p>
        <p className="mt-1 text-xs text-unjong-muted">{t('youtube.soon')}</p>
      </div>
    );
  }
  const weekLabel = channels[0]?.week_label;
  return (
    <section className="min-w-0">
      {weekLabel ? (
        <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">{t('youtube.weekly', { w: weekLabel })}</p>
      ) : null}
      <div>
        {channels.map((c, i) => (
          <Fragment key={c.rank}>
            <ListRow
              href={c.channel_url}
              rank={c.rank}
              iconUrl={c.thumbnail_url}
              iconRound
              title={c.title}
              meta={c.description ?? ''}
              stat={fmtSubs(c.subscriber_count, locale)}
            />
            {(i + 1) % 10 === 0 && i + 1 < channels.length ? <AdSlotRow slot="feed" /> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
