-- 20260907b_channel_growth_story_scripts.sql
-- channel_growth_stories의 원본 대본(CUT별 나레이션) 이력 — append-only, 절대 UPDATE하지 않는다.
-- 이유(2026-09-07 사용자 확정): channel_growth_stories는 종목당 1행을 계속 UPDATE하지만, 그
-- 대본은 이미 영상으로 나간 실물(실제로 발행된 콘텐츠)이라 갱신 때마다 옛 것을 지우면 안 된다 —
-- 이 테이블에 매 갱신(최초 제작 포함)마다 새 행을 하나씩 쌓는다. 화면에 노출하지 않는다(보관 목적).
create table if not exists public.channel_growth_story_scripts (
  id             bigint generated always as identity primary key,
  story_id       bigint not null references public.channel_growth_stories(id) on delete cascade,

  source_doc     text not null,   -- 그 시점 channel_growth_stories.source_doc과 동일(자기서술적으로 남기기 위해 복제)
  source_date    date not null,

  narration_cuts jsonb not null default '[]'::jsonb, -- [{cut, narration}, ...]

  created_at     timestamptz not null default now()
);

comment on table public.channel_growth_story_scripts is
  'channel_growth_stories 원본 대본(CUT별 나레이션) 이력 — append-only, 화면 비노출. 최신 = story_id로 필터 후 created_at desc 1건.';

create index if not exists idx_channel_growth_story_scripts_story on public.channel_growth_story_scripts (story_id, created_at desc);

-- RLS — 같은 프로젝트의 다른 모든 테이블과 동일하게 "공개 읽기, 쓰기는 SERVICE_ROLE만" 패턴을
-- 일관 적용한다(화면이 안 읽어도 예외를 만들지 않음 — 내용 자체가 이미 공개된 영상 대본이라
-- 비공개로 둘 이유도 없다).
alter table public.channel_growth_story_scripts enable row level security;
revoke all on public.channel_growth_story_scripts from anon, authenticated;
grant select on public.channel_growth_story_scripts to anon, authenticated;
drop policy if exists "channel_growth_story_scripts public read" on public.channel_growth_story_scripts;
create policy "channel_growth_story_scripts public read" on public.channel_growth_story_scripts for select using (true);
