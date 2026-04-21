import InvestorFlowWidget from '@/components/widgets/InvestorFlowWidget';

export default function AnalyticsPage() {
  return (
    <div className="w-full px-6 py-6">
      <h1 className="text-xl font-bold mb-4">투자자별 매매동향</h1>
      <div className="h-[600px]">
        <InvestorFlowWidget />
      </div>
    </div>
  );
}
