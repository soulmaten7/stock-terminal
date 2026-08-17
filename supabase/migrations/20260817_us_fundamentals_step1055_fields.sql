-- STEP 1055 §2-2/§2-5 — probe_1054 실측 재료 다섯(+배당 축 확장) 병기. 963의 common_equity 방식 그대로:
-- 기존 컬럼은 손대지 않고 새 컬럼만 추가한다. 전부 nullable(결측을 채우지 않는다 — H-7).
-- liabilities_and_equity = 총부채 재구성 경로(Assets−StockholdersEquity 재구성용) — 직접 태그(total_liabilities)와
--   둘 다 저장한다. 어느 쪽을 쓸지는 이 STEP이 정하지 않는다(소비처가 고른다).
alter table public.us_fundamentals
  add column if not exists total_assets numeric,
  add column if not exists total_liabilities numeric,
  add column if not exists liabilities_and_equity numeric,
  add column if not exists retained_earnings numeric,
  add column if not exists cash_from_ops numeric,
  add column if not exists dividends_paid numeric,
  add column if not exists dividends_declared_per_share numeric;
