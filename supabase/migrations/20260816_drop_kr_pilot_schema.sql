-- 20260816_drop_kr_pilot_schema.sql
-- KR 파일럿 데이터 스키마(2026-06-25 시딩) — 프로덕션 DB에서 완전 삭제.
--
-- 장은태 판정(2026-08-15): "KR은 추후에 사용을 해야 할 수도 있으니 데이터인 거면,
--   이건 KR 데이터를 모아둔 곳으로 옮겨두고 우린 US를 계속 진행하는 게 맞아."
-- STEP1047(Phase A 증명)이 dividends+stocks가 KR 모아보기 '배당' 탭에 실사용 중임을 발견해
--   그 STEP에서는 DROP을 중단했다(docs/probe_1047_kr_pilot_removal.md).
-- STEP1048이 그 참조를 코드 파킹(components/toolbox/OfferingsFeed.tsx의 배당 분기만 파킹,
--   파일은 삭제하지 않고 호출만 끊음 — docs/PARKED_KR_DIVIDEND_ACTIVATION.md)으로 끊은 뒤
--   이 마이그레이션을 실행한다.
--
-- 🔴 복원 좌표(스키마+데이터 백업) = 이 마이그레이션과 같은 커밋에 포함된
--   spinoff/kr-pilot-2026-06-25/schema.sql(DDL 원문) + data/*.json(전체 행 덤프,
--   stocks 27행·dividends 60행 실데이터 + 나머지 9개는 존재 기록용 빈 배열).
--
-- 삭제 전 실측(2026-08-16, STEP1048 — probe_1047과 재확인 일치):
--   stocks=27행(전부 KR/KOSPI) · dividends=60행 · 나머지 9개(ai_analysis·disclosures·
--   financials·insider_trades·news·quant_factors·short_credit·stock_prices·supply_demand)=0행.
--   stock_snapshot_v(뷰, stocks+quant_factors+dividends 조인) — 2026-07-12 하드닝 마이그레이션에서
--   이미 "앱 미사용(레거시)"로 확인, 오늘 재확인도 grep 0건.
--
-- 다른 기능 참조 확인(전수, probe_1047 방법①·② + STEP1048 재확인):
--   ① app/api/dividend/feed/route.ts가 dividends⋈stocks를 조회해 KR 모아보기 '배당' 탭에
--      서빙하고 있었다 — 이 마이그레이션과 같은 커밋에서 components/toolbox/OfferingsFeed.tsx의
--      호출을 먼저 끊었다(파일 삭제 아님, 파킹).
--   ② app/api/account/delete/route.ts 등 회원탈퇴·관리자·크론 경로에 이 11개 테이블 참조 없음
--      (probe_1047 A-2 확인 완료, STEP1048에서 재확인).
--   ③ kr_stock_snapshot·kr-perf 크론·KR 화면 코드는 이 클러스터와 완전히 무관 — 무접촉.
--   ④ us_* 테이블·UsOfferingsFeed/UsDividendFeed/UsIpoFeed는 별개 계보 — 무접촉.
--
-- ⚠️ 이 마이그레이션은 Cowork/Claude Code가 Supabase MCP로 직접 적용. 되돌릴 수 없는 삭제.

-- 뷰부터(테이블 의존).
DROP VIEW IF EXISTS public.stock_snapshot_v;

-- 자식(FK로 stocks를 참조하는 쪽)부터 순서대로 — 10개, 순서 자체는 서로 독립(전부 stocks만 참조).
DROP TABLE IF EXISTS public.ai_analysis;
DROP TABLE IF EXISTS public.disclosures;
DROP TABLE IF EXISTS public.dividends;
DROP TABLE IF EXISTS public.financials;
DROP TABLE IF EXISTS public.insider_trades;
DROP TABLE IF EXISTS public.news;
DROP TABLE IF EXISTS public.quant_factors;
DROP TABLE IF EXISTS public.short_credit;
DROP TABLE IF EXISTS public.stock_prices;
DROP TABLE IF EXISTS public.supply_demand;

-- 부모, 마지막.
DROP TABLE IF EXISTS public.stocks;
