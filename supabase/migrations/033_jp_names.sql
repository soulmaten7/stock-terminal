-- 033_jp_names — JP 티커(4자리) → 일본어 종목명. R3 일본 뉴스를 진짜 일본어명으로 검색하기 위함.
-- 소스: JPX 東証上場銘柄一覧(data_j.xls) · 시드: scripts/seed_jp_names.ts (약 4,000종목). 야후 영어명 대체.
create table if not exists public.jp_names (
  code text primary key,
  name_ja text not null,
  created_at timestamptz default now()
);
alter table public.jp_names enable row level security;
drop policy if exists "jp_names public read" on public.jp_names;
create policy "jp_names public read" on public.jp_names for select using (true);
