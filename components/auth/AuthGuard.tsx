'use client';

import { useAuthStore } from '@/stores/authStore';
import PaywallModal from '@/components/common/PaywallModal';
import type { UserRole } from '@/types/user';

// DEV MODE: paywall 전체 비활성화 — 모든 기능 접근 허용
// TODO: 프로덕션 배포 전 아래 한 줄 삭제하고 주석 해제
const DEV_BYPASS = true;

type MinPlan = 'free' | 'premium' | 'pro' | 'admin';

function canAccess(role: UserRole | undefined, minPlan: MinPlan): boolean {
  // admin 게이트는 DEV_BYPASS 라도 반드시 체크 (보안)
  if (minPlan === 'admin') return role === 'admin';
  if (DEV_BYPASS) return true;
  if (!role) return false;
  if (minPlan === 'free') return true;
  if (minPlan === 'premium') return role === 'premium' || role === 'pro' || role === 'admin';
  if (minPlan === 'pro') return role === 'pro' || role === 'admin';
  return false;
}

export default function AuthGuard({
  children,
  minPlan = 'premium',
}: {
  children: React.ReactNode;
  minPlan?: MinPlan;
}) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!canAccess(user?.role, minPlan)) {
    // admin 전용 차단은 PaywallModal 대신 명시적 차단 화면
    if (minPlan === 'admin') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <h2 className="text-2xl font-bold mb-3">접근 권한 없음</h2>
          <p className="text-text-secondary text-sm">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
        </div>
      );
    }
    return <PaywallModal requiredPlan={minPlan as 'free' | 'premium' | 'pro'} />;
  }

  return <>{children}</>;
}
