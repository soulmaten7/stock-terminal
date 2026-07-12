-- 하드닝: DEFINER 뷰 정리 (2026-07-12 · 악용 구멍 아님 · 코스메틱/defense-in-depth)
-- 조사결과(라이브 검증):
--   · advisor_directory 는 DEFINER 가 "필수" — 로그아웃 방문자에게 공개 리딩방 디렉토리를 서빙한다.
--     라우트가 세션 클라이언트(로그아웃=anon)로 읽는데, base 테이블(fss_advisors·room_submissions·room_*)은
--     RLS on + anon 정책 0 → 이 DEFINER 뷰가 공개 컬럼만 정확히 노출하는 통로. security_invoker 켜면
--     로그아웃 사용자에게 디렉토리가 빈 화면이 됨 → DEFINER 유지.
--   · 두 뷰 모두 UNION/LATERAL 복합뷰라 업데이트 불가 → anon 의 INSERT/UPDATE/DELETE 권한은 원래 먹통(쓰기 우회 없음).
--   · stock_snapshot_v 는 앱 미사용(레거시·마이그레이션 정의에만 존재) → invoker 전환 + anon/auth 권한 회수 무영향.
-- 적용: 2026-07-12 라이브(ccbwxcszdoyjxvckedfp) apply_migration 선반영 → advisor_directory anon=SELECT만,
--       stock_snapshot_v=INVOKER·anon none 확인, /api/advisors 로그아웃 1,553행 정상 서빙 검증.

ALTER VIEW public.stock_snapshot_v SET (security_invoker = on);
REVOKE ALL ON public.stock_snapshot_v FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.advisor_directory FROM anon, authenticated;
