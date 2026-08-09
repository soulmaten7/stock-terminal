-- STEP 956 §2 — Q1 ②단계: 업종 백분위 저장처. us_valuation(절대값)과 개념이 다르고 계산 시점도 다르다
-- (백분위는 같은 업종 다른 종목 값이 전부 있어야 낸다 — 종목별 upsert 루프 안에서 못 낸다. us_valuation을
--  사후 UPDATE하면 부분갱신·경합 위험) — 그래서 us_valuation에 컬럼을 얹지 않고 별도 테이블로 둔다.
-- RLS 패턴 = us_valuation과 동일(직접 조회 확인: RLS on·anon/authenticated 권한 0·service-role만).
create table if not exists public.us_sector_relative (
  as_of          date not null,
  symbol         text not null,
  sector         text,                        -- 계산에 쓴 업종(us_sector_wide 기준)
  per_pct        numeric,
  pbr_pct        numeric,
  psr_pct        numeric,
  ev_ebitda_pct  numeric,
  per_n          int,
  pbr_n          int,
  psr_n          int,
  ev_ebitda_n    int,
  -- 🔴 unavailable 사유 3종 — 빈 칸을 null로만 두지 않는다(규칙 5-1 ⑤):
  --   NO_SECTOR(섹터 미분류) · NO_VALUE(그 축 값 자체가 없음) · SAMPLE_TOO_SMALL(유효표본 < minSample)
  unavailable    jsonb not null default '{}'::jsonb,
  min_sample     int not null,                -- 계산 당시의 minSample(나중에 바뀌어도 추적 가능하게)
  updated_at     timestamptz default now(),
  primary key (as_of, symbol)
);

alter table public.us_sector_relative enable row level security;
revoke all on public.us_sector_relative from anon, authenticated;
