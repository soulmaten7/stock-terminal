export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Payment {
  id: number;
  user_id: string;
  payment_type: 'subscription' | 'banner';
  amount: number;
  payment_method: string | null;
  payment_key: string | null;
  order_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  banner_id: number | null;
  created_at: string;
}

export interface LinkHub {
  id: number;
  country: string;
  category: string;
  site_name: string;
  site_url: string;
  description: string | null;
  logo_url: string | null;
  display_order: number;
  is_active: boolean;
  click_count: number;
  created_at: string;
}
