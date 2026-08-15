-- 20260815_drop_advisor_directory.sql
-- 리딩방·유사투자자문 검증 디렉토리 — 프로덕션 DB에서 완전 삭제.
--
-- 장은태 판정(2026-08-15): "우리 플랫폼에서 사용 안 할 거야... 리딩방 관련 내용을 삭제, 없애버려."
-- STEP1035(코드/i18n 삭제)의 후속 — 그때 DB는 "별도 판정 대상"으로 남겨뒀는데, 이 마이그레이션이 그 판정 실행이다.
--
-- 🔴 복원 좌표(스키마 백업) = 커밋 `d950208`("feat(spinoff): 리딩방 DB 스키마 보관 — schema.sql 신설").
--   전체 DDL(CREATE TABLE/VIEW/INDEX/RLS/함수/트리거 원문) = spinoff/advisor-directory/schema.sql.
--   격리 스키마(verify_1036)에서 이 스키마를 실제로 재구축해 검증까지 마쳤다(schema.sql 커밋에 포함).
--
-- 삭제 전 실측(2026-08-15): fss_advisors=1,847행(금감원 파인 원장 캐시, scripts/import-fss-advisors.ts로 재수집 가능).
--   나머지 12개 테이블(leading_rooms·leading_room_votes·room_favorites·room_likes·room_reports·
--   room_submissions·room_reviews·room_review_reports·business_claims·business_members·
--   business_listing·business_links) 전부 0행 — 삭제할 데이터가 없었다.
--
-- 다른 기능 참조 확인(전수):
--   ① app/api/account/delete/route.ts의 USER_OWNED_TABLES가 이 중 9개를 참조하고 있었다 —
--      이 마이그레이션과 같은 커밋에서 그 배열에서 9개 항목을 먼저 제거했다(테이블 삭제 후에도
--      회원탈퇴 기능이 "relation does not exist"로 죽지 않도록).
--   ② public.update_target_discussion_count() 함수(017/019 마이그레이션, platform_discussions 트리거)가
--      target_type='room'일 때 leading_rooms를 참조하는 분기가 있다. platform_discussions는
--      상품(ETF 등) 리뷰까지 포괄하는 별개 기능이라 이번 삭제 범위 밖으로 남겼다 — 이미 0행·코드
--      미사용(도달 불가능)이라 leading_rooms가 없어져도 실행될 길이 없다. 이 함수·트리거·
--      platform_discussions 계열 테이블은 건드리지 않는다.
--   ③ kr_stock_snapshot 등 KR 시장 데이터 테이블은 이 클러스터와 완전히 무관 — 무접촉.
--
-- ⚠️ 이 마이그레이션은 Cowork/Claude Code 가 Supabase MCP 로 직접 적용. 되돌릴 수 없는 삭제.

-- 뷰부터(테이블 의존) — anon/authenticated에 REVOKE만 걸려 있던 SECURITY DEFINER 뷰.
DROP VIEW IF EXISTS public.advisor_directory;

-- 자식(FK로 다른 테이블을 참조하는 쪽)부터 순서대로.
DROP TABLE IF EXISTS public.leading_room_votes;
DROP TABLE IF EXISTS public.room_review_reports;
DROP TABLE IF EXISTS public.leading_rooms;   -- fss_advisors를 참조(ON DELETE SET NULL) → fss_advisors보다 먼저
DROP TABLE IF EXISTS public.room_reviews;
DROP TABLE IF EXISTS public.room_submissions;
DROP TABLE IF EXISTS public.room_likes;
DROP TABLE IF EXISTS public.room_reports;
DROP TABLE IF EXISTS public.room_favorites;
DROP TABLE IF EXISTS public.business_members;
DROP TABLE IF EXISTS public.business_claims;
DROP TABLE IF EXISTS public.business_listing;
DROP TABLE IF EXISTS public.business_links;
DROP TABLE IF EXISTS public.fss_advisors;    -- 부모, 마지막

-- 함수 — 트리거는 테이블과 함께 자동 삭제되지만 함수 자체는 별도 DROP 필요.
DROP FUNCTION IF EXISTS public.update_leading_room_vote_count();
DROP FUNCTION IF EXISTS public.increment_room_view(uuid);
