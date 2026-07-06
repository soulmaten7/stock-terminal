-- 034_cn_names — CN 종목(sym) → 중국어명. R3 중국 뉴스를 진짜 중국어명으로 검색하기 위함.
-- HK(.HK) = HKEX 번체목록(繁體·zh-HK 검색) / A주(.SS·.SZ) = 텐센트 qt.gtimg.cn 종목명(简体·zh-CN 검색).
-- 시드: scripts/seed_cn_names.ts. 야후 영어명 대체.
create table if not exists public.cn_names (
  sym text primary key,
  name_zh text not null,
  market text,
  created_at timestamptz default now()
);
alter table public.cn_names enable row level security;
drop policy if exists "cn_names public read" on public.cn_names;
create policy "cn_names public read" on public.cn_names for select using (true);
