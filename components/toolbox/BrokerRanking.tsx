'use client';

import ListRow from './ListRow';
import SectionHeader from './SectionHeader';
import { BROKERS } from '@/lib/brokers';

export default function BrokerRanking({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <section className="min-w-0">
      {!hideHeader && <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />}
      <div>
        {BROKERS.map((b) => (
          <ListRow
            key={b.rank}
            href={b.url}
            rank={b.rank}
            iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
            title={b.name}
            stat={b.share != null ? `${b.share}%` : undefined}
          />
        ))}
      </div>
    </section>
  );
}
