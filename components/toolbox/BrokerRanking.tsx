'use client';

import ListRow from './ListRow';
import SectionHeader from './SectionHeader';
import { BROKERS } from '@/lib/brokers';

export default function BrokerRanking({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <section className="min-w-0 text-sm">
      {!hideHeader && <SectionHeader title="증권사" subtitle="거래대금순 · 최근 분기 근사치" />}
      <div>
        {/* 🧪 TEST — 증권사 스폰서(광고) 슬롯 예시. 사실 랭킹과 분리된 별도 핀 + '광고' 라벨. 형태 확인용(실제 광고주 아님). */}
        <ListRow
          href="https://www.tossinvest.com"
          iconUrl="https://www.google.com/s2/favicons?domain=tossinvest.com&sz=64"
          title="토스증권"
          subtitle="광고 자리 미리보기 (예시 · 계좌개설 혜택)"
          sponsored
        />
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
