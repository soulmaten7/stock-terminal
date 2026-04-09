import type { UserRole } from '@/types/user';

export function canAccessPremium(role: UserRole | undefined): boolean {
  return role === 'premium' || role === 'admin';
}

export function canAccessAdmin(role: UserRole | undefined): boolean {
  return role === 'admin';
}

export function canAccessAdvertiserDashboard(role: UserRole | undefined): boolean {
  return role === 'advertiser' || role === 'admin';
}
