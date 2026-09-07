-- 20260908d_production_items_assembled_date.sql
-- 🔴 실측 발견(2026-09-08, 사용자 보고) — production_items.target_date를
-- report_date/source_date(콘텐츠 내용상 기준일 — 성장스토리는 사업보고서
-- 제출일, 3월 등)로 채워놓고 그걸로 정렬해서, 실제로 이번 주에 막 조립한
-- 성장스토리 편들이 전부 3월(KR)·작년 말~올해 상반기(US) 날짜로 밀려나
-- "최신순" 목록 맨 아래로 사라졌다. 관리 화면에서 의미 있는 건 "언제
-- 만들었나"(조립일)지 콘텐츠 자체의 기준일이 아니다.
--
-- assembled_date를 새로 두고 이걸로 정렬한다. target_date(콘텐츠 기준일)는
-- 그대로 남겨 화면에 같이 보여준다(사용자 승인 — "두 날짜를 다 보여줘도 됨").
--
-- 값 출처: channel_reports.assembled_date 컬럼은 있지만 채널이 실제로
-- 채운 적이 없다(73건 전부 NULL, 실측 확인) — 쓸 수 없다. 대신 두 콘텐츠
-- 테이블 모두 `created_at`(DB가 INSERT 시점에 자동으로 채우는 실제
-- 타임스탬프, 채널 스크립트가 값을 보내지 않아도 항상 정확함)을 근거로
-- KST 날짜로 변환해 쓴다.
alter table public.production_items add column if not exists assembled_date date;

update public.production_items pi
set assembled_date = (cr.created_at at time zone 'Asia/Seoul')::date
from public.channel_reports cr
where pi.report_id = cr.id and pi.assembled_date is null;

update public.production_items pi
set assembled_date = (cgs.created_at at time zone 'Asia/Seoul')::date
from public.channel_growth_stories cgs
where pi.growth_story_id = cgs.id and pi.assembled_date is null;

alter table public.production_items alter column assembled_date set not null;

drop index if exists public.idx_production_items_filter;
create index if not exists idx_production_items_filter on public.production_items (country, content_type, status, assembled_date desc);

-- 트리거 갱신 — report는 NEW.created_at(INSERT 시점 DB 기본값, 트리거와 같은
-- 트랜잭션이라 now()와 사실상 동일)를 쓴다. growth_story는 재제작(UPDATE)
-- 시 NEW.updated_at을 못 믿는다 — 채널 쪽 upsert 쿼리가 그 컬럼을 실제로
-- 갱신하는지 이 저장소에서 확인할 방법이 없어서(채널 저장소는 안 건드림
-- 원칙상 그 코드를 열어보지 않음), 트리거 자신이 발화하는 시점의 now()를
-- 직접 쓴다 — 채널 스크립트가 무엇을 하든 항상 정확하다.
create or replace function public.sync_production_item_from_report()
returns trigger
language plpgsql
as $$
begin
  if NEW.episode_folder ~ '^report_' then
    return NEW;
  end if;

  insert into public.production_items (country, content_type, symbol, stock_name, target_date, assembled_date, title, status, report_id)
  values (NEW.country, 'report', NEW.symbol, NEW.stock_name, NEW.report_date, (NEW.created_at at time zone 'Asia/Seoul')::date, NEW.title, '조립됨', NEW.id)
  on conflict (report_id) where report_id is not null do update set
    title = excluded.title,
    status = '조립됨',
    updated_at = now();

  return NEW;
end;
$$;

create or replace function public.sync_production_item_from_growth_story()
returns trigger
language plpgsql
as $$
begin
  insert into public.production_items (country, content_type, symbol, stock_name, target_date, assembled_date, status, growth_story_id)
  values (NEW.country, 'growth_story', NEW.symbol, NEW.stock_name, NEW.source_date, (now() at time zone 'Asia/Seoul')::date, '조립됨', NEW.id)
  on conflict (growth_story_id) where growth_story_id is not null do update set
    status = '조립됨',
    uploaded_at = null,
    assembled_date = (now() at time zone 'Asia/Seoul')::date,
    updated_at = now();

  return NEW;
end;
$$;
