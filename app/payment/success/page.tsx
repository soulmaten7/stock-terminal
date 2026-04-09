'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Suspense } from 'react';
import { Check } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<'processing' | 'done' | 'error'>('processing');

  useEffect(() => {
    const authKey = searchParams.get('authKey');
    const plan = searchParams.get('plan');

    if (!authKey || !plan || !user) { setStatus('error'); return; }

    const process = async () => {
      try {
        const res = await fetch('/api/payment/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authKey, customerKey: user.id, plan }),
        });
        const data = await res.json();
        if (data.success) setStatus('done');
        else setStatus('error');
      } catch { setStatus('error'); }
    };
    process();
  }, [searchParams, user]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {status === 'processing' && (
        <>
          <div className="w-12 h-12 border-4 border-[#0ABAB5] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-black font-bold text-lg">결제 처리 중...</p>
        </>
      )}
      {status === 'done' && (
        <>
          <div className="w-16 h-16 bg-[#0ABAB5] mx-auto mb-4 flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">구독 완료!</h1>
          <p className="text-[#999999] text-sm mb-6">StockTerminal의 모든 기능을 이용할 수 있습니다.</p>
          <Link href="/" className="px-6 py-3 bg-[#0ABAB5] text-white font-bold hover:bg-[#088F8C]">홈으로</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-black mb-2">결제 처리 실패</h1>
          <p className="text-[#999999] text-sm mb-6">다시 시도해주세요. 문제가 계속되면 고객센터에 문의하세요.</p>
          <Link href="/pricing" className="px-6 py-3 bg-black text-white font-bold">요금제로 돌아가기</Link>
        </>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return <Suspense fallback={<div className="text-center py-16">로딩 중...</div>}><SuccessContent /></Suspense>;
}
