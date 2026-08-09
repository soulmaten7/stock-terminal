-- STEP 951 부속 — us_fundamentals는 symbol PK upsert라 크론이 돌 때마다 이전 값이 사라진다.
-- 951(YS 고정창 → resolveYearWindow) 적용 전 원시 재무를 마지막으로 뜬다 — 적용 전/후 원시값 비교의 유일한 경로.
-- 🔴 규칙 5-2 — 날짜를 테이블명에 박지 않는다. snapshot_tag 컬럼으로 시점을 구분해, 다른 시점 스냅샷도 같은 표에 얹을 수 있게 연다.
-- 영구 테이블이 아니다 — 비교가 끝나면 지운다(STATE.md에 명시).
-- RLS 패턴 = us_fundamentals(20260808) 그대로(읽기·쓰기 전부 service-role, anon/authenticated 권한 없음).
create table if not exists public.us_fundamentals_snapshot (
  snapshot_tag          text not null,
  symbol                text not null,
  cik                   bigint not null,
  fiscal_year           int,
  net_income            numeric,
  equity                numeric,
  revenue               numeric,
  operating_income      numeric,
  dna                   numeric,
  debt                  numeric,
  non_operating_assets  numeric,
  shares                numeric,
  source_tags           jsonb not null default '{}'::jsonb,
  unavailable_reason    text,
  fetched_at            timestamptz not null,
  captured_at           timestamptz not null default now(),
  primary key (snapshot_tag, symbol)
);

alter table public.us_fundamentals_snapshot enable row level security;
revoke all on public.us_fundamentals_snapshot from anon, authenticated;
