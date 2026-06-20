'use client';

import { ExternalLink } from 'lucide-react';

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
  const week = channels[0]?.week_label ?? '';
  return (
    <section className="min-w-0">
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">한국 주식 유튜브 Top 100</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">{week} · 구독자순 · 매주 갱신</p>
      </div>
      <ol className="grid grid-cols-1 gap-0.5">
        {channels.map((c) => (
          <li key={c.rank}>
            <a
              href={c.channel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-unjong-background"
            >
              <span className={`w-6 shrink-0 text-center text-sm font-bold ${c.rank <= 3 ? 'text-unjong-accent' : 'text-unjong-muted'}`}>{c.rank}</span>
              {c.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.thumbnail_url}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0 rounded-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                />
              ) : (
                <span className="h-7 w-7 shrink-0 rounded-full bg-unjong-background" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{c.title}</span>
              <span className="shrink-0 text-xs font-bold text-unjong-accent">{fmtSubs(c.subscriber_count)}</span>
              <span className="hidden shrink-0 items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors group-hover:border-unjong-accent group-hover:bg-unjong-background group-hover:text-unjong-accent sm:flex">
                채널
                <ExternalLink size={11} />
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
