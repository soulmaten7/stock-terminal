-- 2026-06-24 · watchlist 테이블에 name_ko 컬럼 추가
-- 종목명을 저장해 즐겨찾기 표시 시 별도 조회 불필요
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS name_ko TEXT;
