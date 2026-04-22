import { Suspense } from 'react';
import DetailDrawer from '@/components/common/DetailDrawer';
import ScreenerClient from '@/components/screener/ScreenerClient';

export default function ScreenerPanel() {
  return (
    <DetailDrawer title="종목 발굴 스크리너">
      <Suspense>
        <ScreenerClient />
      </Suspense>
    </DetailDrawer>
  );
}
