-- 20260908e_production_items_fixes.sql
-- 세 가지 문제 수정(2026-09-08 사용자 보고).

-- ── 1. 리포트형이 9/5까지만 나오던 문제 ──────────────────────────────────
-- 🔴 원인 재확인 — "episode_folder가 report_<id> 패턴이면 아직 영상 제작
-- 전(미완성)"이라는 2026-09-07 가정이 틀렸다. 실측(오늘): channel_reports
-- 전체 73건 중 title이 NULL인 행은 0건 — report_<id> 패턴 5건(실리콘투·
-- 코스맥스·에이피알·아모레퍼시픽·한국콜마, 9/6~9/7)도 전부 title·
-- earnings_summary가 채워진 완성 리포트였다. 채널이 이 5건은 애초에
-- episode_folder를 report_<id>로 고정한 채(YYYYMMDD_종목명으로 안 바꿈)
-- 같은 행을 UPDATE로 채워 넣는 방식을 쓰고 있었던 것 — "report_ 접두사=
-- 미완성"이라는 등식 자체가 성립하지 않는다. 진짜 완성 여부 신호는
-- title IS NOT NULL이다. 게다가 트리거가 AFTER INSERT만 있어서, INSERT
-- 시점엔 title=NULL이었다가 나중에 UPDATE로 title이 채워지는 흐름 자체를
-- 못 잡고 있었다(AFTER UPDATE 트리거가 없었음).
create or replace function public.sync_production_item_from_report()
returns trigger
language plpgsql
as $$
declare
  v_assembled_date date;
begin
  if NEW.title is null then
    return NEW;
  end if;

  if TG_OP = 'INSERT' then
    v_assembled_date := (NEW.created_at at time zone 'Asia/Seoul')::date;
  else
    v_assembled_date := (now() at time zone 'Asia/Seoul')::date;
  end if;

  insert into public.production_items (country, content_type, symbol, stock_name, target_date, assembled_date, title, status, report_id)
  values (NEW.country, 'report', NEW.symbol, NEW.stock_name, NEW.report_date, v_assembled_date, NEW.title, '조립됨', NEW.id)
  on conflict (report_id) where report_id is not null do update set
    title = excluded.title,
    status = '조립됨',
    updated_at = now();

  return NEW;
end;
$$;

drop trigger if exists production_items_from_report_after_insert on public.channel_reports;
create trigger production_items_from_report_after_insert
  after insert on public.channel_reports
  for each row execute function public.sync_production_item_from_report();

-- 신설 — INSERT 시점엔 title=NULL이라 안 잡히고, 나중에 UPDATE로 title이
-- 채워질 때 잡아야 하는 경우 대응.
drop trigger if exists production_items_from_report_after_update on public.channel_reports;
create trigger production_items_from_report_after_update
  after update on public.channel_reports
  for each row
  when (
    OLD.title is distinct from NEW.title
    or OLD.reasons is distinct from NEW.reasons
    or OLD.earnings_summary is distinct from NEW.earnings_summary
  )
  execute function public.sync_production_item_from_report();

-- 소급 반영 — 이전 백필은 "episode_folder !~ '^report_'" 조건으로 이 5건을
-- 빼먹었다. title is not null 조건으로 다시 채운다(idempotent).
insert into public.production_items (country, content_type, symbol, stock_name, target_date, assembled_date, title, status, report_id)
select country, 'report', symbol, stock_name, report_date, (created_at at time zone 'Asia/Seoul')::date, title, '조립됨', id
from public.channel_reports
where title is not null
on conflict (report_id) where report_id is not null do update set
  title = excluded.title,
  updated_at = now();

-- ── 2. 성장스토리 제목이 전부 "—"이던 문제 ──────────────────────────────
-- channel_growth_stories엔 애초에 title 컬럼이 없었다(적재 자체가 안 됨).
-- 채널이 나중에 보낼 수 있게 자리를 만든다(채널 스크립트 수정은 스코프
-- 밖 — 컬럼만 준비). 채널이 아직 안 보내는 동안엔 intro 첫 문장이 "이
-- 영상이 뭘 다루는지"를 나름 설명해줘서, 화면에서 "—"보다 낫다고 판단해
-- 임시로 title 대신 쓴다(공개 사이트엔 전혀 영향 없음 — production_items
-- 는 admin 전용 표시 문자열일 뿐).
alter table public.channel_growth_stories add column if not exists title text;
comment on column public.channel_growth_stories.title is
  '유튜브 제목 — 채널이 아직 안 보냄(youtube.md에는 있음, 이 컬럼은 자리만 준비). NULL이면 production_items 표시에서 intro로 대체.';

create or replace function public.sync_production_item_from_growth_story()
returns trigger
language plpgsql
as $$
begin
  insert into public.production_items (country, content_type, symbol, stock_name, target_date, assembled_date, title, status, growth_story_id)
  values (NEW.country, 'growth_story', NEW.symbol, NEW.stock_name, NEW.source_date, (now() at time zone 'Asia/Seoul')::date, coalesce(NEW.title, NEW.intro), '조립됨', NEW.id)
  on conflict (growth_story_id) where growth_story_id is not null do update set
    title = excluded.title,
    status = '조립됨',
    uploaded_at = null,
    assembled_date = (now() at time zone 'Asia/Seoul')::date,
    updated_at = now();

  return NEW;
end;
$$;

-- growth_story도 title이 나중에 채워질 수 있으니(채널이 언젠가 보내기
-- 시작하면) UPDATE 트리거 WHEN절에 title 변경도 추가한다.
drop trigger if exists production_items_from_growth_story_after_update on public.channel_growth_stories;
create trigger production_items_from_growth_story_after_update
  after update on public.channel_growth_stories
  for each row
  when (
    OLD.episode_folder is distinct from NEW.episode_folder
    or OLD.source_date is distinct from NEW.source_date
    or OLD.intro is distinct from NEW.intro
    or OLD.challenge is distinct from NEW.challenge
    or OLD.response is distinct from NEW.response
    or OLD.summary is distinct from NEW.summary
    or OLD.title is distinct from NEW.title
  )
  execute function public.sync_production_item_from_growth_story();

-- 기존 성장스토리 production_items 행의 title을 intro로 소급 채움.
update public.production_items pi
set title = cgs.intro
from public.channel_growth_stories cgs
where pi.growth_story_id = cgs.id and pi.title is null;

-- ── 3. 롱폼을 관리 대상에 넣을 자리 준비(스키마만 — 채널 쪽 자동 적재는
-- 스코프 밖, 지금은 admin이 수동으로 한 줄 추가하는 것까지) ─────────────
-- 롱폼은 쇼츠 여러 편을 묶은 것이라 종목 하나로 특정이 안 된다. symbol을
-- nullable로 풀고(report_id/growth_story_id도 이미 nullable과 같은 원리),
-- 묶인 종목 목록은 bundled_symbols 배열에, 제목("A · B · C — 9월 8일" 형식)
-- 은 기존 title 컬럼을 그대로 재사용한다(리포트형·성장스토리와 동일 필드
-- 재사용 — 새 개념 아님, 관리자 화면 표시 방식이 같아서 그대로 맞는다).
alter table public.production_items alter column symbol drop not null;
alter table public.production_items add column if not exists bundled_symbols text[];

alter table public.production_items drop constraint if exists production_items_content_type_check;
alter table public.production_items add constraint production_items_content_type_check
  check (content_type in ('report', 'growth_story', 'longform'));
