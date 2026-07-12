-- 보안 수정(1차 출시 게이트): 공개 데이터 테이블 4개 RLS 누락 마감
-- 배경: kr_stock_snapshot·brokers·jp_stock_perf·translation_cache 가 RLS off + anon/authenticated 에
--       DELETE·TRUNCATE·UPDATE 까지 부여돼 있었음 → 공개 anon 키만으로 KR 보드 등 전체 삭제·위조 가능.
-- 안전성: 이 4개의 읽기/쓰기 경로 코드 9곳(lib/krSnapshot·jpPerf·stockName, app/api/brokers·krx/*·yahoo/jp-list·news/feed, app/sitemap)
--         전부 service-role(createAdminClient)= RLS 우회 → RLS on + anon 회수해도 앱 영향 없음(검증 완료).
-- 주의: TRUNCATE 는 RLS 로 차단되지 않으므로 REVOKE 를 병행해야 완전히 막힘.
-- 패턴: 20260711_kr_etp_snapshot.sql 과 동일("RLS on·정책 없음 → 직접 접근 차단, service-role 만").
-- 적용: 2026-07-12 라이브(ccbwxcszdoyjxvckedfp)에 apply_migration 으로 선반영, 본 파일은 리포지토리 기록.

ALTER TABLE public.kr_stock_snapshot  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jp_stock_perf      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_cache  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.kr_stock_snapshot  FROM anon, authenticated;
REVOKE ALL ON public.brokers            FROM anon, authenticated;
REVOKE ALL ON public.jp_stock_perf      FROM anon, authenticated;
REVOKE ALL ON public.translation_cache  FROM anon, authenticated;
