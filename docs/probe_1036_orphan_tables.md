# probe 1036 — public 스키마 역방향 전수 점검 (본체 코드 참조 0곳 찾기 + 그 반대)

> **한 줄 요약**: 리딩방 DB 정리 세 라운드(§13개 테이블·`lib/nts.ts`·`link_previews`)에서 이름 패턴 기반 검색이 연속으로 누락을 냈다. 이번엔 반대로 갔다 — **`public` 스키마의 오브젝트 80개(테이블 79 + 뷰 1) 전체를 먼저 나열하고, 각각을 본체 코드(`app`·`lib`·`components`·`scripts`·`supabase`)에서 grep했다.** 결과: **본체 참조 0곳인 오브젝트는 `ai_view_cache` 1개뿐**이며, 이건 리딩방과 무관한 별개의 죽은 기능(과거 "AI 종합 보기" 버튼)이다. **판정하지 않는다 — 삭제 여부는 이 문서의 범위 밖.** 그 반대 방향(코드가 `.from(...)`으로 참조하는데 DB엔 없는 것)도 확인했다 — **불일치 0건**, 유일한 예외는 Postgres 테이블이 아니라 **Storage 버킷** `"sources"`(`scripts/ingest_damodaran.ts:163`·`scripts/upload_sources_storage.ts:35`)였다.

## 왜 방향을 바꿨나

패턴 기반 검색(`advisor|room|leading|business_claim|member|listing|link` 같은 정규식)은 "이름에 그 단어가 들어간 것"만 잡는다. 이번 리딩방 정리에서 그 방식이 세 번 놓쳤다:

1. `components/business/BusinessHub.tsx`·`BusinessClaimClient.tsx`(파일명에 room/advisor 없음, STEP1035 §1-1에서 누락 → 사후 발견)
2. `lib/nts.ts`(국세청 진위확인 — "nts"가 검색어 어디에도 없어 STEP1035·DB 정리 두 라운드 모두 놓침)
3. `link_previews`(이름에 "link"는 있지만 검색어 패턴이 `business_link*`만 매칭하고 `link_previews`는 안 걸림)

세 번 다 **"이름에 특정 단어가 있는가"로 찾다가, 단어가 없는 걸 놓쳤다.** 그래서 이번엔 **이름을 안 보고 전부 나열한 뒤, 하나하나 본체 코드에서 실제로 쓰이는지** 확인했다 — 방향을 뒤집은 것.

## 방법

1. **전체 나열**: `pg_catalog.pg_class` + `pg_namespace`로 `public` 스키마의 테이블(`relkind='r'`)·뷰(`relkind='v'`) 전부 조회. 행 수는 `query_to_xml`로 각 테이블을 실측(추정 아님).
2. **역방향 grep**: 나열된 각 이름을 `app/`·`components/`·`lib/`·`scripts/`·`stores/`·`types/`·`supabase/`(전부 `spinoff/` 제외 — spinoff는 의도적으로 분리 보관된 코드라 "본체 참조"에 포함시키면 안 됨) 전체에 대해 `grep -rl`로 매칭되는 **파일 수**를 셌다. 패턴은 단어 경계(`\b이름\b`)로 부분 문자열 오탐(예: `us_stock_perf`가 `stocks`의 부분집합처럼 걸리는 것)을 막았다.
3. **0건 재확인**: grep으로 0건이 나온 항목은 카멜케이스·파스칼케이스 변형까지 별도로 다시 검색해 정말 0건인지 재확인했다(§1의 반성대로 — 한 패턴만 믿지 않는다).

## 전체 인벤토리 (80개 오브젝트)

