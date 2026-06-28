'use client';

import { Fragment } from 'react';
import ListRow from './ListRow';
import SectionHeader from './SectionHeader';
import AdSlotRow from './AdSlotRow';
import { BROKERS } from '@/lib/brokers';

const AD_EVERY = 10; // 맨 위 + 10개마다 광고 슬롯

export default function BrokerRanking({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <section className="min-w-0 text-sm">
      {!hideHeader && <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />}
      <div>
        <AdSlotRow slot="broker" label="○○증권" />
        {BROKERS.map((b, i) => (
          <Fragment key={b.rank}>
            <ListRow
              href={b.url}
              rank={b.rank}
              iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
              title={b.name}
              stat={b.share != null ? `${b.share}%` : undefined}
            />
            {(i + 1) % AD_EVERY === 0 && i + 1 < BROKERS.length ? <AdSlotRow slot="broker" label="○○증권" /> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
