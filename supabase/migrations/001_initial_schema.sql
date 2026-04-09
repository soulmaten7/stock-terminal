-- ============================================
-- 글로벌 개인투자자용 통합 데이터 터미널 플랫폼
-- 초기 DB 스키마
-- ============================================

-- ============================================
-- 1. 사용자 테이블
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'premium', 'advertiser', 'admin')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  billing_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. 관심 종목 테이블
-- ============================================
CREATE TABLE watchlist (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  market TEXT NOT NULL,
  country TEXT NOT NULL,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol, market)
);

-- ============================================
-- 3. 종목 기본 정보 테이블
-- ============================================
CREATE TABLE stocks (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  name_ko TEXT,
  name_en TEXT,
  market TEXT NOT NULL,
  country TEXT NOT NULL,
  sector TEXT,
  industry TEXT,
  market_cap BIGINT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(symbol, market)
);

-- ============================================
-- 4. 재무제표 데이터 테이블
-- ============================================
CREATE TABLE financials (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('annual', 'quarterly')),
  period_date DATE NOT NULL,
  revenue BIGINT,
  operating_income BIGINT,
  net_income BIGINT,
  total_assets BIGINT,
  total_liabilities BIGINT,
  total_equity BIGINT,
  eps NUMERIC,
  bps NUMERIC,
  per NUMERIC,
  pbr NUMERIC,
  roe NUMERIC,
  roa NUMERIC,
  debt_ratio NUMERIC,
  operating_margin NUMERIC,
  net_margin NUMERIC,
  source TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, period_type, period_date)
);

-- ============================================
-- 5. 공시 데이터 테이블
-- ============================================
CREATE TABLE disclosures (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT REFERENCES stocks(id) ON DELETE SET NULL,
  symbol TEXT,
  title TEXT NOT NULL,
  disclosure_type TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  ai_summary TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. 수급 데이터 테이블
-- ============================================
CREATE TABLE supply_demand (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  foreign_net BIGINT,
  institution_net BIGINT,
  individual_net BIGINT,
  foreign_cumulative BIGINT,
  program_net BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, trade_date)
);

-- ============================================
-- 7. 공매도 / 신용잔고 테이블
-- ============================================
CREATE TABLE short_credit (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  short_volume BIGINT,
  short_balance BIGINT,
  short_ratio NUMERIC,
  credit_balance BIGINT,
  loan_balance BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, trade_date)
);

-- ============================================
-- 8. 내부자 거래 테이블
-- ============================================
CREATE TABLE insider_trades (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  insider_name TEXT NOT NULL,
  position TEXT,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  shares BIGINT NOT NULL,
  price NUMERIC,
  total_amount BIGINT,
  trade_date DATE NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. 배당 데이터 테이블
-- ============================================
CREATE TABLE dividends (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  fiscal_year INT NOT NULL,
  dividend_per_share NUMERIC,
  dividend_yield NUMERIC,
  payout_ratio NUMERIC,
  ex_dividend_date DATE,
  payment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, fiscal_year)
);

-- ============================================
-- 10. 뉴스 테이블
-- ============================================
CREATE TABLE news (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT REFERENCES stocks(id) ON DELETE SET NULL,
  symbol TEXT,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  summary_ko TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. 거시경제 지표 테이블
-- ============================================
CREATE TABLE macro_indicators (
  id BIGSERIAL PRIMARY KEY,
  indicator_name TEXT NOT NULL,
  country TEXT NOT NULL,
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_rate NUMERIC,
  unit TEXT,
  measured_at DATE NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(indicator_name, country, measured_at)
);

-- ============================================
-- 12. AI 분석 결과 테이블
-- ============================================
CREATE TABLE ai_analysis (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('value', 'technical', 'quant', 'dividend', 'supply')),
  content_ko TEXT NOT NULL,
  content_en TEXT,
  data_snapshot JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(stock_id, analysis_type)
);

