-- 20260816b_drop_unused_tables.sql
-- 미사용 테이블 7개 — 프로덕션 DB에서 완전 삭제.
--
-- STEP1051: probe_1049(2026-08-16)가 69개 테이블 전수 인벤토리에서 「미사용(코드 참조 0)」으로
-- 판정한 8건을 STEP1051이 두 방법(정방향 이름검색 — 따옴표 3종+템플릿리터럴 · 역방향 —
-- .from()/.rpc() 코드 전수 수집 대조)으로 재확인했다. `AdvisorDirectory`(STEP1035)·`dividends`
-- (STEP1047)가 같은 날 재확인 없이 틀렸던 전례가 있어, 이번엔 재확인 후에만 DROP한다.
--
-- 🔴 재확인 결과 8건 중 2건(damodaran_capex·damodaran_working_capital)은 처분에서 제외했다 —
--   probe_1049의 "미사용"은 "읽는 코드가 없다"만 확인했을 뿐, ingest_damodaran.ts가 매년
--   능동적으로 write하는 "대조용 참고자료"(STEP846 정책, lib/revdcf/registry.ts에 명시)라서
--   반증 조건(⓪-4)이 실제로 걸렸다 — probe_1051.md §A-1 참고. 이 마이그레이션은 그 2개를 건드리지 않는다.
--
-- 🔴 복원 좌표(스키마+데이터 백업) = 이 마이그레이션과 같은 커밋에 포함된
--   spinoff/unused-tables-2026-08-16/schema.sql(DDL 원문) + data/*.json(전체 행 덤프,
--   us_sector_relative_snapshot 2,294행·products 10행 실데이터 + 나머지 5개는 존재 기록용 빈 배열).
--
-- 삭제 전 실측(2026-08-16, STEP1051): ai_view_cache=0·banned_words=0·macro_indicators=0·
--   discussion_reports=0·platform_discussion_reports=0·us_sector_relative_snapshot=2,294·products=10.
--
-- 다른 기능 참조 확인(전수, probe_1049·1051 방법①·② 재확인):
--   ① discussion_reports·platform_discussion_reports는 부모(discussions·platform_discussions,
--      본체에 그대로 남김)의 자식이나, app/api/account/delete/route.ts의 USER_OWNED_TABLES
--      클린업 배열에도 이 둘은 없어 참조가 0이었다(discussions·discussion_comments·
--      discussion_likes·platform_discussions·platform_discussion_likes는 그 배열에 있어 유지).
--   ② products는 SPDR 다운로드 URL 경로 문자열과의 우연한 부분일치를 제외하면 참조 0.
--      내용은 KR ETF 10건(KODEX·TIGER), created_at 단일 타임스탬프(2026-06-24)로
--      kr-pilot-2026-06-25와 같은 시딩 패턴 — 귀속은 KR로 판정(spinoff 위치는 별도 폴더,
--      README §① 참고).
--   ③ us_sector_relative_snapshot(snapshot_tag='pre_step980')은 STEP980 이전 1회 감사
--      스냅샷 — 쓰기 코드·읽기 코드 둘 다 0.
--   ④ kr_stock_snapshot·us_*·discussions·platform_discussions 등 살아있는 테이블은 전부 무접촉.
--
-- ⚠️ 이 마이그레이션은 Cowork/Claude Code가 Supabase MCP로 직접 적용. 되돌릴 수 없는 삭제.

DROP TABLE IF EXISTS public.discussion_reports;
DROP TABLE IF EXISTS public.platform_discussion_reports;
DROP TABLE IF EXISTS public.ai_view_cache;
DROP TABLE IF EXISTS public.banned_words;
DROP TABLE IF EXISTS public.macro_indicators;
DROP TABLE IF EXISTS public.us_sector_relative_snapshot;
DROP TABLE IF EXISTS public.products;
