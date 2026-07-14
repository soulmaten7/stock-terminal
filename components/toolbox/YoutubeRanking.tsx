'use client';

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
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

type Translate = ReturnType<typeof useTranslations>;
function fmtSubs(n: number, t: Translate) {
  if (n >= 10000) return t('youtube.tenK', { v: (n / 10000).toFixed(n >= 1000000 ? 0 : 1) });
  return n.toLocaleString();
}

export default function YoutubeRanking({ channels }: { channels: YtChannel[] }) {
  const t = useTranslations('Feed');
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
              stat={fmtSubs(c.subscriber_count, t)}
            />
            {(i + 1) % 10 === 0 && i + 1 < channels.length ? <AdSlotRow slot="feed" /> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
