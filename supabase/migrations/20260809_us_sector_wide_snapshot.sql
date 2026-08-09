-- STEP 955 §1 — us_sector_wide(STEP 952 적재, 954 이전의 비결정적 페이지네이션으로 만들어짐)를
-- 재생성하기 전 마지막으로 뜬다. before/after 대조의 유일한 근거.
-- 🔴 규칙 5-2 — 날짜를 테이블명에 박지 않는다. snapshot_tag 컬럼으로 시점을 구분한다.
-- 영구 테이블이 아니다 — 비교가 끝나면 지운다(STATE.md에 명시).
-- 컬럼 구성 = us_sector_wide와 동일 + snapshot_tag·captured_at. RLS 패턴도 동일(service-role만).
create table if not exists public.us_sector_wide_snapshot (
  snapshot_tag  text not null,
  as_of         date not null,
  symbol        text not null,
  sector        text,
  source        text,
  cross_nasdaq  text,
  cross_sic     text,
  cross_yahoo   text,
  disagree      boolean,
  updated_at    timestamptz,
  captured_at   timestamptz not null default now(),
  primary key (snapshot_tag, symbol)
);

alter table public.us_sector_wide_snapshot enable row level security;
revoke all on public.us_sector_wide_snapshot from anon, authenticated;
