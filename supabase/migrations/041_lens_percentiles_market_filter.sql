-- 041_lens_percentiles_market_filter.sql
-- lens_percentiles를 시장별로 격리 — KR 추가 시 US 백분위 오염 방지. (Cowork MCP 라이브 적용)
create or replace function public.lens_percentiles(p_symbol text)
returns table( momentum_pctl int, quality_pctl int, lowvol_pctl int, value_pctl int, assetgrowth_pctl int )
language sql stable as $$
  with n as (select * from public.lens_scores where symbol = p_symbol)
  select
    case when (select momentum_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and momentum_value <= (select momentum_value from n))
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and momentum_value is not null),0))::int end,
    case when (select quality_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and quality_value <= (select quality_value from n))
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and quality_value is not null),0))::int end,
    case when (select lowvol_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and lowvol_value >= (select lowvol_value from n))
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and lowvol_value is not null),0))::int end,
    case when (select valuation_value from n) is null or (select valuation_value from n) <= 0 then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and valuation_value >= (select valuation_value from n) and valuation_value > 0)
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and valuation_value is not null and valuation_value > 0),0))::int end,
    case when (select assetgrowth_value from n) is null then null else
      round(100.0*(select count(*) from public.lens_scores where market = (select market from n) and assetgrowth_value >= (select assetgrowth_value from n))
        / nullif((select count(*) from public.lens_scores where market = (select market from n) and assetgrowth_value is not null),0))::int end
$$;
