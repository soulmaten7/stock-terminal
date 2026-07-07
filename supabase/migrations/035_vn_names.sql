-- 035_vn_names — VN 티커(VIC.VN) → 베트남어 종목명. R3 베트남 뉴스를 진짜 베트남어명으로 검색하기 위함.
-- 소스: vnstock listing_companies (HOSE·HNX organ_name) · 시드: data/vn_symbols.json (약 654종목). 야후 영문 서술명 대체.
create table if not exists public.vn_names (
  sym text primary key,
  name_vi text not null,
  market text,
  created_at timestamptz default now()
);
alter table public.vn_names enable row level security;
drop policy if exists "vn_names public read" on public.vn_names;
create policy "vn_names public read" on public.vn_names for select using (true);
