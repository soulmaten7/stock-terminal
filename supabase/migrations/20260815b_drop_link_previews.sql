-- 20260815b_drop_link_previews.sql
-- link_previews(OG 링크 프리뷰 캐시, advisor 채널 링크 전용) — 프로덕션 DB에서 삭제.
--
-- 최초 리딩방 DB 정리(20260815_drop_advisor_directory.sql)에서 이름 패턴에 안 걸려
-- 놓쳤던 테이블. 같은 날 후속 리뷰로 발견 — 본체 코드 참조 0곳(app/lib/components/scripts
-- 전수 재확인), spinoff/advisor-directory의 2개 라우트(link-preview·admin/crawl-previews)
-- 에서만 쓰였다. 개인정보 없음(url·og_title·og_image·og_description·site_name·status·
-- fetched_at — user_id류 컬럼 자체가 없음).
--
-- 🔴 복원 좌표(스키마 백업) = 커밋 `b0bf663`. 전체 DDL = spinoff/advisor-directory/schema.sql §10.
-- 삭제 전 실측(2026-08-15): 1,005행. 재크롤 가능한 캐시라 데이터는 덤프하지 않았다.
--
-- 🔴 link_hub는 완전히 다른 테이블이다(본체 5곳에서 여전히 사용 중) — 이 마이그레이션은
-- link_previews만 건드린다. link_hub·link_hub_favorites·link_hub_clicks는 무접촉.
--
-- ⚠️ Cowork/Claude Code가 Supabase MCP로 직접 적용. 되돌릴 수 없는 삭제.

DROP TABLE IF EXISTS public.link_previews;
