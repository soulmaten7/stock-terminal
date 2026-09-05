-- ORDER 트릴리언보안정리_0905: 20260712_enable_rls_public_data_tables.sql에서 RLS는 켰지만
-- 기존 기본 GRANT(anon/authenticated에 INSERT/UPDATE/DELETE/TRUNCATE 포함)를 REVOKE하지 않아
-- anon 키(공개 저장소라 사실상 공개값)로 TRUNCATE가 가능했던 구멍을 막는다. RLS 정책은
-- TRUNCATE를 통제하지 못하므로(Postgres 설계) GRANT 자체를 좁혀야 한다.
-- rls-grants-audit 포크의 Part A 실측(role_table_grants)·Part B(사용처, 전부 서비스롤/본인스코드
-- 확인) 기반. link_hub_clicks의 열린 INSERT 정책은 클릭카운터 설계 의도라 이번 범위 제외(별도 판단).

-- 그룹 1: SELECT(true) 정책만 있는 공개 읽기 테이블 (16개) — SELECT만 재부여
revoke all on public.cn_names            from anon, authenticated;
revoke all on public.cn_stock_perf       from anon, authenticated;
revoke all on public.dart_corp_codes     from anon, authenticated;
revoke all on public.filing_summaries    from anon, authenticated;
revoke all on public.gb_names            from anon, authenticated;
revoke all on public.gb_stock_perf       from anon, authenticated;
revoke all on public.jp_disclosures      from anon, authenticated;
revoke all on public.jp_names            from anon, authenticated;
revoke all on public.lens_scores         from anon, authenticated;
revoke all on public.link_hub            from anon, authenticated;
revoke all on public.news_briefs         from anon, authenticated;
revoke all on public.stock_briefings     from anon, authenticated;
revoke all on public.us_stock_perf       from anon, authenticated;
revoke all on public.vn_names            from anon, authenticated;
revoke all on public.vn_stock_perf       from anon, authenticated;
revoke all on public.youtube_channels    from anon, authenticated;

grant select on public.cn_names          to anon, authenticated;
grant select on public.cn_stock_perf     to anon, authenticated;
grant select on public.dart_corp_codes   to anon, authenticated;
grant select on public.filing_summaries  to anon, authenticated;
grant select on public.gb_names          to anon, authenticated;
grant select on public.gb_stock_perf     to anon, authenticated;
grant select on public.jp_disclosures    to anon, authenticated;
grant select on public.jp_names          to anon, authenticated;
grant select on public.lens_scores       to anon, authenticated;
grant select on public.link_hub          to anon, authenticated;
grant select on public.news_briefs       to anon, authenticated;
grant select on public.stock_briefings   to anon, authenticated;
grant select on public.us_stock_perf     to anon, authenticated;
grant select on public.vn_names          to anon, authenticated;
grant select on public.vn_stock_perf     to anon, authenticated;
grant select on public.youtube_channels  to anon, authenticated;

-- 그룹 2: 정책 0개, anon 실사용처 없음(admin client 전용 확인) — 완전 회수, 재부여 없음 (4개)
revoke all on public.ad_inquiries       from anon, authenticated;
revoke all on public.daily_brief        from anon, authenticated;
revoke all on public.kr_etp_snapshot    from anon, authenticated;
revoke all on public.lens_state_changes from anon, authenticated;

-- 그룹 3: 본인 스코프 쓰기 정책이 있는 테이블 — REVOKE ALL 후 실제 쓰는 권한만 재부여 (9개 + users)
revoke all on public.discussion_comments        from anon, authenticated;
grant select, insert, delete on public.discussion_comments to anon, authenticated;

revoke all on public.discussion_likes           from anon, authenticated;
grant select, insert, delete on public.discussion_likes to anon, authenticated;

revoke all on public.discussions                from anon, authenticated;
grant select, insert on public.discussions      to anon, authenticated;

revoke all on public.platform_discussion_likes  from anon, authenticated;
grant select, insert, delete on public.platform_discussion_likes to anon, authenticated;

revoke all on public.platform_discussions       from anon, authenticated;
grant select, insert on public.platform_discussions to anon, authenticated;

revoke all on public.email_subscriptions        from anon, authenticated;
grant select, insert, update on public.email_subscriptions to anon, authenticated;

revoke all on public.link_hub_favorites         from anon, authenticated;
grant select, insert, update, delete on public.link_hub_favorites to anon, authenticated;

revoke all on public.watchlist                  from anon, authenticated;
grant select, insert, update, delete on public.watchlist to anon, authenticated;

-- link_hub_clicks: TRUNCATE/UPDATE/DELETE 잔여 grant만 회수. INSERT는 정책이 with_check:true라
-- 그대로 열려있음(클릭카운터 설계 의도, 이번 범위 아님) — SELECT/INSERT만 재부여.
revoke all on public.link_hub_clicks            from anon, authenticated;
grant select, insert on public.link_hub_clicks  to anon, authenticated;

-- users: SELECT(true) 정책은 별도 마이그레이션(20260905_restrict_users_select_policy.sql)에서
-- 이미 제거. 여기서는 TRUNCATE 등 잔여 grant만 회수하고 실제 쓰는 select/insert/update만 재부여.
revoke all on public.users                      from anon, authenticated;
grant select, insert, update on public.users    to anon, authenticated;
