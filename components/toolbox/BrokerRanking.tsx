'use client';

import { ExternalLink } from 'lucide-react';
import { BROKERS } from '@/lib/brokers';

export default function BrokerRanking() {
  return (
    <section className="mb-6 rounded-2xl border border-unjong-border bg-unjong-surface p-5">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-unjong-primary">증권사 거래대금 순위</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">최근 분기 기준 · 근사치(분기 변동)</p>
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
              {b.note && <span className="truncate text-xs text-unjong-muted">· {b.note}</span>}
              <ExternalLink size={13} className="ml-auto shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
