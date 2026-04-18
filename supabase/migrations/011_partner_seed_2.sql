-- 2026-04-18 세션 #15 (D) — 두 번째 테스트 파트너 + home-sidebar-bottom 슬롯 매핑
-- 홈 Row3 우측 하단 placeholder 자리에 노출

INSERT INTO partners (slug, name, category, country, description, features, logo_url, cta_text, cta_url, priority, is_active)
VALUES (
  'test-asset',
  '테스트 자산운용',
  '자산운용',
  'KR',
  '글로벌 ETF 포트폴리오 + AI 로보어드바이저 서비스',
  '[
    {"title":"연 보수 0.2%","desc":"업계 최저 수준 총보수"},
    {"title":"AI 리밸런싱","desc":"시장 변동에 자동 대응"},
    {"title":"최소 10만원","desc":"누구나 시작 가능한 소액 투자"}
  ]'::jsonb,
  'https://placehold.co/240x80/FF9500/white?text=TEST+Asset',
  '포트폴리오 상담 신청',
  NULL,
  90,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO partner_slots (slot_key, partner_id, position)
SELECT 'home-sidebar-bottom', id, 1
FROM partners
WHERE slug = 'test-asset'
ON CONFLICT (slot_key, partner_id) DO NOTHING;
