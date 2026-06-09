'use client';

import { ExternalLink } from 'lucide-react';
import { BROKERS } from '@/lib/brokers';

export default function BrokerRanking() {
  return (
    <section className="min-w-0 rounded-2xl border border-unjong-border bg-unjong-surface p-4">
      <div className="mb-3 border-b border-unjong-border pb-2">
        <h2 className="text-lg font-bold text-unjong-primary">증권사 리스트</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">거래대금 순 · 최근 분기 근사치</p>
      </div>
      <ol className="grid grid-cols-1 gap-0.5">
        {BROKERS.map((b) => (
          <li key={b.rank}>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-unjong-background"
            >
              <span className={`w-5 shrink-0 text-center text-sm font-bold ${b.rank <= 3 ? 'text-unjong-accent' : 'text-unjong-muted'}`}>{b.rank}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
                alt=""
                width={20}
                height={20}
                className="shrink-0 rounded"
                onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
              />
              <span className="shrink-0 text-sm font-semibold text-unjong-primary group-hover:text-unjong-accent">{b.name}</span>
              {b.share != null && (
                <span className="shrink-0 text-xs font-bold text-unjong-accent">{b.share}%</span>
              )}
              {b.note ? (
                <span className="min-w-0 flex-1 truncate text-xs text-unjong-muted">· {b.note}</span>
              ) : (
                <span className="flex-1" />
              )}
              <span className="flex shrink-0 items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors group-hover:border-unjong-accent group-hover:bg-unjong-background group-hover:text-unjong-accent">
                바로가기
                <ExternalLink size={11} />
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
