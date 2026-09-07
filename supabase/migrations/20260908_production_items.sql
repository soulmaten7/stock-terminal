-- 20260908_production_items.sql
-- 제작 관리자 페이지(docs/ORDER_제작관리자페이지_0908.md STEP1 설계, 승인 후 구현) —
-- 채널이 만드는 콘텐츠(리포트형·성장스토리, 한국·미국)의 제작 진행 상태를 admin이
-- 한곳에서 보고 관리하기 위한 전용 테이블. channel_reports/channel_growth_stories는
-- "공개 사이트가 읽는 콘텐츠"고 이건 "관리자만 보는 제작 진행 상태"라 성격이 달라
-- 별도 테이블로 둔다(컬럼 추가 방식 아님) — 또 대기 단계(아직 조립 전)는 저
-- 콘텐츠 테이블들에 행 자체가 없어서, 컬럼 추가 방식으론 애초에 표현이 안 된다.
--
-- status 4단계 중 '대기중'·'기획됨'은 이번 STEP에서 자동으로 채워지지 않는다 —
-- 그 시점 신호가 채널 저장소(대기열 생성 스크립트)에만 있고, 채널 저장소는 이번
-- 범위에서 읽기만 하기로 했다(ORDER "하지 말 것"). 스키마엔 자리를 만들어두되
-- 실제로는 당분간 모든 항목이 '조립됨'부터 시작한다.
create table if not exists public.production_items (
  id             bigint generated always as identity primary key,

  country        text not null,               -- 'KR' | 'US'
  content_type   text not null,                -- 'report' | 'growth_story'
  symbol         text not null,
  stock_name     text not null,
  target_date    date not null,                -- report=report_date, growth_story=source_date

  title          text,                         -- report는 트리거가 channel_reports.title 복사.
                                                 -- growth_story는 지금 제목 소스가 없어(§SYSTEM_MAP
                                                 -- "유튜브 제목 미적재") 당분간 NULL — 채널 쪽 적재 전까지.
  status         text not null default '대기중' check (status in ('대기중', '기획됨', '조립됨', '업로드됨')),
  uploaded_at    timestamptz,
  youtube_url    text,
  instagram_note text,                          -- 자리만 — 채널 쪽 적재 전까지 비워둠

  report_id       bigint references public.channel_reports(id) on delete cascade,
  growth_story_id bigint references public.channel_growth_stories(id) on delete cascade,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint production_items_content_type_check check (content_type in ('report', 'growth_story'))
);

comment on table public.production_items is
  '채널 제작 콘텐츠(리포트형·성장스토리)의 관리자 진행 상태 추적. channel_reports/channel_growth_stories와 분리 — 공개 콘텐츠 테이블이 아니라 admin 전용.';

-- 조립 완료된 콘텐츠 하나당 production_items 행 하나 — 트리거가 이 키로 upsert한다.
create unique index if not exists uq_production_items_report_id on public.production_items (report_id) where report_id is not null;
create unique index if not exists uq_production_items_growth_story_id on public.production_items (growth_story_id) where growth_story_id is not null;

create index if not exists idx_production_items_filter on public.production_items (country, content_type, status, target_date desc);

-- RLS — 🔴 이 테이블은 기존 "공개 읽기" 관례(REVOKE ALL + anon/authenticated SELECT)를
-- 따르지 않는다. 공개 사이트 소비처가 전혀 없는 순수 관리자 데이터라 anon/authenticated
-- 에 SELECT조차 주지 않는다 — admin API 라우트가 service_role(RLS 우회)로만 접근한다.
alter table public.production_items enable row level security;
revoke all on public.production_items from anon, authenticated;
