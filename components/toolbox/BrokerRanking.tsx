'use client';

import { Fragment, useEffect, useState } from 'react';
import ListRow from './ListRow';
import SectionHeader from './SectionHeader';
import AdSlotRow from './AdSlotRow';
import { BROKERS, type Broker } from '@/lib/brokers';

const AD_EVERY = 10; // 맨 위 + 10개마다 광고 슬롯

// 매매처 = 언어권(사용자 지역) 기준. 지금은 한국어 전용 → region=KR 고정.
// 정적 lib/brokers.ts(KR) → brokers 테이블 조회로 전환(플레이북 §4-3). 정적은 폴백.
// 언어 스위처 생기면 region prop만 바꿔주면 그 언어권 매매처로 교체됨.
export default function BrokerRanking({ hideHeader = false, region = 'KR' }: { hideHeader?: boolean; region?: string }) {
  const [brokers, setBrokers] = useState<Broker[]>(BROKERS); // 초기 = 정적 KR(폴백·즉시표시)
  useEffect(() => {
    let alive = true;
    fetch(`/api/brokers?region=${encodeURIComponent(region)}`)
      .then((r) => r.json())
      .then((j) => { if (alive && Array.isArray(j.brokers) && j.brokers.length) setBrokers(j.brokers as Broker[]); })
      .catch(() => { /* 실패 시 정적 폴백 유지 */ });
    return () => { alive = false; };
  }, [region]);

  return (
    <section className="min-w-0 text-sm">
      {!hideHeader && <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />}
      <div>
        {brokers.map((b, i) => (
          <Fragment key={b.rank}>
            <ListRow
              href={b.url}
              rank={b.rank}
              iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
              title={b.name}
              subtitle={b.note}
              stat={b.share != null ? `${b.share}%` : undefined}
            />
            {(i + 1) % AD_EVERY === 0 && i + 1 < brokers.length ? <AdSlotRow slot="broker" /> : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
