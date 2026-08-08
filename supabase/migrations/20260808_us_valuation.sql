-- STEP 947 §5 — Q1 밸류에이션 4축(PER·PBR·PSR·EV/EBITDA) 매일 계산 결과. SEC 호출 0건(us_fundamentals＋us_market_cap만 읽음).
-- 정의의 유일한 출처 = lib/valuation.ts의 VALUATION_SPEC(규칙 5-2 ⑤ — 문서·코드가 같은 것을 가리킨다).
-- RLS 패턴 = us_market_cap(043)·us_sector_*(20260808) 동일(읽기·쓰기 전부 service-role).
create table if not exists public.us_valuation (
  as_of                   date not null,
  symbol                  text not null,
  price                   numeric,   -- 표시용(us_stock_perf.price가 있으면 채움) — 계산엔 안 씀(5-5)
  market_cap              numeric,
  per                     numeric,
  pbr                     numeric,
  psr                     numeric,
  ev_ebitda               numeric,
  ev                      numeric,
  ebitda                  numeric,
  per_basis               text,      -- 'annual'(장은태 판정 2026-08-08, lib/valuation.ts VALUATION_SPEC.per.basis)
  fundamentals_fiscal_year int,
  fundamentals_age_days   int,       -- as_of - us_fundamentals.fetched_at(일)
  -- 🔴 축별 미성립 사유. 빈 칸을 null로만 두지 않는다(규칙 5-1 ⑤). 예: {"per":"NEGATIVE_EARNINGS"}
  unavailable             jsonb not null default '{}'::jsonb,
  updated_at              timestamptz default now(),
  primary key (as_of, symbol)
);

alter table public.us_valuation enable row level security;
revoke all on public.us_valuation from anon, authenticated;
