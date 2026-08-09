-- STEP 952 §2 — Q1 ②단계(업종 대비) 준비. resolveSector를 us_valuation 전체(1,127)에 돌린 결과를
-- 별도 테이블에 적재한다. 🔴 us_sector_resolved(app/api/sector/us/route.ts가 최신 as_of를 그대로 노출,
-- ExploreClient.tsx:467이 그걸로 라이브 화면을 그림)는 건드리지 않는다 — 여기 쓰면 화면이 움직인다(장은태 판정).
-- 컬럼 구성은 us_sector_resolved와 동일하게 맞춘다 — 통합 판정이 나면 그대로 옮길 수 있게.
-- RLS 패턴 = us_sector_resolved 그대로(직접 조회 확인: RLS on·정책 0·anon/authenticated 권한 0·service-role만).
create table if not exists public.us_sector_wide (
  as_of         date not null,
  symbol        text not null,
  sector        text,
  source        text,          -- spdr | damodaran | damodaran-sibling | yahoo
  cross_nasdaq  text,
  cross_sic     text,
  cross_yahoo   text,
  disagree      boolean,
  updated_at    timestamptz not null default now(),
  primary key (as_of, symbol)
);

alter table public.us_sector_wide enable row level security;
revoke all on public.us_sector_wide from anon, authenticated;
