-- 20260908b_production_items_triggers.sql
-- channel_reports/channel_growth_stories에 새 콘텐츠가 조립돼 들어오면 production_items에
-- 자동으로 '조립됨' 행을 만든다 — 채널 저장소(stock-shorts) 코드를 전혀 안 건드리고
-- (기존 push 흐름 그대로) DB 트리거만으로 해결한다(ORDER 1-C가 가정한 "채널 스크립트
-- 수정 필요"보다 더 간단한 경로).

-- ── channel_reports → production_items (INSERT만) ──────────────────────────
-- 🔴 report_<id> 합성 키(영상 제작 전 raw 리포트 push, .claude/rules/mistakes.md
-- 2026-09-07 "중복 표시" 항목 참고)는 제외한다 — 그 단계는 아직 "조립됨"이 아니고,
-- 나중에 진짜 episode_folder로 다시 push될 때 별도 id로 또 들어와 중복 행이 생긴다
-- (실제로 겪은 사고와 똑같은 패턴이라 트리거 단계에서 미리 막는다).
create or replace function public.sync_production_item_from_report()
returns trigger
language plpgsql
as $$
begin
  if NEW.episode_folder ~ '^report_' then
    return NEW;
  end if;

  insert into public.production_items (country, content_type, symbol, stock_name, target_date, title, status, report_id)
  values (NEW.country, 'report', NEW.symbol, NEW.stock_name, NEW.report_date, NEW.title, '조립됨', NEW.id)
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

-- ── channel_growth_stories → production_items (INSERT + 내용 변경 UPDATE) ──
-- 🔴 2026-09-08 사용자 확정 — 재제작(연 1회 갱신)은 새 사업보고서로 만든 새 영상이라
-- 업로드도 새로 필요하다. UPDATE 시 status를 '조립됨'으로 되돌리고 uploaded_at을
-- 비운다(작년 편 업로드 여부와 올해 편은 별개). 단, "내용이 실제로 바뀐 UPDATE"에만
-- 반응한다 — updated_at만 찍는 무해한 UPDATE(예: 트리거 재발화 테스트)까지 반응하면
-- 관리자가 이미 체크해 둔 업로드 상태가 근거 없이 초기화된다.
create or replace function public.sync_production_item_from_growth_story()
returns trigger
language plpgsql
as $$
begin
  insert into public.production_items (country, content_type, symbol, stock_name, target_date, status, growth_story_id)
  values (NEW.country, 'growth_story', NEW.symbol, NEW.stock_name, NEW.source_date, '조립됨', NEW.id)
  on conflict (growth_story_id) where growth_story_id is not null do update set
    status = '조립됨',
    uploaded_at = null,
    updated_at = now();

  return NEW;
end;
$$;

drop trigger if exists production_items_from_growth_story_after_insert on public.channel_growth_stories;
create trigger production_items_from_growth_story_after_insert
  after insert on public.channel_growth_stories
  for each row execute function public.sync_production_item_from_growth_story();

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
  )
  execute function public.sync_production_item_from_growth_story();
