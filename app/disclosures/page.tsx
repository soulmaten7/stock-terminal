import { Suspense } from 'react';
import DisclosuresClient from './DisclosuresClient';

export const metadata = { title: '공시 스트림 · Stock Terminal' };

export default function DisclosuresPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full px-6 py-10 max-w-screen-2xl mx-auto">
          <div className="text-sm text-[#999]">로딩 중…</div>
        </div>
      }
    >
      <DisclosuresClient />
    </Suspense>
  );
}
