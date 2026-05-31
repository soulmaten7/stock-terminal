export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  role: 'free' | 'premium' | 'pro';
  tier: 1 | 2 | 3;
  bio: string | null;
  oauth_provider: string | null;
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
