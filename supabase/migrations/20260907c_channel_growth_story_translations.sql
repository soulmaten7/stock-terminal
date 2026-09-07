-- 20260907c_channel_growth_story_translations.sql
-- channel_growth_stories 자유서술 4파트(intro·challenge·response·summary)의 언어별 번역 캐시.
-- channel_report_translations(20260906)와 완전히 같은 원칙 — 언어가 늘어나도(일본·영국 등)
-- 스키마 변경 없이 대응하려고 _en/_ko 컬럼 대신 별도 테이블(story_id + target_lang 조합 키).
-- stock_name·source_doc은 여기 없다 — 고유명사·짧은 출처 라벨은 번역 대상이 아니다(channel_
-- reports가 stock_name/broker를 번역 안 하고 name_en 조회로 대체하는 것과 동일 원칙).
create table if not exists public.channel_growth_story_translations (
  story_id      bigint not null references public.channel_growth_stories(id) on delete cascade,
  target_lang   text not null,                     -- 'en' | 'ko' (추후 확장 가능 — 스키마 변경 없음)

  intro         text,
  challenge     text,
  response      text,
  summary       text,

  status        text not null default 'ok',        -- 'ok' | 'failed' — 실패해도 행은 남기고 원문 폴백
  error         text,
  model         text,
  translated_at timestamptz not null default now(),

  primary key (story_id, target_lang)
);

comment on table public.channel_growth_story_translations is
  'channel_growth_stories 자유서술 4파트(intro·challenge·response·summary)의 언어별 번역 캐시.';

create index if not exists idx_channel_growth_story_translations_lang on public.channel_growth_story_translations (target_lang);

-- RLS — channel_report_translations와 동일 패턴.
alter table public.channel_growth_story_translations enable row level security;
revoke all on public.channel_growth_story_translations from anon, authenticated;
grant select on public.channel_growth_story_translations to anon, authenticated;
drop policy if exists "channel_growth_story_translations public read" on public.channel_growth_story_translations;
create policy "channel_growth_story_translations public read" on public.channel_growth_story_translations for select using (true);
