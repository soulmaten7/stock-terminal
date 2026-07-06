-- R3: 종목 뉴스 요약 캐시(종목+날짜). tags = 중립 토픽 태그(방향 아님).
-- 쓰기 = 서비스롤(admin) / 읽기 = 공개.
create table if not exists public.news_briefs (
  symbol      text not null,
  as_of       date not null,
  summary_ko  text not null,
  tags        jsonb not null default '[]'::jsonb,
  model       text,
  created_at  timestamptz not null default now(),
  primary key (symbol, as_of)
);

alter table public.news_briefs enable row level security;
drop policy if exists "news_briefs public read" on public.news_briefs;
create policy "news_briefs public read" on public.news_briefs for select using (true);
