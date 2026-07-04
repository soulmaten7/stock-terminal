-- 028_lens_scores.sql
-- 2026-07-04 · 전 종목 렌즈 7팩터 미리계산(스크리닝·랭킹 토대).
-- lib/lensCompute의 공용 엔진이 산출하는 value/state(모멘텀·저변동·밸류·퀄리티·자산성장·기술 + F-Score)를 배치로 저장.
-- 온디맨드 카드(/api/lens)와 같은 엔진 → 카드=배치 계산 일치(엔진=검증 일치).
-- ⚠️ Trillion DB(ref ccbwxcszdoyjxvckedfp)에 MCP(apply_migration)로 적용. 본 파일은 repo 아카이브/재현용.

create table if not exists public.lens_scores (
  symbol            text primary key,
  market            text not null default 'US',
  name              text,
  price             numeric,
  momentum_value    numeric,   -- 12-1 모멘텀 %
  momentum_state    text,      -- up / flat / down
  lowvol_value      numeric,   -- 연변동성 %
  lowvol_state      text,      -- calm / mid / jumpy
  valuation_value   numeric,   -- PER
  valuation_state   text,      -- cheap / mid / rich / na
  quality_value     numeric,   -- GP/A %
  quality_state     text,      -- high / mid / low / na
  assetgrowth_value numeric,   -- 자산성장 %
  assetgrowth_state text,      -- conservative / mid / aggressive / na
  technical_value   numeric,   -- 200일선 대비 %
  technical_state   text,      -- up / flat / down
  fscore_value      integer,   -- 0~9
  fscore_state      text,      -- strong(>=7) / mid / weak(<=3) / na
  updated_at        timestamptz not null default now()
);

comment on table public.lens_scores is '전 종목 렌즈 7팩터 미리계산(스크리닝·랭킹 토대). lib/lensCompute 공용 엔진 산출. 하루 1회 배치 upsert.';

-- 스크리닝 정렬용 인덱스(대표 축)
create index if not exists idx_lens_scores_momentum  on public.lens_scores (momentum_value  desc nulls last);
create index if not exists idx_lens_scores_quality   on public.lens_scores (quality_value   desc nulls last);
create index if not exists idx_lens_scores_valuation on public.lens_scores (valuation_value asc  nulls last);
create index if not exists idx_lens_scores_market    on public.lens_scores (market);

-- RLS: 공개 읽기(스크리닝 결과는 누구나), 쓰기는 service-role(RLS 우회)만.
alter table public.lens_scores enable row level security;
drop policy if exists "lens_scores public read" on public.lens_scores;
create policy "lens_scores public read" on public.lens_scores for select using (true);
