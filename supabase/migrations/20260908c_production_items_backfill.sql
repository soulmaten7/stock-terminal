-- 20260908c_production_items_backfill.sql
-- 트리거(20260908b)는 앞으로의 INSERT/UPDATE에만 반응한다 — 이미 있던
-- channel_reports/channel_growth_stories 기존 행은 소급 적용되지 않으므로
-- 한 번 수동으로 채운다. 트리거 함수와 완전히 같은 upsert 로직 — 몇 번을
-- 다시 돌려도 안전(idempotent).
insert into public.production_items (country, content_type, symbol, stock_name, target_date, title, status, report_id)
select country, 'report', symbol, stock_name, report_date, title, '조립됨', id
from public.channel_reports
where episode_folder !~ '^report_'
on conflict (report_id) where report_id is not null do update set
  title = excluded.title,
  updated_at = now();

insert into public.production_items (country, content_type, symbol, stock_name, target_date, status, growth_story_id)
select country, 'growth_story', symbol, stock_name, source_date, '조립됨', id
from public.channel_growth_stories
on conflict (growth_story_id) where growth_story_id is not null do update set
  updated_at = now();
