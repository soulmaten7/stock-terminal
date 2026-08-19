-- STEP 1087 — 검산 인프라 ① 집행(설계 = LENS_DISPOSITION_2026-08-08.md §7-4 #7-부록, STEP1085).
-- 이미 계산 시점 메모리에 있으나 저장되지 않던 raw 값 7개를 lens_scores에 추가한다(새 계산 아님, 재취득 0).
-- 기존 19컬럼은 손대지 않는다. 전부 nullable(기존 1,976행은 NULL로 남는다 — 백필은 재취득이 필요해 범위 밖,
--   다음 정규크론부터 자연히 채워진다). NOT NULL·DEFAULT·인덱스 없음.
-- fscore_reason_code는 fscore.ts의 reason(로케일 고정 한글 문자열) 그대로가 아니라
--   needThree/dataMissing/gap 같은 영문 코드값으로 저장한다(lensPrecompute.ts 배선에서 변환).
--
-- 롤백:
--   ALTER TABLE public.lens_scores
--     DROP COLUMN IF EXISTS gross_profit,
--     DROP COLUMN IF EXISTS total_assets,
--     DROP COLUMN IF EXISTS total_assets_prior,
--     DROP COLUMN IF EXISTS rsi14,
--     DROP COLUMN IF EXISTS pos52w,
--     DROP COLUMN IF EXISTS fscore_reason_code,
--     DROP COLUMN IF EXISTS adj_used;
alter table public.lens_scores
  add column if not exists gross_profit numeric,
  add column if not exists total_assets numeric,
  add column if not exists total_assets_prior numeric,
  add column if not exists rsi14 numeric,
  add column if not exists pos52w numeric,
  add column if not exists fscore_reason_code text,
  add column if not exists adj_used boolean;