-- ============================================
-- 13. 채팅 메시지 테이블
-- ============================================
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  room TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. 채팅 제재 테이블
-- ============================================
CREATE TABLE chat_penalties (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  penalty_type TEXT NOT NULL CHECK (penalty_type IN ('warning', 'mute_30min', 'mute_1month')),
  reason TEXT,
  warning_count INT NOT NULL DEFAULT 1,
  muted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. 광고주 테이블
-- ============================================
CREATE TABLE advertisers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  advertiser_type TEXT NOT NULL CHECK (advertiser_type IN ('verified', 'general')),
  company_name TEXT,
  business_registration_number TEXT,
  business_registration_image TEXT,
  representative_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 16. 배너 테이블
-- ============================================
CREATE TABLE banners (
  id BIGSERIAL PRIMARY KEY,
  advertiser_id BIGINT NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link_url TEXT NOT NULL,
  banner_image_url TEXT,
  product_type TEXT CHECK (product_type IN ('investment_product', 'reading_room', 'education', 'other')),
  description TEXT,
  banner_tier TEXT NOT NULL CHECK (banner_tier IN ('premium', 'standard')),
  position_priority INT DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  click_count INT DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'expired')),
  payment_amount INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 17. 배너 클릭 로그 테이블
-- ============================================
CREATE TABLE banner_clicks (
  id BIGSERIAL PRIMARY KEY,
  banner_id BIGINT NOT NULL REFERENCES banners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_location TEXT
);

