-- 029_lens_percentiles.sql
-- 2026-07-05 · 렌즈 팩터 상대순위(퍼센타일) 계산 DB 함수.
-- lens_scores(US 시총 상위 1000) 대비 심볼의 팩터 순위(0~100·높을수록 우호 방향)를 방향별로 산출.
--   모멘텀·퀄리티 = 값 높을수록 우호 → 값 <= 기준의 비율
--   저변동·밸류(PER)·자산성장 = 값 낮을수록 우호 → 값 >= 기준의 비율
-- /api/lens 라우트가 호출해 카드에 "상위 N%" 표시. 심볼이 유니버스에 없으면 전부 null(비US·소형주 → 방향만).
-- ⚠️ Trillion DB(ref ccbwxcszdoyjxvckedfp)에 MCP(apply_migration)로 적용. 본 파일은 repo 아카이브/재현용.

create or replace function public.lens_percentiles(p_symbol text)
returns table(
  momentum_pctl int,
  quality_pctl int,
  lowvol_pctl int,
  value_pctl int,
  assetgrowth_pctl int
)
language sql stable as $$
  with n as (select * from public.lens_scores where symbol = p_symbol)
  select
    case when (select momentum_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where momentum_value <= (select momentum_value from n))
        / nullif((select count(*) from public.lens_scores where momentum_value is not null),0))::int end,
    case when (select quality_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where quality_value <= (select quality_value from n))
        / nullif((select count(*) from public.lens_scores where quality_value is not null),0))::int end,
    case when (select lowvol_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where lowvol_value >= (select lowvol_value from n))
        / nullif((select count(*) from public.lens_scores where lowvol_value is not null),0))::int end,
    case when (select valuation_value from n) is null or (select valuation_value from n) <= 0 then null else
      round(100.0*(select count(*) from public.lens_scores where valuation_value >= (select valuation_value from n) and valuation_value > 0)
        / nullif((select count(*) from public.lens_scores where valuation_value is not null and valuation_value > 0),0))::int end,
    case when (select assetgrowth_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where assetgrowth_value >= (select assetgrowth_value from n))
        / nullif((select count(*) from public.lens_scores where assetgrowth_value is not null),0))::int end
$$;
