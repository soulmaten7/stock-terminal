'use client';

import Link from 'next/link';
import { Lock, Crown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function PaywallModal({ requiredPlan = 'premium' }: { requiredPlan?: string }) {
  const { user } = useAuthStore();
  const planName = requiredPlan === 'pro' ? 'Pro' : 'Premium';

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-lg w-full bg-white border-[3px] border-[#0ABAB5] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#0ABAB5]/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-[#0ABAB5]" />
        </div>
        <h2 className="text-xl font-bold text-black mb-2">{planName} 전용 콘텐츠</h2>
        <p className="text-[#999999] text-sm mb-6">{planName} 구독 시 이용할 수 있습니다</p>
        <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 bg-[#0ABAB5] text-white font-bold hover:bg-[#088F8C]">
          <Crown className="w-4 h-4" /> 요금제 보기
        </Link>
        {!user && (
          <div className="mt-4">
            <Link href="/auth/login" className="text-[#999999] text-sm hover:text-black font-bold">이미 구독 중이라면 로그인</Link>
          </div>
        )}
      </div>
    </div>
  );
}
