'use client';

import Link from 'next/link';

interface AdBannerProps {
  type: 'premium' | 'general';
  adPageId?: string;
  externalUrl?: string;
}

export default function AdBanner({ type, adPageId, externalUrl }: AdBannerProps) {
  const isPremium = type === 'premium';
  const borderColor = isPremium ? 'border-[#C9A96E]' : 'border-[#D1D5DB]';
  const label = isPremium ? '인증' : '광고';
  const labelColor = isPremium ? 'text-[#C9A96E]' : 'text-[#999999]';

  const content = (
    <div className={`w-[280px] h-[120px] border-[2px] ${borderColor} bg-white flex items-center justify-between px-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer`}>
      <div>
        <span className={`text-[10px] font-bold ${labelColor} border ${borderColor} px-1.5 py-0.5`}>{label}</span>
        <p className="text-[#999999] text-[10px] mt-2">광고 문의</p>
        <p className="text-black text-[10px] font-bold">ad@stockterminal.com</p>
      </div>
      <div className="w-[120px] h-[90px] bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-[#CCCCCC] text-[10px]">280x120</p>
      </div>
    </div>
  );

  if (adPageId) {
    return <Link href={`/ad/${adPageId}`}>{content}</Link>;
  }
  if (externalUrl) {
    return <a href={externalUrl} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return content;
}
