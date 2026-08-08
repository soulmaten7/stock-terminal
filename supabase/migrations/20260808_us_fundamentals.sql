-- STEP 947 §3 — Q1 밸류에이션 분모 캐시. computeDrivers()의 fundamentals(＋ok:true 시 market)를 그대로 저장.
-- 🔴 as_of를 두지 않는다 — 이 표는 "가장 최근에 받아온 재무" 한 벌이다. 날짜별 이력이 필요해지면 그때 별도 판정.
-- RLS 패턴 = us_market_cap(043)·us_sector_*(20260808) 동일(읽기·쓰기 전부 service-role).
create table if not exists public.us_fundamentals (
  symbol                text primary key,
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
  -- STEP 947 추가지침 A/B-1 — us_valuation.unavailable과 같은 사고방식. 빈 칸을 null로만 두지 않는다(규칙 5-1 ⑤).
  -- 예: 'NO_CIK'(us_cik_map 미매칭) · 'MISSING_TAG_*'(computeDrivers skipReason 그대로) · 'HTTP_*' · 'EX'
  unavailable_reason    text,
  fetched_at            timestamptz not null default now()
);
create index if not exists idx_us_fundamentals_fetched_at on public.us_fundamentals (fetched_at);

alter table public.us_fundamentals enable row level security;
revoke all on public.us_fundamentals from anon, authenticated;
