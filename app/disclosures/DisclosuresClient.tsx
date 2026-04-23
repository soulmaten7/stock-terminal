'use client';

import DisclosureStreamWidget from '@/components/widgets/DisclosureStreamWidget';
import DisclosuresPageClient from '@/components/disclosures/DisclosuresPageClient';

export default function DisclosuresClient() {
  return (
    <div
      className="max-w-[1600px] min-w-[1280px] mx-auto px-4 py-4 grid grid-cols-12 gap-4"
      style={{ minHeight: 'calc(100vh - 80px)' }}
    >
      {/* 좌측: 실시간 공시 스트림 */}
      <div className="col-span-4 bg-white border border-[#E5E7EB] overflow-hidden" style={{ height: 'calc(100vh - 112px)' }}>
        <DisclosureStreamWidget />
      </div>

      {/* 우측: 기존 DART 검색/필터 풀페이지 */}
      <div className="col-span-8 bg-white border border-[#E5E7EB] overflow-y-auto" style={{ height: 'calc(100vh - 112px)' }}>
        <DisclosuresPageClient />
      </div>
    </div>
  );
}
