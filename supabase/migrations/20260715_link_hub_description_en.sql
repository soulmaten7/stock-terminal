-- link_hub 설명 영어화: 로케일별 en 컬럼(Tier 3 *_en 패턴). NULL이면 렌더에서 한글로 폴백.
ALTER TABLE public.link_hub ADD COLUMN IF NOT EXISTS description_en text;
COMMENT ON COLUMN public.link_hub.description_en IS 'English translation of description (for /en locale). NULL falls back to Korean description at render.';
