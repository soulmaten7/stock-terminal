export type UserRole = 'free' | 'premium' | 'pro' | 'advertiser' | 'admin';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled';

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  billing_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Watchlist {
  id: number;
  user_id: string;
  symbol: string;
  market: string;
  country: string;
  display_order: number;
  created_at: string;
}
