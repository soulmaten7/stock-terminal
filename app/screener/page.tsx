import { Suspense } from 'react';
import type { Metadata } from 'next';
import ScreenerClient from '@/components/screener/ScreenerClient';

export const metadata: Metadata = { title: '종목 발굴 — 운종(雲從)' };

export default function ScreenerPage() {
  return (
    <Suspense>
      <ScreenerClient />
    </Suspense>
  );
}
