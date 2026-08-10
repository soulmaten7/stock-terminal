-- STEP 973 — us_sector_relative가 어느 시점의 us_sector_wide를 참조해 백분위를 냈는지 기록.
-- us_sector_wide는 크론이 매일 만드는 표가 아니라(952·955 스크립트 1회 적재) "최신 as_of"를 그대로 쓰기로
-- 바꿨다(app/api/cron/revdcf/route.ts computeAndSaveSectorRelative). sector_as_of가 없으면
-- "얼마나 오래된 섹터를 썼는지"를 나중에 알 방법이 없다.
alter table public.us_sector_relative
  add column if not exists sector_as_of date;
