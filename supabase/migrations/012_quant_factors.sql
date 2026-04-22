-- 2026-04-22 STEP 45 — quant_factors: 전종목 퀀트 팩터 스냅샷
CREATE TABLE IF NOT EXISTS quant_factors (
  id BIGSERIAL PRIMARY KEY,
  stock_id BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  -- 원시 값
  per NUMERIC,
  pbr NUMERIC,
  roe NUMERIC,
  operating_margin NUMERIC,
  return_3m NUMERIC,
  return_6m NUMERIC,
  return_12m NUMERIC,
  -- 퍼센타일 (0~100, 높을수록 우수)
  value_pct NUMERIC,
  momentum_pct NUMERIC,
  quality_pct NUMERIC,
  composite_pct NUMERIC,
  -- 섹터 상대 순위 (0~100)
  sector_rank_pct NUMERIC,
  -- 메타
  universe_size INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stock_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_quant_factors_stock ON quant_factors(stock_id);
CREATE INDEX IF NOT EXISTS idx_quant_factors_snapshot ON quant_factors(snapshot_date DESC);

ALTER TABLE quant_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read quant_factors" ON quant_factors FOR SELECT USING (true);
CREATE POLICY "Service role can manage quant_factors" ON quant_factors
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
