-- Trillion (트릴리언) — public schema dump
-- Generated via Supabase MCP (pg_dump blocked: IPv6-only direct connection)
-- Project ref: qxkmwlkchyxfzxbonhtj
-- Tables: 47 | PKs: 47 | Unique: 24 | Indexes: 43 | RLS: 45

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE public.advertisers (
  id bigint DEFAULT nextval('advertisers_id_seq'::regclass) NOT NULL,
  user_id uuid NOT NULL,
  advertiser_type text NOT NULL,
  company_name text,
  business_registration_number text,
  business_registration_image text,
  representative_name text,
  contact_phone text,
  contact_email text,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.advisor_directory (
  biz_no text,
  company_name text,
  representative text,
  valid_from date,
  valid_to date,
  homepage text,
  phone text,
  address text,
  like_count integer,
  report_count integer,
  platform text,
  info_name text,
  source text,
  intro text,
  favorite_count integer
);

CREATE TABLE public.ai_analysis (
  id bigint DEFAULT nextval('ai_analysis_id_seq'::regclass) NOT NULL,
  stock_id bigint NOT NULL,
  analysis_type text NOT NULL,
  content_ko text NOT NULL,
  content_en text,
  data_snapshot jsonb,
  generated_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone
);

CREATE TABLE public.banned_words (
  id bigint DEFAULT nextval('banned_words_id_seq'::regclass) NOT NULL,
  word text NOT NULL,
  category text DEFAULT 'general'::text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.banner_clicks (
  id bigint DEFAULT nextval('banner_clicks_id_seq'::regclass) NOT NULL,
  banner_id bigint NOT NULL,
  user_id uuid,
  clicked_at timestamp with time zone DEFAULT now() NOT NULL,
  page_location text
);

CREATE TABLE public.banners (
  id bigint DEFAULT nextval('banners_id_seq'::regclass) NOT NULL,
  advertiser_id bigint NOT NULL,
  title text NOT NULL,
  link_url text NOT NULL,
  banner_image_url text,
  product_type text,
  description text,
  banner_tier text NOT NULL,
  position_priority integer DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  click_count integer DEFAULT 0,
  payment_status text DEFAULT 'pending'::text,
  payment_amount integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  content text NOT NULL,
  stock_tags _text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  hidden boolean DEFAULT false,
  report_count integer DEFAULT 0,
  room text DEFAULT 'general'::text,
  nickname text DEFAULT '익명'::text,
  symbol text
);

CREATE TABLE public.chat_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  message_id uuid,
  reporter_id uuid,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.dart_corp_codes (
  corp_code text NOT NULL,
  corp_name text,
  stock_code text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.disclosures (
  id bigint DEFAULT nextval('disclosures_id_seq'::regclass) NOT NULL,
  stock_id bigint,
  symbol text,
  title text NOT NULL,
  disclosure_type text,
  source text NOT NULL,
  source_url text,
  published_at timestamp with time zone NOT NULL,
  ai_summary text,
  raw_data jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.discussion_comments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  discussion_id uuid NOT NULL,
  user_id uuid,
  nickname text NOT NULL,
  tier smallint DEFAULT 1 NOT NULL,
  content text NOT NULL,
  like_count integer DEFAULT 0 NOT NULL,
  report_count integer DEFAULT 0 NOT NULL,
  hidden boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.discussion_likes (
  discussion_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  vote smallint DEFAULT 1 NOT NULL
);

CREATE TABLE public.discussion_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  discussion_id uuid NOT NULL,
  reporter_id uuid,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.discussions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  symbol text NOT NULL,
  user_id uuid,
  nickname text NOT NULL,
  tier smallint DEFAULT 1 NOT NULL,
  title text,
  content text NOT NULL,
  like_count integer DEFAULT 0 NOT NULL,
  comment_count integer DEFAULT 0 NOT NULL,
  report_count integer DEFAULT 0 NOT NULL,
  hidden boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  dislike_count integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.dividends (
  id bigint DEFAULT nextval('dividends_id_seq'::regclass) NOT NULL,
  stock_id bigint NOT NULL,
  fiscal_year integer NOT NULL,
  ex_dividend_date date,
  payment_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.financials (
  id bigint DEFAULT nextval('financials_id_seq'::regclass) NOT NULL,
  stock_id bigint NOT NULL,
  period_type text NOT NULL,
  period_date date NOT NULL,
  revenue bigint,
  operating_income bigint,
  net_income bigint,
  total_assets bigint,
  total_liabilities bigint,
  total_equity bigint,
  source text,
  raw_data jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.fss_advisors (
  biz_no text NOT NULL,
  company_name text NOT NULL,
  info_name text,
  representative text,
  valid_from date,
  valid_to date,
  address text,
  phone text,
  homepage text,
  email text,
  status text DEFAULT 'active'::text NOT NULL,
  source text DEFAULT 'fss_fine'::text NOT NULL,
  fetched_at timestamp with time zone DEFAULT now() NOT NULL,
  raw jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.insider_trades (
  id bigint DEFAULT nextval('insider_trades_id_seq'::regclass) NOT NULL,
  stock_id bigint NOT NULL,
  insider_name text NOT NULL,
  position text,
  trade_type text NOT NULL,
  shares bigint NOT NULL,
  total_amount bigint,
  trade_date date NOT NULL,
  source_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.leading_room_votes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  vote_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.leading_rooms (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  platform text NOT NULL,
  name text NOT NULL,
  operator text,
  description text,
  external_url text,
  pricing text,
  category _text[],
  is_certified boolean DEFAULT false NOT NULL,
  view_count integer DEFAULT 0 NOT NULL,
  discussion_count integer DEFAULT 0 NOT NULL,
  hidden boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  biz_no text,
  cert_type text,
  cert_verified_at timestamp with time zone,
  fss_biz_no text,
  like_count integer DEFAULT 0 NOT NULL,
  dislike_count integer DEFAULT 0 NOT NULL,
  follower_count integer DEFAULT 0 NOT NULL,
  follower_synced_at timestamp with time zone
);

CREATE TABLE public.link_hub (
  id bigint DEFAULT nextval('link_hub_id_seq'::regclass) NOT NULL,
  country text NOT NULL,
  category text NOT NULL,
  site_name text NOT NULL,
  site_url text NOT NULL,
  description text,
  logo_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.link_hub_clicks (
  id bigint DEFAULT nextval('link_hub_clicks_id_seq'::regclass) NOT NULL,
  link_id bigint NOT NULL,
  user_id uuid,
  clicked_at timestamp with time zone DEFAULT now(),
  referrer text,
  user_agent text
);

CREATE TABLE public.link_hub_favorites (
  user_id uuid NOT NULL,
  link_id bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  position integer
);

CREATE TABLE public.macro_indicators (
  id bigint DEFAULT nextval('macro_indicators_id_seq'::regclass) NOT NULL,
  indicator_name text NOT NULL,
  country text NOT NULL,
  unit text,
  measured_at date NOT NULL,
  source text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.news (
  id bigint DEFAULT nextval('news_id_seq'::regclass) NOT NULL,
  stock_id bigint,
  symbol text,
  title text NOT NULL,
  source text NOT NULL,
  url text NOT NULL,
  published_at timestamp with time zone NOT NULL,
  summary_ko text,
  country text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.partner_clicks (
  id bigint DEFAULT nextval('partner_clicks_id_seq'::regclass) NOT NULL,
  partner_id bigint NOT NULL,
  slot_key text,
  source_page text,
  ip_hash text,
  user_agent text,
  clicked_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.partner_leads (
  id bigint DEFAULT nextval('partner_leads_id_seq'::regclass) NOT NULL,
  partner_id bigint,
  name text NOT NULL,
  email text,
  phone text,
  message text,
  source_slug text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  consent_marketing boolean DEFAULT false,
  ip_hash text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.partner_slots (
  id bigint DEFAULT nextval('partner_slots_id_seq'::regclass) NOT NULL,
  slot_key text NOT NULL,
  partner_id bigint NOT NULL,
  position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.partners (
  id bigint DEFAULT nextval('partners_id_seq'::regclass) NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  logo_url text,
  hero_image_url text,
  description text,
  category text,
  cta_text text DEFAULT '자세히 보기'::text,
  cta_url text,
  features jsonb,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  country text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.payments (
  id bigint DEFAULT nextval('payments_id_seq'::regclass) NOT NULL,
  user_id uuid NOT NULL,
  payment_type text NOT NULL,
  amount integer NOT NULL,
  payment_method text,
  payment_key text,
  order_id text NOT NULL,
  status text NOT NULL,
  banner_id bigint,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.platform_discussion_likes (
  discussion_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  vote smallint DEFAULT 1 NOT NULL
);

CREATE TABLE public.platform_discussion_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  discussion_id uuid NOT NULL,
  reporter_id uuid,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.platform_discussions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  user_id uuid,
  nickname text NOT NULL,
  tier smallint DEFAULT 1 NOT NULL,
  content text NOT NULL,
  duration text,
  outcome text,
  like_count integer DEFAULT 0 NOT NULL,
  report_count integer DEFAULT 0 NOT NULL,
  hidden boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  dislike_count integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  category text NOT NULL,
  ticker text,
  name text NOT NULL,
  issuer text,
  description text,
  external_url text,
  fee_pct numeric(5,4),
  inception_date date,
  tags _text[] DEFAULT '{}'::text[],
  view_count integer DEFAULT 0 NOT NULL,
  discussion_count integer DEFAULT 0 NOT NULL,
  hidden boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.quant_factors (
  id bigint DEFAULT nextval('quant_factors_id_seq'::regclass) NOT NULL,
  stock_id bigint NOT NULL,
  snapshot_date date NOT NULL,
  universe_size integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.room_favorites (
  user_id uuid NOT NULL,
  biz_no text NOT NULL,
  position integer,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.room_likes (
  id bigint NOT NULL,
  target_type text DEFAULT 'fss_advisor'::text NOT NULL,
  target_id text NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.room_reports (
  id bigint NOT NULL,
  target_type text DEFAULT 'fss_advisor'::text NOT NULL,
  target_id text,
  target_name text NOT NULL,
  reason text NOT NULL,
  content text,
  reporter_user_id uuid,
  status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.room_review_reports (
  id bigint NOT NULL,
  review_id bigint NOT NULL,
  reporter_user_id uuid NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.room_reviews (
  id bigint NOT NULL,
  target_id text NOT NULL,
  target_type text DEFAULT 'fss_advisor'::text NOT NULL,
  user_id uuid NOT NULL,
  nickname text,
  rating smallint NOT NULL,
  content text,
  status text DEFAULT 'visible'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  report_count integer DEFAULT 0 NOT NULL
);

CREATE TABLE public.room_submissions (
  id bigint NOT NULL,
  room_name text NOT NULL,
  company_name text,
  biz_no text,
  platform text DEFAULT 'etc'::text NOT NULL,
  homepage text NOT NULL,
  intro text,
  user_id uuid,
  fss_matched boolean DEFAULT false NOT NULL,
  fss_biz_no text,
  status text DEFAULT 'public'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.short_credit (
  id bigint DEFAULT nextval('short_credit_id_seq'::regclass) NOT NULL,
  stock_id bigint NOT NULL,
  trade_date date NOT NULL,
  short_volume bigint,
  short_balance bigint,
  credit_balance bigint,
  loan_balance bigint,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.stock_prices (
  id bigint DEFAULT nextval('stock_prices_id_seq'::regclass) NOT NULL,
  stock_id bigint NOT NULL,
  trade_date date NOT NULL,
  volume bigint,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.stocks (
  id bigint DEFAULT nextval('stocks_id_seq'::regclass) NOT NULL,
  symbol text NOT NULL,
  name_ko text,
  name_en text,
  market text NOT NULL,
  country text NOT NULL,
  sector text,
  industry text,
  market_cap bigint,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.supply_demand (
  id bigint DEFAULT nextval('supply_demand_id_seq'::regclass) NOT NULL,
  stock_id bigint NOT NULL,
  trade_date date NOT NULL,
  foreign_net bigint,
  institution_net bigint,
  individual_net bigint,
  foreign_cumulative bigint,
  program_net bigint,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  nickname text NOT NULL,
  avatar_url text,
  role text DEFAULT 'free'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  tier smallint DEFAULT 1 NOT NULL,
  bio text,
  oauth_provider text
);

CREATE TABLE public.watchlist (
  id bigint DEFAULT nextval('watchlist_id_seq'::regclass) NOT NULL,
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  market text NOT NULL,
  country text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  name_ko text
);

CREATE TABLE public.youtube_channels (
  id bigint NOT NULL,
  rank integer NOT NULL,
  channel_id text NOT NULL,
  title text NOT NULL,
  thumbnail_url text,
  subscriber_count bigint DEFAULT 0 NOT NULL,
  channel_url text NOT NULL,
  country text DEFAULT 'KR'::text NOT NULL,
  week_label text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- PRIMARY KEYS
-- ============================================================

ALTER TABLE public.advertisers ADD CONSTRAINT advertisers_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_analysis ADD CONSTRAINT ai_analysis_pkey PRIMARY KEY (id);
ALTER TABLE public.banned_words ADD CONSTRAINT banned_words_pkey PRIMARY KEY (id);
ALTER TABLE public.banner_clicks ADD CONSTRAINT banner_clicks_pkey PRIMARY KEY (id);
ALTER TABLE public.banners ADD CONSTRAINT banners_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_reports ADD CONSTRAINT chat_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.dart_corp_codes ADD CONSTRAINT dart_corp_codes_pkey PRIMARY KEY (corp_code);
ALTER TABLE public.disclosures ADD CONSTRAINT disclosures_pkey PRIMARY KEY (id);
ALTER TABLE public.discussion_comments ADD CONSTRAINT discussion_comments_pkey PRIMARY KEY (id);
ALTER TABLE public.discussion_likes ADD CONSTRAINT discussion_likes_pkey PRIMARY KEY (discussion_id, user_id);
ALTER TABLE public.discussion_reports ADD CONSTRAINT discussion_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.discussions ADD CONSTRAINT discussions_pkey PRIMARY KEY (id);
ALTER TABLE public.dividends ADD CONSTRAINT dividends_pkey PRIMARY KEY (id);
ALTER TABLE public.financials ADD CONSTRAINT financials_pkey PRIMARY KEY (id);
ALTER TABLE public.fss_advisors ADD CONSTRAINT fss_advisors_pkey PRIMARY KEY (biz_no);
ALTER TABLE public.insider_trades ADD CONSTRAINT insider_trades_pkey PRIMARY KEY (id);
ALTER TABLE public.leading_room_votes ADD CONSTRAINT leading_room_votes_pkey PRIMARY KEY (id);
ALTER TABLE public.leading_rooms ADD CONSTRAINT leading_rooms_pkey PRIMARY KEY (id);
ALTER TABLE public.link_hub ADD CONSTRAINT link_hub_pkey PRIMARY KEY (id);
ALTER TABLE public.link_hub_clicks ADD CONSTRAINT link_hub_clicks_pkey PRIMARY KEY (id);
ALTER TABLE public.link_hub_favorites ADD CONSTRAINT link_hub_favorites_pkey PRIMARY KEY (user_id, link_id);
ALTER TABLE public.macro_indicators ADD CONSTRAINT macro_indicators_pkey PRIMARY KEY (id);
ALTER TABLE public.news ADD CONSTRAINT news_pkey PRIMARY KEY (id);
ALTER TABLE public.partner_clicks ADD CONSTRAINT partner_clicks_pkey PRIMARY KEY (id);
ALTER TABLE public.partner_leads ADD CONSTRAINT partner_leads_pkey PRIMARY KEY (id);
ALTER TABLE public.partner_slots ADD CONSTRAINT partner_slots_pkey PRIMARY KEY (id);
ALTER TABLE public.partners ADD CONSTRAINT partners_pkey PRIMARY KEY (id);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.platform_discussion_likes ADD CONSTRAINT platform_discussion_likes_pkey PRIMARY KEY (discussion_id, user_id);
ALTER TABLE public.platform_discussion_reports ADD CONSTRAINT platform_discussion_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.platform_discussions ADD CONSTRAINT platform_discussions_pkey PRIMARY KEY (id);
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE public.quant_factors ADD CONSTRAINT quant_factors_pkey PRIMARY KEY (id);
ALTER TABLE public.room_favorites ADD CONSTRAINT room_favorites_pkey PRIMARY KEY (user_id, biz_no);
ALTER TABLE public.room_likes ADD CONSTRAINT room_likes_pkey PRIMARY KEY (id);
ALTER TABLE public.room_reports ADD CONSTRAINT room_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.room_review_reports ADD CONSTRAINT room_review_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.room_reviews ADD CONSTRAINT room_reviews_pkey PRIMARY KEY (id);
ALTER TABLE public.room_submissions ADD CONSTRAINT room_submissions_pkey PRIMARY KEY (id);
ALTER TABLE public.short_credit ADD CONSTRAINT short_credit_pkey PRIMARY KEY (id);
ALTER TABLE public.stock_prices ADD CONSTRAINT stock_prices_pkey PRIMARY KEY (id);
ALTER TABLE public.stocks ADD CONSTRAINT stocks_pkey PRIMARY KEY (id);
ALTER TABLE public.supply_demand ADD CONSTRAINT supply_demand_pkey PRIMARY KEY (id);
ALTER TABLE public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE public.watchlist ADD CONSTRAINT watchlist_pkey PRIMARY KEY (id);
ALTER TABLE public.youtube_channels ADD CONSTRAINT youtube_channels_pkey PRIMARY KEY (id);

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================

ALTER TABLE public.ai_analysis ADD CONSTRAINT ai_analysis_stock_id_analysis_type_key UNIQUE (stock_id, analysis_type);
ALTER TABLE public.banned_words ADD CONSTRAINT banned_words_word_key UNIQUE (word);
ALTER TABLE public.chat_reports ADD CONSTRAINT chat_reports_message_id_reporter_id_key UNIQUE (message_id, reporter_id);
ALTER TABLE public.dart_corp_codes ADD CONSTRAINT dart_corp_codes_stock_code_key UNIQUE (stock_code);
ALTER TABLE public.discussion_reports ADD CONSTRAINT discussion_reports_discussion_id_reporter_id_key UNIQUE (discussion_id, reporter_id);
ALTER TABLE public.dividends ADD CONSTRAINT dividends_stock_id_fiscal_year_key UNIQUE (stock_id, fiscal_year);
ALTER TABLE public.financials ADD CONSTRAINT financials_stock_id_period_type_period_date_key UNIQUE (stock_id, period_type, period_date);
ALTER TABLE public.leading_room_votes ADD CONSTRAINT leading_room_votes_room_id_user_id_key UNIQUE (room_id, user_id);
ALTER TABLE public.macro_indicators ADD CONSTRAINT macro_indicators_indicator_name_country_measured_at_key UNIQUE (indicator_name, country, measured_at);
ALTER TABLE public.partner_slots ADD CONSTRAINT partner_slots_slot_key_partner_id_key UNIQUE (slot_key, partner_id);
ALTER TABLE public.partners ADD CONSTRAINT partners_slug_key UNIQUE (slug);
ALTER TABLE public.payments ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);
ALTER TABLE public.platform_discussion_reports ADD CONSTRAINT platform_discussion_reports_discussion_id_reporter_id_key UNIQUE (discussion_id, reporter_id);
ALTER TABLE public.quant_factors ADD CONSTRAINT quant_factors_stock_id_snapshot_date_key UNIQUE (stock_id, snapshot_date);
ALTER TABLE public.room_likes ADD CONSTRAINT room_likes_target_id_user_id_key UNIQUE (target_id, user_id);
ALTER TABLE public.room_review_reports ADD CONSTRAINT room_review_reports_review_id_reporter_user_id_key UNIQUE (review_id, reporter_user_id);
ALTER TABLE public.room_reviews ADD CONSTRAINT room_reviews_user_id_target_id_key UNIQUE (user_id, target_id);
ALTER TABLE public.short_credit ADD CONSTRAINT short_credit_stock_id_trade_date_key UNIQUE (stock_id, trade_date);
ALTER TABLE public.stock_prices ADD CONSTRAINT stock_prices_stock_id_trade_date_key UNIQUE (stock_id, trade_date);
ALTER TABLE public.stocks ADD CONSTRAINT stocks_symbol_market_key UNIQUE (symbol, market);
ALTER TABLE public.supply_demand ADD CONSTRAINT supply_demand_stock_id_trade_date_key UNIQUE (stock_id, trade_date);
ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE public.users ADD CONSTRAINT users_nickname_key UNIQUE (nickname);
ALTER TABLE public.watchlist ADD CONSTRAINT watchlist_user_id_symbol_market_key UNIQUE (user_id, symbol, market);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_ai_analysis_stock ON public.ai_analysis USING btree (stock_id, analysis_type);
CREATE INDEX idx_banners_active ON public.banners USING btree (is_active, banner_tier, start_date, end_date);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages USING btree (created_at DESC);
CREATE INDEX idx_chat_messages_room_created ON public.chat_messages USING btree (room, created_at DESC);
CREATE INDEX idx_chat_messages_stock_tags ON public.chat_messages USING gin (stock_tags);
CREATE INDEX idx_chat_messages_symbol_created ON public.chat_messages USING btree (symbol, created_at DESC) WHERE (symbol IS NOT NULL);
CREATE INDEX idx_dart_corp_codes_stock_code ON public.dart_corp_codes USING btree (stock_code);
CREATE INDEX idx_disclosures_published ON public.disclosures USING btree (published_at DESC);
CREATE INDEX idx_disclosures_stock_id ON public.disclosures USING btree (stock_id);
CREATE INDEX idx_discussion_comments_discussion_created ON public.discussion_comments USING btree (discussion_id, created_at);
CREATE INDEX idx_discussions_symbol_created ON public.discussions USING btree (symbol, created_at DESC);
CREATE INDEX idx_discussions_symbol_hot ON public.discussions USING btree (symbol, like_count DESC, created_at DESC);
CREATE INDEX idx_financials_stock_id ON public.financials USING btree (stock_id);
CREATE INDEX idx_fss_advisors_company ON public.fss_advisors USING btree (company_name);
CREATE INDEX idx_fss_advisors_homepage ON public.fss_advisors USING btree (homepage) WHERE (homepage IS NOT NULL);
CREATE INDEX idx_leading_room_votes_room ON public.leading_room_votes USING btree (room_id);
CREATE INDEX idx_leading_rooms_platform ON public.leading_rooms USING btree (platform) WHERE (hidden = false);
CREATE INDEX idx_link_hub_clicks_clicked_at ON public.link_hub_clicks USING btree (clicked_at DESC);
CREATE INDEX idx_link_hub_clicks_link_id ON public.link_hub_clicks USING btree (link_id);
CREATE INDEX idx_link_hub_favorites_user ON public.link_hub_favorites USING btree (user_id);
CREATE INDEX idx_news_published ON public.news USING btree (published_at DESC);
CREATE INDEX idx_news_stock_id ON public.news USING btree (stock_id);
CREATE INDEX idx_partner_clicks_partner_time ON public.partner_clicks USING btree (partner_id, clicked_at DESC);
CREATE INDEX idx_partner_clicks_slot_time ON public.partner_clicks USING btree (slot_key, clicked_at DESC);
CREATE INDEX idx_partner_leads_partner_created ON public.partner_leads USING btree (partner_id, created_at DESC);
CREATE INDEX idx_partner_slots_key_active ON public.partner_slots USING btree (slot_key, "position") WHERE is_active;
CREATE INDEX idx_partners_country_active ON public.partners USING btree (country) WHERE is_active;
CREATE INDEX idx_partners_slug_active ON public.partners USING btree (slug) WHERE is_active;
CREATE INDEX idx_platform_discussions_target_created ON public.platform_discussions USING btree (target_type, target_id, created_at DESC) WHERE (hidden = false);
CREATE INDEX idx_platform_discussions_target_hot ON public.platform_discussions USING btree (target_type, target_id, like_count DESC) WHERE (hidden = false);
CREATE INDEX idx_products_category ON public.products USING btree (category) WHERE (hidden = false);
CREATE INDEX idx_products_ticker ON public.products USING btree (ticker) WHERE (ticker IS NOT NULL);
CREATE INDEX idx_quant_factors_snapshot ON public.quant_factors USING btree (snapshot_date DESC);
CREATE INDEX idx_quant_factors_stock ON public.quant_factors USING btree (stock_id);
CREATE INDEX room_reviews_target_idx ON public.room_reviews USING btree (target_id);
CREATE INDEX idx_short_credit_stock_date ON public.short_credit USING btree (stock_id, trade_date DESC);
CREATE INDEX idx_stock_prices_stock_date ON public.stock_prices USING btree (stock_id, trade_date DESC);
CREATE INDEX idx_stock_prices_stock_id ON public.stock_prices USING btree (stock_id);
CREATE INDEX idx_stock_prices_trade_date ON public.stock_prices USING btree (trade_date);
CREATE INDEX idx_stocks_country ON public.stocks USING btree (country);
CREATE INDEX idx_stocks_sector ON public.stocks USING btree (sector);
CREATE INDEX idx_stocks_symbol_market ON public.stocks USING btree (symbol, market);
CREATE INDEX idx_supply_demand_stock_date ON public.supply_demand USING btree (stock_id, trade_date DESC);
CREATE INDEX idx_watchlist_user ON public.watchlist USING btree (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dart_corp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fss_advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insider_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leading_room_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leading_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_hub ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_hub_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_hub_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.macro_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussion_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quant_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_credit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_demand ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;
