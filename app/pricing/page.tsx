'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Crown, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const PLANS = [
  {
    key: 'free', name: 'Free', price: 0, period: '',
    features: [
      { text: '홈 1층 (관심종목, 속보, 수급)', ok: true },
      { text: '뉴스·공시', ok: true },
      { text: '링크허브', ok: true },
      { text: '실시간 채팅', ok: true },
      { text: '종목 상세', ok: false },
      { text: '시장분석·스크리너·비교', ok: false },
      { text: 'AI 분석', ok: false },
      { text: '키워드 알림', ok: false },
    ],
  },
  {
    key: 'premium', name: 'Premium', price: 29000, period: '/월',
    badge: '추천', icon: Crown,
    features: [
      { text: 'Free 전부 포함', ok: true },
      { text: '종목 상세 (차트·호가·체결·수급·재무)', ok: true },
      { text: '시장분석·스크리너·비교', ok: true },
      { text: '관심종목 무제한', ok: true },
      { text: 'AI 분석 (미리보기만)', ok: true },
      { text: 'AI 분석 전문 (잠금)', ok: false },
      { text: '키워드 알림 무제한', ok: false },
    ],
  },
  {
    key: 'pro', name: 'Pro', price: 49000, period: '/월',
    badge: '최고', icon: Sparkles,
    features: [
      { text: 'Premium 전부 포함', ok: true },
      { text: 'AI 분석 5종 전문 리포트', ok: true },
      { text: '키워드 알림 무제한', ok: true },
      { text: '가격 알림', ok: true },
      { text: '우선 고객 지원', ok: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    if (!user) { router.push('/auth/login'); return; }
    if (planKey === 'free') return;

    setLoading(planKey);

    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
    if (!clientKey || clientKey === 'your_toss_client_key') {
      alert('토스페이먼츠 키가 설정되지 않았습니다. .env.local에 TOSS_CLIENT_KEY를 입력하세요.');
      setLoading(null);
      return;
    }

    try {
      const w = window as unknown as Record<string, unknown>;
      let TossPayments = w.TossPayments as ((key: string) => { requestBillingAuth: (m: string, o: Record<string, string>) => void }) | undefined;

      if (!TossPayments) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://js.tosspayments.com/v1/payment';
          s.onload = () => resolve();
          s.onerror = () => reject();
          document.head.appendChild(s);
        });
        TossPayments = (window as unknown as Record<string, unknown>).TossPayments as typeof TossPayments;
      }

      if (!TossPayments) throw new Error('SDK load failed');
      const toss = TossPayments(clientKey);
      toss.requestBillingAuth('카드', {
        customerKey: user.id,
        successUrl: `${window.location.origin}/payment/success?plan=${planKey}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch {
      alert('결제 모듈 로딩에 실패했습니다.');
      setLoading(null);
    }
  };

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-black text-center mb-2">요금제</h1>
      <p className="text-[#999999] text-center text-sm mb-12">투자에 필요한 모든 데이터를 하나의 플랫폼에서</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan) => {
          const isCurrent = user?.role === plan.key;
          const isPro = plan.key === 'pro';
          const isPremium = plan.key === 'premium';
          const borderColor = isPro ? 'border-[#0ABAB5]' : isPremium ? 'border-[#C9A96E]' : 'border-[#E5E7EB]';

          return (
            <div key={plan.key} className={`bg-white border-[3px] ${borderColor} p-8 relative`}>
              {plan.badge && (
                <span className={`absolute -top-3 left-6 px-3 py-1 text-xs font-bold text-white ${isPro ? 'bg-[#0ABAB5]' : 'bg-[#C9A96E]'}`}>
                  {plan.badge}
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                {plan.icon && <plan.icon className={`w-5 h-5 ${isPro ? 'text-[#0ABAB5]' : 'text-[#C9A96E]'}`} />}
                <h3 className="text-lg font-bold text-black">{plan.name}</h3>
              </div>
              <p className="text-3xl font-bold text-black mb-1">
                {plan.price === 0 ? '무료' : `${fmt(plan.price)}원`}
                <span className="text-sm text-[#999999] font-normal">{plan.period}</span>
              </p>

              <ul className="space-y-3 my-6">
                {plan.features.map((f) => (
                  <li key={f.text} className="flex items-center gap-2 text-sm">
                    {f.ok ? <Check className="w-4 h-4 text-[#0ABAB5] shrink-0" /> : <X className="w-4 h-4 text-[#D1D5DB] shrink-0" />}
                    <span className={f.ok ? 'text-black font-medium' : 'text-[#999999]'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-3 text-center text-sm text-[#999999] font-bold border border-[#E5E7EB]">현재 플랜</div>
              ) : plan.key === 'free' ? (
                <div className="w-full py-3 text-center text-sm text-[#999999]">기본 제공</div>
              ) : (
                <button onClick={() => handleSubscribe(plan.key)} disabled={loading === plan.key}
                  className={`w-full py-3 text-white font-bold text-sm ${isPro ? 'bg-[#0ABAB5] hover:bg-[#088F8C]' : 'bg-[#C9A96E] hover:bg-[#B8985D]'} ${loading === plan.key ? 'opacity-50' : ''}`}>
                  {loading === plan.key ? '처리 중...' : `${plan.name} 시작하기`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto bg-[#F5F5F5] p-6 border border-[#E5E7EB]">
        <h3 className="font-bold text-sm text-black mb-3">환불 정책</h3>
        <ul className="text-xs text-[#999999] space-y-1">
          <li>- 결제 후 7일 이내 서비스 미이용 시 전액 환불</li>
          <li>- 결제 후 7일 초과 시 잔여 기간 일할 계산 환불</li>
          <li>- 환불 요청은 마이페이지 또는 고객센터를 통해 가능</li>
        </ul>
      </div>
    </div>
  );
}
