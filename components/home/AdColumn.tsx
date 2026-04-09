'use client';

import AdBanner from './AdBanner';

interface AdColumnProps {
  premiumCount: number;
  generalCount: number;
}

export default function AdColumn({ premiumCount, generalCount }: AdColumnProps) {
  return (
    <div className="w-[280px] shrink-0 flex flex-col gap-3">
      {/* 1층: 인증 광고 */}
      {Array.from({ length: premiumCount }).map((_, i) => (
        <AdBanner key={`p-${i}`} type="premium" adPageId="demo" />
      ))}
      {/* 2~3층: 일반 광고 */}
      {Array.from({ length: generalCount }).map((_, i) => (
        <AdBanner key={`g-${i}`} type="general" />
      ))}
    </div>
  );
}
