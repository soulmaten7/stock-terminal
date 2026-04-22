import { Suspense } from 'react';
import MoversVolumePageClient from '@/components/movers/MoversVolumePageClient';

export default function VolumeMoversPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-6 py-10 max-w-screen-2xl mx-auto">
          <div className="text-sm text-[#999]">로딩 중…</div>
        </div>
      }
    >
      <MoversVolumePageClient />
    </Suspense>
  );
}
