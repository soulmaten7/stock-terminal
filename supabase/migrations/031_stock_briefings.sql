-- R2: 종목 브리핑 캐시(종목+날짜 = 하루 1회 재생성, 렌즈 갱신 주기와 일치).
-- 쓰기 = 서비스롤(admin, RLS 우회) / 읽기 = 공개.
create table if not exists public.stock_briefings (
  symbol      text not null,
  as_of       date not null,
  brief_ko    text not null,
  model       text,
  created_at  timestamptz not null default now(),
  primary key (symbol, as_of)
);

alter table public.stock_briefings enable row level security;
drop policy if exists "stock_briefings public read" on public.stock_briefings;
create policy "stock_briefings public read" on public.stock_briefings for select using (true);
