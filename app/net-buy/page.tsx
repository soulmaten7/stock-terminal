import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TopTab from '@/components/net-buy/TopTab';
import FlowTab from '@/components/net-buy/FlowTab';

export default async function NetBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: 'top' | 'flow' = tab === 'flow' ? 'flow' : 'top';

  return (
    <div className="w-full px-6 py-6">
      {/* 공통 헤더 */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">수급</h1>
        <p className="text-sm text-[#666]">
          외국인·기관 순매수 상위 종목과 시장 전체 투자자별 매매동향을 확인합니다.
        </p>
      </div>

      {/* 탭바 */}
      <div className="flex items-center border-b border-[#E5E7EB] mb-6" role="tablist">
        <Link
          href="/net-buy?tab=top"
          role="tab"
          aria-selected={activeTab === 'top'}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'top'
              ? 'border-[#0ABAB5] text-[#0ABAB5]'
              : 'border-transparent text-[#666] hover:text-black'
          }`}
        >
          종목별 TOP
        </Link>
        <Link
          href="/net-buy?tab=flow"
          role="tab"
          aria-selected={activeTab === 'flow'}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'flow'
              ? 'border-[#0ABAB5] text-[#0ABAB5]'
              : 'border-transparent text-[#666] hover:text-black'
          }`}
        >
          시장 동향
        </Link>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'top' ? <TopTab /> : <FlowTab />}
    </div>
  );
}
