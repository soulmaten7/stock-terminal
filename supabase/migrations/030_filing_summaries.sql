-- R1: 8-K 공시 원문 AI 요약 전역 캐시 (공시당 1회 생성·전원 공유). accession = SEC 고유 ID.
-- 쓰기 = 서비스롤(admin client, RLS 우회) / 읽기 = 공개(요약은 공개 사실).
create table if not exists public.filing_summaries (
  accession   text primary key,
  symbol      text,
  summary_ko  text not null,
  model       text,
  created_at  timestamptz not null default now()
);

alter table public.filing_summaries enable row level security;
drop policy if exists "filing_summaries public read" on public.filing_summaries;
create policy "filing_summaries public read" on public.filing_summaries for select using (true);