| 이름 | 종류 | 행 수 | 본체 참조 파일 수 |
|---|---|---|---|
| `ad_inquiries` | 테이블 | 0 | 3 |
| `ai_analysis` | 테이블 | 0 | 1 |
| `ai_view_cache` | 테이블 | 0 | **0** |
| `banned_words` | 테이블 | 0 | 1 |
| `brokers` | 테이블 | 75 | 5 |
| `cn_names` | 테이블 | 7,095 | 4 |
| `cn_stock_perf` | 테이블 | 7,079 | 7 |
| `cron_heartbeats` | 테이블 | 6 | 5 |
| `daily_brief` | 테이블 | 40 | 8 |
| `damodaran_beta` | 테이블 | 94 | 25 |
| `damodaran_capex` | 테이블 | 94 | 3 |
| `damodaran_country_tax` | 테이블 | 229 | 28 |
| `damodaran_credit_spread` | 테이블 | 7 | 25 |
| `damodaran_global_inputs` | 테이블 | 2 | 40 |
| `damodaran_industry` | 테이블 | 48,144 | 26 |
| `damodaran_tax_rate` | 테이블 | 96 | 6 |
| `damodaran_wacc` | 테이블 | 94 | 4 |
| `damodaran_working_capital` | 테이블 | 94 | 3 |
| `dart_corp_codes` | 테이블 | 3,922 | 5 |
| `disclosures` | 테이블 | 0 | 8 |
| `discussion_comments` | 테이블 | 0 | 2 |
| `discussion_likes` | 테이블 | 0 | 3 |
| `discussion_reports` | 테이블 | 0 | 1 |
| `discussions` | 테이블 | 0 | 5 |
| `dividends` | 테이블 | 60 | 5 |
| `email_subscriptions` | 테이블 | 1 | 4 |
| `feedback` | 테이블 | 0 | 5 |
| `filing_summaries` | 테이블 | 1,545 | 11 |
| `financials` | 테이블 | 0 | 15 |
| `gb_names` | 테이블 | 349 | 3 |
| `gb_stock_perf` | 테이블 | 349 | 5 |
| `insider_trades` | 테이블 | 0 | 1 |
| `jp_disclosures` | 테이블 | 13,600 | 4 |
| `jp_names` | 테이블 | 4,014 | 4 |
| `jp_stock_perf` | 테이블 | 4,256 | 6 |
| `kr_etp_snapshot` | 테이블 | 1,550 | 7 |
| `kr_stock_snapshot` | 테이블 | 2,776 | 26 |
| `lens_cuts` | 테이블 | 10 | 20 |
| `lens_scores` | 테이블 | 2,017 | 48 |
| `lens_state_changes` | 테이블 | 5,080 | 6 |
| `link_hub` | 테이블 | 492 | 11 |
| `link_hub_clicks` | 테이블 | 1 | 4 |
| `link_hub_favorites` | 테이블 | 0 | 4 |
| `macro_indicators` | 테이블 | 0 | 1 |
| `news` | 테이블 | 0 | 19 |
| `news_briefs` | 테이블 | 1,811 | 4 |
| `platform_discussion_likes` | 테이블 | 0 | 3 |
| `platform_discussion_reports` | 테이블 | 0 | 1 |
| `platform_discussions` | 테이블 | 0 | 5 |
| `products` | 테이블 | 10 | 3 |
| `quant_factors` | 테이블 | 0 | 2 |
| `revdcf_results` | 테이블 | 8,456 | 61 |
| `sector_cuts` | 테이블 | 78 | 6 |
| `short_credit` | 테이블 | 0 | 1 |
| `stock_briefings` | 테이블 | 3,036 | 4 |
| `stock_prices` | 테이블 | 0 | 2 |
| `stocks` | 테이블 | 27 | 17 |
| `supply_demand` | 테이블 | 0 | 1 |
| `translation_cache` | 테이블 | 446 | 2 |
| `us_cik_map` | 테이블 | 10,432 | 19 |
| `us_coverage_history` | 테이블 | 1 | 2 |
| `us_fundamentals` | 테이블 | 5,820 | 32 |
| `us_fundamentals_snapshot` | 테이블 | 5,755 | 6 |
| `us_market_cap` | 테이블 | 5,914 | 57 |
| `us_market_cap_nasdaq` | 테이블 | 0 | 2 |
| `us_sector_gics` | 테이블 | 503 | 10 |
| `us_sector_nasdaq` | 테이블 | 7,127 | 9 |
| `us_sector_relative` | 테이블 | 7,541 | 20 |
| `us_sector_relative_snapshot` | 테이블 | 2,294 | 1 |
| `us_sector_resolved` | 테이블 | 1,021 | 12 |
| `us_sector_wide` | 테이블 | 5,820 | 24 |
| `us_sector_wide_snapshot` | 테이블 | 1,127 | 2 |
| `us_sector_yahoo` | 테이블 | 1,021 | 9 |
| `us_stock_perf` | 테이블 | 6,388 | 24 |
| `us_valuation` | 테이블 | 26,741 | 33 |
| `users` | 테이블 | 2 | 18 |
| `vn_names` | 테이블 | 387 | 3 |
| `vn_stock_perf` | 테이블 | 402 | 7 |
| `watchlist` | 테이블 | 0 | 24 |
| `youtube_channels` | 테이블 | 100 | 1 |
| `stock_snapshot_v` | 뷰 | — | 2 |

