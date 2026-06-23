'use client';

import ListRow from './ListRow';

export type YtChannel = {
  rank: number;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number;
  channel_url: string;
  week_label: string | null;
};

function fmtSubs(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 1000000 ? 0 : 1)}만`;
  return n.toLocaleString();
}

export default function YoutubeRanking({ channels }: { channels: YtChannel[] }) {
  if (!channels || channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="mb-2 text-2xl">📺</span>
        <p className="text-sm font-medium text-unjong-primary">유튜브 Top100 — 데이터 준비 중</p>
        <p className="mt-1 text-xs text-unjong-muted">곧 채워집니다</p>
      </div>
    );
  }
  const weekLabel = channels[0]?.week_label;
  return (
    <section className="min-w-0">
      {weekLabel ? (
        <p className="border-b border-unjong-border px-1 py-2.5 text-[11px] text-unjong-muted">{weekLabel} 기준 · 매주 자동 갱신</p>
      ) : null}
      <div>
        {channels.map((c) => (
          <ListRow
            key={c.rank}
            href={c.channel_url}
            rank={c.rank}
            iconUrl={c.thumbnail_url}
            iconRound
            title={c.title}
            stat={fmtSubs(c.subscriber_count)}
          />
        ))}
      </div>
    </section>
  );
}
