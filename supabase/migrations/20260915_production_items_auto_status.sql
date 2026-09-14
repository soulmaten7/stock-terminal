-- 20260915_production_items_auto_status.sql
-- production_items.status를 수동 체크박스가 아니라 실제 게시 증거(youtube_url·
-- instagram_note, stock-shorts 쪽 scripts/production_evidence.py가 채움)로
-- 자동 판정하도록 전환한다(2026-09-15 사용자 확정 설계).

-- ── 1. manual_override 컬럼 ──────────────────────────────────────────────
-- 예외 상황(증거 스크립트가 못 잡는 게시, 오탐 등)에서 관리자가 자동판정을
-- 끄고 값을 직접 고정할 수 있게 한다. 기본 false — 기존 78건도 전부 자동판정
-- 대상으로 들어간다(§4 소급 재계산 참고, 사용자 확정).
alter table public.production_items add column if not exists manual_override boolean not null default false;
comment on column public.production_items.manual_override is
  'true면 production_items_compute_status_trigger가 이 행을 건드리지 않는다 — admin PATCH {uploaded}가 값을 직접 쓸 때 같이 세운다. {clearOverride:true}로 false로 되돌리면 다음 판정에서 즉시 증거 기준으로 재계산된다.';

-- ── 2. 자동판정 트리거 ────────────────────────────────────────────────────
-- 🔴 growth_story의 '기획됨'(재료만 확보, channel_growth_stories.episode_folder
-- IS NULL — 20260908f, "1차 재료 vs 2차 영상" 구분)은 이 자동판정 대상이
-- 아니다 — 영상이 아직 없는데 업로드 증거 유무로 조립됨/업로드됨을 매기면
-- 그 구분이 사라진다(2026-09-15 사용자 확인). episode_folder가 채워진
-- 뒤부터만 증거 기준 조립됨/업로드됨을 적용한다.
create or replace function public.production_items_compute_status()
returns trigger
language plpgsql
as $$
declare
  v_episode_folder text;
  v_has_evidence boolean;
begin
  if NEW.content_type not in ('report', 'growth_story') or NEW.manual_override then
    return NEW;
  end if;

  if NEW.content_type = 'growth_story' then
    select episode_folder into v_episode_folder
    from public.channel_growth_stories where id = NEW.growth_story_id;

    if v_episode_folder is null then
      NEW.status := '기획됨';
      NEW.uploaded_at := null;
      return NEW;
    end if;
  end if;

  v_has_evidence := (NEW.youtube_url is not null or NEW.instagram_note is not null);

  if v_has_evidence then
    NEW.status := '업로드됨';
    -- "처음 채워진 시각" — 이미 uploaded_at이 있으면(같은 증거로 재판정되는
    -- 경우) 그대로 두고, 새로 증거가 생긴 경우에만 now()를 채운다.
    if TG_OP = 'INSERT' then
      NEW.uploaded_at := coalesce(NEW.uploaded_at, now());
    else
      NEW.uploaded_at := coalesce(OLD.uploaded_at, now());
    end if;
  else
    NEW.status := '조립됨';
    NEW.uploaded_at := null;
  end if;

  return NEW;
end;
$$;

drop trigger if exists production_items_compute_status_trigger on public.production_items;
create trigger production_items_compute_status_trigger
  before insert or update on public.production_items
  for each row execute function public.production_items_compute_status();

-- ── 3. sync 함수 — status는 이제 위 트리거 전담, 콘텐츠 필드만 upsert ──────
-- 🔴 기존 버그: enrichment(title 등 재갱신)가 돌 때마다 이 함수들이 status를
-- '조립됨'으로 직접 써서, 이미 '업로드됨'이던 행이 되돌아갔다(.claude/rules/
-- mistakes.md류 재발 방지). status를 아예 안 건드리면 §2 BEFORE 트리거가
-- 매번 증거 기준으로 다시 계산해 정확해진다.
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

  insert into public.production_items (country, content_type, symbol, stock_name, target_date, assembled_date, title, report_id)
  values (NEW.country, 'report', NEW.symbol, NEW.stock_name, NEW.report_date, v_assembled_date, NEW.title, NEW.id)
  on conflict (report_id) where report_id is not null do update set
    title = excluded.title,
    updated_at = now();

  return NEW;
end;
$$;

create or replace function public.sync_production_item_from_growth_story()
returns trigger
language plpgsql
as $$
begin
  insert into public.production_items (country, content_type, symbol, stock_name, target_date, assembled_date, title, growth_story_id)
  values (NEW.country, 'growth_story', NEW.symbol, NEW.stock_name, NEW.source_date, (now() at time zone 'Asia/Seoul')::date, coalesce(NEW.title, NEW.intro), NEW.id)
  on conflict (growth_story_id) where growth_story_id is not null do update set
    title = excluded.title,
    assembled_date = (now() at time zone 'Asia/Seoul')::date,
    updated_at = now();

  return NEW;
end;
$$;

-- ── 4. 기존 78건 소급 재계산(2026-09-15 사용자 확정 — "즉시 재계산") ──────
-- manual_override는 전부 기본값 false라, 이 UPDATE가 §2 트리거를 그대로
-- 태워 증거 기준으로 다시 판정한다(판정 로직 중복 없이 트리거 재사용).
-- 실측(마이그레이션 적용 전 확인): 증거 없이 '업로드됨'으로 체크돼 있던
-- 44건(리포트 28·성장스토리 16)이 이 UPDATE로 '조립됨'으로 되돌아간다 —
-- 사용자가 명시 승인한 동작. 증거 있는 28건은 uploaded_at 그대로 유지되고,
-- growth_story '기획됨' 1건은 그대로 '기획됨' 유지.
update public.production_items
set updated_at = now()
where content_type in ('report', 'growth_story');
