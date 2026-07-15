-- Tier 3 R1: en-first INSERT는 {accession, summary_en}만 → summary_ko NULL 허용.
ALTER TABLE public.filing_summaries ALTER COLUMN summary_ko DROP NOT NULL;
-- (라이브 적용됨 via Supabase MCP · 이 파일 = repo 기록.)
