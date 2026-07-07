-- 037_gb_names — GB 티커(HSBA.L) → 영문 종목명(클린). R3 영국 뉴스 검색어용(야후 shortName은 verbose).
-- 소스: Wikipedia FTSE 100 + FTSE 250 구성종목(Company/Ticker) · 시드: data/gb_symbols.json (349종목).
create table if not exists public.gb_names (
  sym text primary key,
  name_en text not null,
  market text,
  created_at timestamptz default now()
);
alter table public.gb_names enable row level security;
drop policy if exists "gb_names public read" on public.gb_names;
create policy "gb_names public read" on public.gb_names for select using (true);
