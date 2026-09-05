-- 20260905_our_channels.sql
-- ORDER_트릴리언채널카드_0905 STEP1 — 홈에 노출할 "우리 유튜브 채널 2개"(한국 스톡스카우터·
-- 미국 WeTheTicker) 전용 테이블. 🔴 youtube_channels(경쟁사 Top100 랭킹)와 절대 같은 테이블에
-- 넣지 않는다 — refreshYoutubeTop100()이 매주 delete().eq('country','KR') 후 재삽입하므로
-- 같은 테이블에 있으면 그 크론이 돌 때마다 우리 채널 행이 삭제된다(조사 STEP1 보고 §5 근거).
-- 적용: 2026-09-05 라이브 반영(ccbwxcszdoyjxvckedfp, MCP apply_migration).

create table if not exists public.our_channels (
  id                bigint generated always as identity primary key,
  channel_key       text not null,      -- 'kr' | 'us' — 화면이 고정 2장을 그릴 때 쓰는 안정적 키(채널 개명 대비)
  channel_id        text not null,      -- YouTube 채널 ID(UC...)
  title             text not null,      -- 채널명(YouTube API snippet.title 그대로)
  subscriber_count  bigint,             -- API 실패 시 NULL 허용 — 카드는 로고·이름·링크로 유지, 구독자수만 생략
  thumbnail_url     text,
  channel_url       text not null,
  updated_at        timestamptz not null default now(),

  constraint our_channels_channel_key_check check (channel_key in ('kr', 'us'))
);

comment on table public.our_channels is 'Trillion 홈 "우리 채널" 카드 2장(한국·미국) 전용 — youtube_channels(경쟁사 랭킹)와 별개.';

-- 카드 2장 고정이라 channel_key 1개당 1행만 존재해야 한다 — 크론이 upsert(on_conflict=channel_key)로 갱신.
create unique index if not exists uq_our_channels_channel_key on public.our_channels (channel_key);

-- RLS — channel_reports와 같은 패턴(공개 읽기 + REVOKE로 TRUNCATE까지 막기). 쓰기는 크론이 SERVICE_ROLE_KEY로.
alter table public.our_channels enable row level security;
revoke all on public.our_channels from anon, authenticated;
grant select on public.our_channels to anon, authenticated;
drop policy if exists "our_channels public read" on public.our_channels;
create policy "our_channels public read" on public.our_channels for select using (true);
