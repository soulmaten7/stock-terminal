-- Tier 3 LLM i18n: per-locale English columns alongside existing *_ko.
-- Additive & nullable — 기존 한국어 데이터 무손상. locale=en일 때 앱이 on-demand로 채움.
-- Applied live via Supabase MCP 2026-07-14 (이 파일 = repo 기록).
ALTER TABLE public.stock_briefings  ADD COLUMN IF NOT EXISTS brief_en   text;
ALTER TABLE public.news_briefs      ADD COLUMN IF NOT EXISTS summary_en text;
ALTER TABLE public.filing_summaries ADD COLUMN IF NOT EXISTS summary_en text;
