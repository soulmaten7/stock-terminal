'use client';

import { useAuthStore } from '@/stores/authStore';
import PaywallModal from '@/components/common/PaywallModal';
import type { UserRole } from '@/types/user';

function canAccess(role: UserRole | undefined, minPlan: 'free' | 'premium' | 'pro'): boolean {
  if (!role) return false;
  if (minPlan === 'free') return true;
  if (minPlan === 'premium') return role === 'premium' || role === 'pro' || role === 'admin';
  if (minPlan === 'pro') return role === 'pro' || role === 'admin';
  return false;
}

export default function AuthGuard({ children, minPlan = 'premium' }: { children: React.ReactNode; minPlan?: 'free' | 'premium' | 'pro' }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[#0ABAB5] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!canAccess(user?.role, minPlan)) {
    return <PaywallModal requiredPlan={minPlan} />;
  }

  return <>{children}</>;
}
