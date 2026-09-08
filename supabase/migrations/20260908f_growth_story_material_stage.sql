-- 20260908f_growth_story_material_stage.sql
-- 성장스토리 1차 요약(재료 판정 시점, 영상 없음) vs 2차(영상 조립 완료) 구분.
--
-- 채널 쪽 권장안("episode_folder를 nullable로, 1차는 NULL") 채택 — 검토 결과
-- 맞는 방향이다: Postgres UNIQUE INDEX는 NULL을 서로 다른 값으로 취급해
-- 여러 행이 NULL을 동시에 가져도 유니크 제약을 위반하지 않는다(표준 SQL
-- 동작, 별도 partial index 없이도 그대로 유지됨). 지금 채널이 쓰는
-- "(pending production — TICKER)" 같은 자리표시자 문자열보다 낫다 —
-- 문자열은 언젠가 이 정확한 패턴이 우연히 실제 폴더명과 겹칠 위험이
-- 있고("의미 있는 데이터"가 아니라 "값이 없다"는 사실 자체를 표현하는
-- 데는 NULL이 원래 있는 도구다), 화면 쪽 판정 로직도 "이 문자열로
-- 시작하는가" 같은 취약한 패턴 매칭 대신 "NULL인가"라는 명확한 질문
-- 하나로 끝난다.
alter table public.channel_growth_stories alter column episode_folder drop not null;

-- 이미 들어와 있는 자리표시자 문자열 행을 NULL로 정리(idempotent).
update public.channel_growth_stories
set episode_folder = null
where episode_folder ~ '^\(pending production';

-- production_items 쪽도 맞춰야 한다 — 지금은 INSERT되면 무조건 '조립됨'
-- 으로 표시해서, 재료만 확보되고 영상은 없는 종목이 "영상까지 다 됐다"
-- 는 잘못된 상태로 관리자 화면에 떴다(실측: INTC·AMZN·GOOGL 3건이
-- '조립됨'으로 잘못 표시돼 있었음). episode_folder가 NULL이면 '기획됨'
-- (재료 확보·영상 없음), NOT NULL이면 '조립됨'으로 나눈다 — 이걸로
-- §13-4-1이 "채널 저장소 연동 전까진 안 채워짐"이라 적어뒀던 '기획됨'
-- 상태가 이번에 실제로 채워지기 시작한다(2026-09-07 그 문서의 전제가
-- 갱신됨).
create or replace function public.sync_production_item_from_growth_story()
returns trigger
language plpgsql
as $$
declare
  v_status text;
begin
  v_status := case when NEW.episode_folder is null then '기획됨' else '조립됨' end;

  insert into public.production_items (country, content_type, symbol, stock_name, target_date, assembled_date, title, status, growth_story_id)
  values (NEW.country, 'growth_story', NEW.symbol, NEW.stock_name, NEW.source_date, (now() at time zone 'Asia/Seoul')::date, coalesce(NEW.title, NEW.intro), v_status, NEW.id)
  on conflict (growth_story_id) where growth_story_id is not null do update set
    title = excluded.title,
    status = v_status,
    uploaded_at = case when v_status = '조립됨' then production_items.uploaded_at else null end,
    assembled_date = (now() at time zone 'Asia/Seoul')::date,
    updated_at = now();

  return NEW;
end;
$$;

-- 소급 정정 — 이미 만들어진 3건(INTC·AMZN·GOOGL)을 '기획됨'으로 되돌린다.
update public.production_items pi
set status = '기획됨', uploaded_at = null, updated_at = now()
from public.channel_growth_stories cgs
where pi.growth_story_id = cgs.id and cgs.episode_folder is null and pi.status <> '기획됨';
