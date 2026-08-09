-- STEP 963 §2-2 — Q1 PBR을 보통주 장부가 기준으로. 기존 equity(총자기자본) 컬럼은 그대로 두고 병기한다(before/after 비교 가능하게).
-- common_equity = equity - preferred_stock - (equity가 NCI포함 태그일 때만 minority_interest)
alter table public.us_fundamentals
  add column if not exists common_equity numeric,
  add column if not exists preferred_stock numeric,
  add column if not exists minority_interest numeric;
