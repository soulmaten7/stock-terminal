-- 광고주 전용 페이지 테이블
CREATE TABLE IF NOT EXISTS ad_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid REFERENCES users(id) ON DELETE CASCADE,
  banner_id integer REFERENCES banners(id) ON DELETE SET NULL,
  company_name text NOT NULL,
  description text DEFAULT '',
  logo_url text,
  images jsonb DEFAULT '[]'::jsonb,
  links jsonb DEFAULT '[]'::jsonb,
  contact_phone text,
  contact_email text,
  business_hours text,
  tags text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- banners 테이블에 클릭 유형 컬럼 추가
ALTER TABLE banners ADD COLUMN IF NOT EXISTS click_type text DEFAULT 'external';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS ad_page_id uuid REFERENCES ad_pages(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE ad_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_pages_public_read" ON ad_pages
  FOR SELECT USING (true);

CREATE POLICY "ad_pages_owner_write" ON ad_pages
  FOR ALL USING (auth.uid() = advertiser_id);
