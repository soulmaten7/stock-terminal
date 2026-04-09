import Link from 'next/link';

export default function PaymentFailPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-black mb-2">결제 실패</h1>
      <p className="text-[#999999] text-sm mb-6">결제가 완료되지 않았습니다. 다시 시도해주세요.</p>
      <Link href="/pricing" className="px-6 py-3 bg-black text-white font-bold">요금제로 돌아가기</Link>
    </div>
  );
}
