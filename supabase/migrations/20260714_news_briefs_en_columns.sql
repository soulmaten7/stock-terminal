-- Tier 3 R3 news-brief en: tags_en 추가(720 누락) + en-first INSERT 위해 ko 컬럼 nullable.
ALTER TABLE public.news_briefs ADD COLUMN IF NOT EXISTS tags_en jsonb;
ALTER TABLE public.news_briefs ALTER COLUMN summary_ko DROP NOT NULL;
ALTER TABLE public.news_briefs ALTER COLUMN tags       DROP NOT NULL;
-- (라이브 적용됨 via Supabase MCP · 이 파일 = repo 기록.)
