import { Suspense } from 'react';
import MoversPricePageClient from '@/components/movers/MoversPricePageClient';

export default function PriceMoversPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-6 py-10 max-w-screen-2xl mx-auto">
          <div className="text-sm text-[#999]">로딩 중…</div>
        </div>
      }
    >
      <MoversPricePageClient />
    </Suspense>
  );
}