🔴 이 표에서 리딩방 관련 오브젝트(fss_advisors·room_*·leading_*·business_claims/members/listing/links·advisor_directory·link_previews)는 **이미 전부 DROP돼 있어서 애초에 목록에 없다** — 이 조회 자체가 그 DROP이 완료됐다는 것의 재확인이기도 하다.

## 본체 참조 0곳 — 상세 (판정 없음, 추정 용도 + 행수만)

| 오브젝트 | 행 수 | 추정 용도 | 비고 |
|---|---|---|---|
| `ai_view_cache` | 0 | AI 생성 콘텐츠 캐시로 보인다. `docs/STEP_511_COMMAND.md`(STEP511, "Cowork이 이미 완료" 기록)에 `ai_view_cache` 테이블 + `app/api/ai-view/route.ts`(Anthropic Haiku) + 렌즈 페이지 "AI 종합 보기" 버튼이 한 세트로 언급돼 있다. | 🔴 **그 라우트(`app/api/ai-view/route.ts`)가 지금 저장소에 없다**(`find app -path "*ai-view*"` 0건) — 즉 라우트가 먼저 사라지고 테이블만 남은 상태로 보인다. **리딩방과 무관한 별개의 죽은 기능**이다. 삭제·존치 여부는 이 문서에서 판정하지 않는다. |

**다른 낮은 참조(1건) 오브젝트들은 0건이 아니므로 이 절에 포함하지 않았다** — 예: `ai_analysis`(1)·`discussion_reports`(1)·`insider_trades`(1)·`macro_indicators`(1)·`short_credit`(1)·`supply_demand`(1)·`youtube_channels`(1)·`us_sector_relative_snapshot`(1)·`us_coverage_history`(1)·`banned_words`(1)·`email_subscriptions`(1)·`link_hub_clicks`(1). 이들은 지시된 조건("참조 0곳")에 해당하지 않아 목록에서 뺐다 — 참조가 적다고 자동으로 문제인 건 아니라는 지시를 그대로 따른 것이다.

## 부가 확인 — `public` 스키마 함수(테이블·뷰는 아니지만 같은 조사 중 확인)

이번 조사 범위는 테이블·뷰였지만, 리딩방 DB 정리에서 함수(`increment_room_view` 등)도 놓쳤던 전례가 있어 `pg_proc`도 곁다리로 확인했다. 남은 함수 9개: `handle_new_user`(회원가입 트리거로 추정)·`lens_distribution`·`lens_percentiles`(렌즈 RPC)·`update_discussion_comment_count`·`update_discussion_like_count`·`update_discussion_report_count`(`discussions` 계열 트리거)·`update_platform_discussion_like_count`·`update_platform_discussion_report_count`·`update_target_discussion_count`(`platform_discussions` 계열 트리거 — `leading_rooms` 참조 분기가 있었다는 사실은 `schema.sql` 하단에 이미 기록돼 있다). **새로 발견된 리딩방 관련 함수는 없다.**

## 역방향의 반대 — 고아 참조 검사 (코드 → DB, 존재하지 않는 테이블을 쿼리하는지)

위 절은 "DB에 있는데 코드가 안 쓰는 것"을 찾았다. 이 절은 **정반대** — "코드가 쓰겠다고 하는데 DB에 없는 것"을 찾는다. DROP은 되돌릴 수 없고, **DB 테이블 참조는 문자열이라 `tsc`가 못 잡는다** — 코드에 `.from("드롭된테이블")`이 남아 있어도 컴파일은 통과하고 **런타임에서야** 에러가 난다. 그래서 DROP 라운드가 끝날 때마다 이 대조를 한다.

