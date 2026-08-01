-- STEP 852 — 자본집약도 이중 산정(편향-분산 노출) 컬럼 추가.
-- level = PP&E÷매출 5년평균(저분산·설비무거운 기업 과대 가능) · marginal = 원전 T5 5년누적 순고정투자÷5년누적Δ매출(저편향).
-- 판정이 갈리면 화면에 "투자 강도 산정 방법에 따라 판정이 달라집니다" 표시.
alter table public.revdcf_results
  add column if not exists fixed_capital_rate_level numeric,
  add column if not exists fixed_capital_rate_marginal numeric,
  add column if not exists verdict_marginal text,
  add column if not exists gap_years_marginal int;
