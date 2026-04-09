export interface Advertiser {
  id: number;
  user_id: string;
  advertiser_type: 'verified' | 'general';
  company_name: string | null;
  business_registration_number: string | null;
  business_registration_image: string | null;
  representative_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  advertiser_id: number;
  title: string;
  link_url: string;
  banner_image_url: string | null;
  product_type: 'investment_product' | 'reading_room' | 'education' | 'other' | null;
  description: string | null;
  banner_tier: 'premium' | 'standard';
  position_priority: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  click_count: number;
  payment_status: 'pending' | 'paid' | 'expired';
  payment_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface BannerClick {
  id: number;
  banner_id: number;
  user_id: string | null;
  clicked_at: string;
  page_location: string | null;
}
