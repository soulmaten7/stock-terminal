-- link_hub 사이트명 영어화: 로케일별 en 컬럼. NULL이면 렌더에서 한글 site_name으로 폴백.
ALTER TABLE public.link_hub ADD COLUMN IF NOT EXISTS site_name_en text;
COMMENT ON COLUMN public.link_hub.site_name_en IS 'English site name (for /en locale). NULL falls back to Korean site_name at render. Only filled for rows whose site_name contains Korean.';
