-- STEP 46: 스크리너용 스냅샷 뷰
-- stocks + 최신 quant_factors + 최신 dividends LEFT JOIN

CREATE OR REPLACE VIEW stock_snapshot_v
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.symbol,
  s.name_ko,
  s.market,
  s.country,
  s.market_cap,
  s.sector,
  s.industry,
  s.is_active,
  -- 퀀트 팩터 (최신 snapshot_date)
  qf.per,
  qf.pbr,
  qf.roe,
  qf.operating_margin,
  qf.return_3m,
  qf.return_6m,
  qf.return_12m,
  qf.value_pct,
  qf.momentum_pct,
  qf.quality_pct,
  qf.composite_pct,
  qf.snapshot_date AS qf_snapshot_date,
  -- 배당 (최신 fiscal_year)
  d.dividend_yield,
  d.payout_ratio,
  d.dividend_per_share,
  d.fiscal_year AS div_fiscal_year
FROM stocks s
LEFT JOIN LATERAL (
  SELECT per, pbr, roe, operating_margin,
         return_3m, return_6m, return_12m,
         value_pct, momentum_pct, quality_pct, composite_pct,
         snapshot_date
  FROM quant_factors
  WHERE stock_id = s.id
  ORDER BY snapshot_date DESC
  LIMIT 1
) qf ON TRUE
LEFT JOIN LATERAL (
  SELECT dividend_yield, payout_ratio, dividend_per_share, fiscal_year
  FROM dividends
  WHERE stock_id = s.id
  ORDER BY fiscal_year DESC
  LIMIT 1
) d ON TRUE;

COMMENT ON VIEW stock_snapshot_v IS 'STEP 46: 스크리너용 최신 퀀트+배당 집계 뷰.';
