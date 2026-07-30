-- STEP 831 §10-③: 렌즈 분포 요약(시장 전체). p30/p70 = lens_cuts(판정 컷 단일 소스) · min/median/max/n = lens_scores.
-- DB에서 집계(상수 금지·행 전송 없음). 시장별. 표본 N·기준일 함께. 5개 분포 렌즈 공용(확장).
-- (2026-07-30 MCP apply_migration으로 라이브 적용 완료 — 이 파일은 리포 기록/재현용.)
create or replace function lens_distribution(p_market text, p_lens text)
returns table(mn numeric, p30 numeric, med numeric, p70 numeric, mx numeric, n bigint, as_of date)
language sql stable as $$
  with vals as (
    select (case p_lens
      when 'quality' then quality_value
      when 'momentum' then momentum_value
      when 'lowvol' then lowvol_value
      when 'valuation' then valuation_value
      when 'assetgrowth' then assetgrowth_value
      else null end)::numeric as v
    from lens_scores where market = p_market
  )
  select
    min(v),
    (select lo from lens_cuts where market = p_market and lens_key = p_lens),
    percentile_cont(0.5) within group (order by v),
    (select hi from lens_cuts where market = p_market and lens_key = p_lens),
    max(v),
    count(v),
    (select as_of from lens_cuts where market = p_market and lens_key = p_lens)
  from vals where v is not null;
$$;
grant execute on function lens_distribution(text, text) to anon, authenticated, service_role;