**방법**: `app/`·`components/`·`lib/`·`scripts/`·`stores/`·`types/`(`spinoff/` 제외) 전체에서 `.from("이름")`·`.from('이름')` 패턴을 정규식으로 추출 → 따옴표 안 이름만 뽑아 중복 제거 → `docs/probe_1036_orphan_tables.md` 위 절의 살아있는 DB 오브젝트 목록(80개)과 `comm -23`으로 대조(코드엔 있는데 DB엔 없는 것만 추출).

**결과**: 코드에서 `.from(...)`으로 참조되는 고유 이름 **57개**(`app`·`lib`·`components`·`scripts`·`stores`·`types` 전체 기준, 직접 재추출·재확인). 그중 **56개는 전부 살아있는 DB 테이블/뷰와 정확히 일치**(불일치 0건) — 리딩방 관련 이름은 당연히 하나도 없다(이미 전부 DROP됐으므로 코드에도 안 남아 있어야 정상이고, 실제로 그랬다).

**나머지 1개 — `"sources"`**: DB 테이블이 아니라 **Supabase Storage 버킷 이름**이었다. 정확히 2곳에서 호출:

| 파일:줄 | 호출부 |
|---|---|
| `scripts/ingest_damodaran.ts:163` | `sb.storage.from("sources").upload(...)` |
| `scripts/upload_sources_storage.ts:35` | `sb.storage.from("sources").upload(...)` |

둘 다 `.storage.from(...)`(Storage 버킷 API)이지 `.from(...)`(Postgres 테이블 쿼리) 단독 호출이 아니다 — `.storage.` 프리픽스가 있으면 완전히 다른 API를 가리킨다. `"sources"`라는 이름의 Postgres 테이블은 어디에도 없고(DB에 없는 게 정상 — 원래부터 테이블이 아니었다), 이 두 줄이 유일한 호출처라는 것도 재확인했다(`grep -rn '\.from(["'"'"']sources["'"'"']'` = 정확히 2건).

🔴 **참고**: 이 문서 본문 인용 요청에서 "49개"로 언급됐으나, 직접 재추출한 결과는 **57개(그중 56개가 진짜 테이블/뷰 참조, 1개가 버킷)**였다. 어떤 검색 범위·중복제거 방식으로 49가 나왔는지는 재현하지 못했다 — **여기 적은 56/57/1은 이번에 직접 돌린 grep의 실측치**이고, 핵심 결론(불일치 0건·`sources`가 유일한 오탐이고 그 위치가 두 스크립트의 Storage 호출)은 원래 지시받은 내용과 정확히 일치한다.

🔑 **교훈**
1. **DB 테이블 참조는 문자열이라 `tsc`가 못 잡는다 — DROP 라운드마다 이 대조(코드→DB 역방향)를 반드시 한다.** 컴파일이 통과해도 쿼리는 런타임에만 실패한다.
2. **`.from(` 패턴은 DB 쿼리와 Storage 호출을 구분하지 못한다 — 결과를 그대로 믿지 말고 개별 확인이 필요하다.** `.storage.from(...)`과 `.from(...)`을 정규식만으로는 못 가른다(둘 다 `.from("문자열")` 모양이 같다) — 이번처럼 DB 테이블 목록과 대조해 "없는 것"이 나오면, 그게 진짜 삭제된 테이블 참조(버그)인지 애초에 테이블이 아니었는지(Storage 버킷 등) **하나하나 열어서 확인**해야 한다.

## 3중 규칙 마감

- **못 한 축**: 없음 — 지시된 범위(테이블·뷰 전체, 본체 코드 grep, 코드→DB 역방향 대조)는 전부 수행.
- **철회·정정**: "49개" 인용을 그대로 옮기지 않고 직접 재추출해 57개(56 테이블/뷰 참조 + 1 버킷)로 정정 기록 — 핵심 결론(불일치 0건·오탐 위치 2곳)은 일치.
- **미측정**: `ai_view_cache`를 실제로 삭제할지, `app/api/ai-view/route.ts`가 언제·왜 사라졌는지(git log 추적 안 함 — 이 문서 범위 밖으로 판단), 참조 1건짜리 12개 오브젝트들의 그 1건이 실제로 살아있는 코드인지(예: 주석 안 문자열일 수도 있음 — 확인 안 함, "0건" 기준만 충족 확인), "49개" 카운트가 어떤 검색 범위·방식에서 나왔는지(재현 안 됨).
