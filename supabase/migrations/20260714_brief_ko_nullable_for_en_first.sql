-- Tier 3 (STEP 721): en-first 삽입 허용.
-- 031에서 brief_ko가 NOT NULL이라, ko 캐시가 없는 종목을 /en에서 먼저 열면
-- upsert INSERT가 brief_ko를 빠뜨려 23502(not-null violation) → 캐시 실패.
-- 라우트는 upsert 에러를 무시하므로 브리핑은 나오지만 매 조회마다 LLM 재생성(유료) = 조용한 과금 누수.
-- 로케일 컬럼은 서로 독립이어야 하므로 ko를 nullable로 완화(가짜 ko 플레이스홀더 삽입 금지).
-- 기존 행·기존 ko 쓰기 경로 영향 0(제약 제거일 뿐).
-- Applied live via Supabase MCP 2026-07-14 (이 파일 = repo 기록).
ALTER TABLE public.stock_briefings ALTER COLUMN brief_ko DROP NOT NULL;