-- ============================================
-- 18. 결제 내역 테이블
-- ============================================
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'banner')),
  amount INT NOT NULL,
  payment_method TEXT,
  payment_key TEXT,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  banner_id BIGINT REFERENCES banners(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 19. 링크 허브 데이터 테이블
-- ============================================
CREATE TABLE link_hub (
  id BIGSERIAL PRIMARY KEY,
  country TEXT NOT NULL,
  category TEXT NOT NULL,
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 20. 금칙어 테이블
-- ============================================
CREATE TABLE banned_words (
  id BIGSERIAL PRIMARY KEY,
  word TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 인덱스
-- ============================================
CREATE INDEX idx_stocks_symbol_market ON stocks(symbol, market);
CREATE INDEX idx_stocks_country ON stocks(country);
CREATE INDEX idx_stocks_sector ON stocks(sector);
CREATE INDEX idx_financials_stock_id ON financials(stock_id);
CREATE INDEX idx_disclosures_stock_id ON disclosures(stock_id);
CREATE INDEX idx_disclosures_published ON disclosures(published_at DESC);
CREATE INDEX idx_supply_demand_stock_date ON supply_demand(stock_id, trade_date DESC);
CREATE INDEX idx_short_credit_stock_date ON short_credit(stock_id, trade_date DESC);
CREATE INDEX idx_news_stock_id ON news(stock_id);
CREATE INDEX idx_news_published ON news(published_at DESC);
CREATE INDEX idx_chat_messages_room ON chat_messages(room, created_at DESC);
CREATE INDEX idx_banners_active ON banners(is_active, banner_tier, start_date, end_date);
CREATE INDEX idx_watchlist_user ON watchlist(user_id);
CREATE INDEX idx_ai_analysis_stock ON ai_analysis(stock_id, analysis_type);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own watchlist" ON watchlist FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read chat" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert chat" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stocks" ON stocks FOR SELECT USING (true);
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read financials" ON financials FOR SELECT USING (true);
ALTER TABLE disclosures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read disclosures" ON disclosures FOR SELECT USING (true);
ALTER TABLE supply_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read supply_demand" ON supply_demand FOR SELECT USING (true);
ALTER TABLE short_credit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read short_credit" ON short_credit FOR SELECT USING (true);
ALTER TABLE insider_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read insider_trades" ON insider_trades FOR SELECT USING (true);
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read dividends" ON dividends FOR SELECT USING (true);
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read news" ON news FOR SELECT USING (true);
ALTER TABLE macro_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read macro" ON macro_indicators FOR SELECT USING (true);
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ai_analysis" ON ai_analysis FOR SELECT USING (true);
ALTER TABLE link_hub ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read link_hub" ON link_hub FOR SELECT USING (true);
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read banned_words" ON banned_words FOR SELECT USING (true);

CREATE POLICY "Anyone can read active banners" ON banners FOR SELECT USING (is_active = true);
CREATE POLICY "Advertisers manage own banners" ON banners FOR ALL USING (
  advertiser_id IN (SELECT id FROM advertisers WHERE user_id = auth.uid())
);

CREATE POLICY "Advertisers manage own profile" ON advertisers FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 금칙어 초기 데이터
-- ============================================
INSERT INTO banned_words (word, category) VALUES
  ('사세요', 'investment'),
  ('매수추천', 'investment'),
  ('급등예정', 'investment'),
  ('수익보장', 'investment'),
  ('원금보장', 'investment'),
  ('확정수익', 'investment'),
  ('매도추천', 'investment'),
  ('떡상', 'investment'),
  ('지금들어가', 'investment'),
  ('리딩방', 'spam'),
  ('단톡방', 'spam'),
  ('카톡방', 'spam'),
  ('텔레방', 'spam');

-- ============================================
-- 링크 허브 시드 데이터 (한국)
-- ============================================
INSERT INTO link_hub (country, category, site_name, site_url, description, display_order) VALUES
  ('KR', 'news', '네이버 증권 뉴스', 'https://finance.naver.com/news/', '종합 주식 뉴스, 실시간 속보', 1),
  ('KR', 'news', '한국경제', 'https://www.hankyung.com/economy', '경제 전문 일간지', 2),
  ('KR', 'news', '매일경제', 'https://www.mk.co.kr/economy', '경제 전문 일간지', 3),
  ('KR', 'news', '이데일리', 'https://www.edaily.co.kr', '증권/금융 전문 미디어', 4),
  ('KR', 'news', '머니투데이', 'https://www.mt.co.kr', '경제/금융 뉴스', 5),
  ('KR', 'news', '파이낸셜뉴스', 'https://www.fnnews.com', '금융 전문 뉴스', 6),
  ('KR', 'news', '서울경제', 'https://www.sedaily.com', '종합 경제 뉴스', 7),
  ('KR', 'news', '아시아경제', 'https://www.asiae.co.kr', '종합 경제 뉴스', 8),
  ('KR', 'news', '연합인포맥스', 'https://www.yonhapnews.co.kr', '실시간 금융정보', 9),
  ('KR', 'disclosure', 'DART 전자공시시스템', 'https://dart.fss.or.kr', '상장기업 공시, 재무제표, 감사보고서', 1),
  ('KR', 'disclosure', '금융감독원', 'https://www.fss.or.kr', '금융감독 정보, 기업분석', 2),
  ('KR', 'disclosure', 'NICE신용평가', 'https://www.nicerating.com', '기업 신용등급, 신용분석', 3),
  ('KR', 'disclosure', '한국신용평가', 'https://www.kisrating.com', '기업 신용등급 평가', 4),
  ('KR', 'exchange', '한국거래소(KRX)', 'https://www.krx.co.kr', '수급 데이터, 공매도 잔고, 거래량, 시가총액', 1),
  ('KR', 'exchange', 'KRX 정보데이터시스템', 'http://data.krx.co.kr', '상세 시장 데이터, 통계', 2),
  ('KR', 'exchange', 'KOSCOM', 'https://www.koscom.co.kr', '금융 데이터 서비스', 3),
  ('KR', 'macro', '한국은행 ECOS', 'https://ecos.bok.or.kr', '기준금리, GDP, CPI, 통화량 등 경제통계', 1),
  ('KR', 'macro', '통계청 KOSIS', 'https://kosis.kr', '국가 통계 데이터', 2),
  ('KR', 'macro', '기획재정부', 'https://www.moef.go.kr', '경제정책, 재정 현황', 3),
  ('KR', 'chart', 'TradingView', 'https://www.tradingview.com', '실시간 차트, 기술적 분석, 글로벌 시장', 1),
  ('KR', 'chart', '알파스퀘어', 'https://www.alphasquare.co.kr', '퀀트 분석, 종목 스크리너', 2),
  ('KR', 'chart', 'Investing.com', 'https://kr.investing.com', '글로벌 시장 데이터, 경제 캘린더', 3),
  ('KR', 'chart', 'Finviz', 'https://finviz.com', '미국 주식 스크리너, 히트맵', 4),
  ('KR', 'research', '키움증권 리서치', 'https://www.kiwoom.com', '종목분석, 산업분석 리포트', 1),
  ('KR', 'research', '미래에셋증권 리서치', 'https://securities.miraeasset.com', '투자전략, 종목분석', 2),
  ('KR', 'research', '삼성증권 리서치', 'https://www.samsungpop.com', '시장분석, 종목분석', 3),
  ('KR', 'research', 'NH투자증권 리서치', 'https://www.nhqv.com', '투자전략 리포트', 4),
  ('KR', 'research', '한국투자증권 리서치', 'https://www.truefriend.com', '종목분석, 시장전망', 5),
  ('KR', 'community', '네이버 종목토론방', 'https://finance.naver.com', '종목별 투자자 토론', 1),
  ('KR', 'community', '팍스넷', 'https://www.paxnet.co.kr', '주식 커뮤니티, 종목토론', 2),
  ('KR', 'community', 'Investing.com 포럼', 'https://kr.investing.com/analysis', '투자 분석, 의견 교환', 3);

-- ============================================
-- 링크 허브 시드 데이터 (미국)
-- ============================================
INSERT INTO link_hub (country, category, site_name, site_url, description, display_order) VALUES
  ('US', 'news', 'Bloomberg', 'https://www.bloomberg.com', '글로벌 금융 뉴스', 1),
  ('US', 'news', 'Reuters', 'https://www.reuters.com/business', '글로벌 비즈니스 뉴스', 2),
  ('US', 'news', 'CNBC', 'https://www.cnbc.com', '미국 금융 전문 미디어', 3),
  ('US', 'news', 'MarketWatch', 'https://www.marketwatch.com', '시장 데이터, 뉴스', 4),
  ('US', 'news', 'Seeking Alpha', 'https://seekingalpha.com', '투자 분석, 종목 리서치', 5),
  ('US', 'news', 'Yahoo Finance', 'https://finance.yahoo.com', '종합 금융 데이터', 6),
  ('US', 'disclosure', 'SEC EDGAR', 'https://www.sec.gov/edgar', '미국 기업 공시 (10-K, 10-Q, 8-K)', 1),
  ('US', 'disclosure', 'Macrotrends', 'https://www.macrotrends.net', '장기 재무 데이터, 차트', 2),
  ('US', 'disclosure', 'GuruFocus', 'https://www.gurufocus.com', '가치투자 분석, 재무 데이터', 3),
  ('US', 'exchange', 'NYSE', 'https://www.nyse.com', '뉴욕증권거래소', 1),
  ('US', 'exchange', 'NASDAQ', 'https://www.nasdaq.com', '나스닥 증권거래소', 2),
  ('US', 'exchange', 'CBOE', 'https://www.cboe.com', '옵션/변동성 데이터', 3),
  ('US', 'macro', 'FRED', 'https://fred.stlouisfed.org', '미국 연준 경제데이터', 1),
  ('US', 'macro', 'BLS', 'https://www.bls.gov', '미국 노동통계국', 2),
  ('US', 'macro', 'BEA', 'https://www.bea.gov', '미국 경제분석국', 3),
  ('US', 'chart', 'TradingView', 'https://www.tradingview.com', '실시간 차트, 기술적 분석', 1),
  ('US', 'chart', 'Finviz', 'https://finviz.com', '스크리너, 히트맵, 뉴스', 2),
  ('US', 'chart', 'StockCharts', 'https://stockcharts.com', '기술적 분석 차트', 3),
  ('US', 'chart', 'Barchart', 'https://www.barchart.com', '시장 데이터, 옵션 분석', 4),
  ('US', 'research', 'Morningstar', 'https://www.morningstar.com', '펀드/주식 분석 리서치', 1),
  ('US', 'research', 'Zacks', 'https://www.zacks.com', '종목 등급, 실적 추정치', 2),
  ('US', 'research', 'S&P Global', 'https://www.spglobal.com', '신용등급, 시장 분석', 3),
  ('US', 'community', 'Reddit r/investing', 'https://www.reddit.com/r/investing', '투자 토론 커뮤니티', 1),
  ('US', 'community', 'Reddit r/wallstreetbets', 'https://www.reddit.com/r/wallstreetbets', '개인투자자 커뮤니티', 2),
  ('US', 'community', 'StockTwits', 'https://stocktwits.com', '종목별 실시간 의견', 3);
