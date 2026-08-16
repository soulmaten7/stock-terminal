-- spinoff/kr-pilot-2026-06-25/schema.sql
-- KR 파일럿 스키마(2026-06-25 시딩) — 원본 DDL 백업 (2026-08-16, STEP1048)
--
-- 이 파일은 트릴리언 프로덕션 Supabase(ref ccbwxcszdoyjxvckedfp)에서
-- information_schema/pg_catalog를 직접 조회해 뽑은 실제 DDL이다(추정·재구성 아님).
-- 원본 테이블은 이 스키마를 저장하고 data/의 전체 행을 덤프한 뒤
-- 별도 마이그레이션(supabase/migrations/026_drop_kr_pilot_schema.sql)으로 DROP됐다.
--
-- 원래 정의는 supabase/migrations/001_initial_schema.sql(stocks·ai_analysis·disclosures·
-- dividends·financials·insider_trades·news·short_credit·stock_prices·supply_demand,
-- 최초 커밋 2026-04-09) + 012_quant_factors.sql(quant_factors, 최초 커밋 2026-04-22) +
-- 013_stock_snapshot_view.sql(뷰 stock_snapshot_v, 최초 커밋 2026-04-22)에 흩어져 있었다
-- — 이 마이그레이션 파일들은 git 이력이라 삭제하지 않고 본체에 그대로 둔다(DROP 마이그레이션이
-- 후속으로 추가될 뿐, 과거 CREATE 파일 자체는 지우지 않는다).
--
-- 🔴 stocks(27행)·dividends(60행)의 실제 데이터는 이 폴더의 data/*.json에 전량 덤프돼 있다.
-- 나머지 9개 테이블은 DROP 시점 전부 0행이었지만, "테이블이 존재했다"는 사실 자체를 남기기
-- 위해 data/에 빈 배열([]) 파일로도 존재를 기록했다(STEP1048 주문서 1-1 요구사항).

-- ============================================
-- 1. stocks (27행 — 전부 country='KR' market='KOSPI', created_at 단일 타임스탬프 2026-06-25 12:50:42)
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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (symbol, market)
);
CREATE INDEX idx_stocks_country ON public.stocks USING btree (country);
CREATE INDEX idx_stocks_sector ON public.stocks USING btree (sector);
CREATE INDEX idx_stocks_symbol_market ON public.stocks USING btree (symbol, market);
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stocks" ON stocks FOR SELECT USING (true);

-- ============================================
-- 2. dividends (60행 — 🔴 유일하게 라이브 참조되던 테이블, probe_1047 참고. payout_ratio 전 행 NULL)
-- ============================================
CREATE TABLE dividends (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  fiscal_year INTEGER NOT NULL,
  dividend_per_share NUMERIC,
  dividend_yield NUMERIC,
  payout_ratio NUMERIC,
  ex_dividend_date DATE,
  payment_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stock_id, fiscal_year)
);
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read dividends" ON dividends FOR SELECT USING (true);

-- ============================================
-- 3. financials (0행)
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
  UNIQUE (stock_id, period_type, period_date)
);
CREATE INDEX idx_financials_stock_id ON public.financials USING btree (stock_id);
ALTER TABLE financials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read financials" ON financials FOR SELECT USING (true);

-- ============================================
-- 4. ai_analysis (0행)
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
  UNIQUE (stock_id, analysis_type)
);
CREATE INDEX idx_ai_analysis_stock ON public.ai_analysis USING btree (stock_id, analysis_type);
ALTER TABLE ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read ai_analysis" ON ai_analysis FOR SELECT USING (true);

-- ============================================
-- 5. disclosures (0행 — stock_id nullable, symbol 컬럼도 있어 stocks 미의존 조회 가능하게 설계됐던 흔적)
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
CREATE INDEX idx_disclosures_published ON public.disclosures USING btree (published_at DESC);
CREATE INDEX idx_disclosures_stock_id ON public.disclosures USING btree (stock_id);
ALTER TABLE disclosures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read disclosures" ON disclosures FOR SELECT USING (true);

-- ============================================
-- 6. insider_trades (0행 — 보조 인덱스 없음, PK뿐)
-- ============================================
CREATE TABLE insider_trades (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  insider_name TEXT NOT NULL,
  "position" TEXT,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  shares BIGINT NOT NULL,
  price NUMERIC,
  total_amount BIGINT,
  trade_date DATE NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE insider_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read insider_trades" ON insider_trades FOR SELECT USING (true);

-- ============================================
-- 7. news (0행 — stock_id nullable, symbol 컬럼도 있음)
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
CREATE INDEX idx_news_published ON public.news USING btree (published_at DESC);
CREATE INDEX idx_news_stock_id ON public.news USING btree (stock_id);
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read news" ON news FOR SELECT USING (true);

-- ============================================
-- 8. quant_factors (0행) — STEP 45(2026-04-22), 012_quant_factors.sql 원문
-- ============================================
CREATE TABLE quant_factors (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  per NUMERIC,
  pbr NUMERIC,
  roe NUMERIC,
  operating_margin NUMERIC,
  return_3m NUMERIC,
  return_6m NUMERIC,
  return_12m NUMERIC,
  value_pct NUMERIC,
  momentum_pct NUMERIC,
  quality_pct NUMERIC,
  composite_pct NUMERIC,
  sector_rank_pct NUMERIC,
  universe_size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stock_id, snapshot_date)
);
CREATE INDEX idx_quant_factors_stock ON public.quant_factors USING btree (stock_id);
CREATE INDEX idx_quant_factors_snapshot ON public.quant_factors USING btree (snapshot_date DESC);
ALTER TABLE quant_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quant_factors" ON quant_factors FOR SELECT USING (true);
CREATE POLICY "Service role can manage quant_factors" ON quant_factors
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 9. short_credit (0행)
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
  UNIQUE (stock_id, trade_date)
);
CREATE INDEX idx_short_credit_stock_date ON public.short_credit USING btree (stock_id, trade_date DESC);
ALTER TABLE short_credit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read short_credit" ON short_credit FOR SELECT USING (true);

-- ============================================
-- 10. stock_prices (0행 — 🔴 STEP1046이 이미 "저장소에 없다"로 재확인한 테이블)
-- ============================================
CREATE TABLE stock_prices (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC NOT NULL,
  volume BIGINT,
  change NUMERIC,
  change_percent NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stock_id, trade_date)
);
CREATE INDEX idx_stock_prices_stock_id ON public.stock_prices USING btree (stock_id);
CREATE INDEX idx_stock_prices_trade_date ON public.stock_prices USING btree (trade_date);
CREATE INDEX idx_stock_prices_stock_date ON public.stock_prices USING btree (stock_id, trade_date DESC);
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stock_prices" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "Service role can manage stock_prices" ON stock_prices
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 11. supply_demand (0행)
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
  UNIQUE (stock_id, trade_date)
);
CREATE INDEX idx_supply_demand_stock_date ON public.supply_demand USING btree (stock_id, trade_date DESC);
ALTER TABLE supply_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read supply_demand" ON supply_demand FOR SELECT USING (true);

-- ============================================
-- 12. stock_snapshot_v (뷰, STEP 46·2026-04-22 — probe_1047에서 앱 미사용 3중 확인)
-- ============================================
-- stocks + 최신 quant_factors + 최신 dividends LEFT JOIN
CREATE OR REPLACE VIEW stock_snapshot_v
WITH (security_invoker = true) AS
SELECT
  s.id, s.symbol, s.name_ko, s.market, s.country, s.market_cap, s.sector, s.industry, s.is_active,
  qf.per, qf.pbr, qf.roe, qf.operating_margin, qf.return_3m, qf.return_6m, qf.return_12m,
  qf.value_pct, qf.momentum_pct, qf.quality_pct, qf.composite_pct, qf.snapshot_date AS qf_snapshot_date,
  d.dividend_yield, d.payout_ratio, d.dividend_per_share, d.fiscal_year AS div_fiscal_year
FROM stocks s
LEFT JOIN LATERAL (
  SELECT per, pbr, roe, operating_margin, return_3m, return_6m, return_12m,
         value_pct, momentum_pct, quality_pct, composite_pct, snapshot_date
  FROM quant_factors WHERE stock_id = s.id ORDER BY snapshot_date DESC LIMIT 1
) qf ON TRUE
LEFT JOIN LATERAL (
  SELECT dividend_yield, payout_ratio, dividend_per_share, fiscal_year
  FROM dividends WHERE stock_id = s.id ORDER BY fiscal_year DESC LIMIT 1
) d ON TRUE;
COMMENT ON VIEW stock_snapshot_v IS 'STEP 46: 스크리너용 최신 퀀트+배당 집계 뷰. 2026-07-12 하드닝(security_invoker 전환)에서 "앱 미사용(레거시)"로 이미 확인됨.';

-- 2026-07-12 하드닝 마이그레이션(20260712_harden_definer_views_grants.sql)이 실행한 권한 조정
-- (DROP 시점 이 뷰의 실제 상태 — 참고용, 재현 시 아래도 함께 적용해야 원본과 동일):
-- ALTER VIEW public.stock_snapshot_v SET (security_invoker = on);
-- REVOKE ALL ON public.stock_snapshot_v FROM anon, authenticated;
