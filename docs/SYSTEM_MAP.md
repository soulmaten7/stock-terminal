<!-- 2026-07-28 · 2026-09-05 크론/테이블/핵심파일맵 최소 갱신 -->
# 🗺️ Trillion(트릴리언) — SYSTEM MAP (아키텍처·파이프라인 지도)

> **아키텍처가 바뀔 때만 수정**(세션마다 아님). 현재상태=`STATE.md` · 이력=`CHANGELOG.md`.
> 이 지도는 **라이브 시스템 실측**(vercel.json 크론·Supabase 테이블·`data/*` 시드·`.env.local` 변수)으로 작성 — 낡은 문서 아님. (2026-07-28 갱신 — 799~806: 활성시장 KR+US 게이트·`lens_cuts` 분포 유도 컷·2-pass 크론·`locale_choice` 쿠키·크론 9→8[jp-disclosures 중지] 반영. 이전 793~798: PageShell·rateLimit·공시 3상태·cron_heartbeats.)
>
> 🔴 **2026-09-05 방향 전환 이후 상태 — §4 크론·§5 테이블·§9 핵심파일맵만 최소 갱신했다.** 아래 본문(§3의 렌즈 선계산·§5의 역DCF 등)은 여전히 **모델 트랙이 살아있던 시점의 서술**이며, 그 크론·화면은 지금 전부 정지·삭제됐다(근거·현재 상태 = `docs/STATE.md` ⓪). 이 문서 전체를 다시 쓰는 일은 아직 안 했다 — 다음에 손댈 때 전면 갱신 필요.

## 1. 스택
- **Next.js 16 App Router**(Turbopack · dev 포트 3333) · **Tailwind v4**(`@theme` in `app/globals.css`) · **Zustand**(`countryStore`·`authStore`) · **next-intl**(`[locale]` · ko 무프리픽스 · en=`/en` · `as-needed` · `localeCookie:false`).
  - **로케일 지속 = `locale_choice` 쿠키**(STEP 806 §5 · 명시 선택[Header.switchLocale]만 심음·URL 방문으론 안 바뀜). proxy가 이 키만 읽어 프리픽스 없는 요청을 `/en`으로. **레거시 `NEXT_LOCALE`은 읽지 않고 삭제**(800 이전 next-intl이 URL마다 덮어써 en으로 굳던 잔류 쿠키 무력화). OAuth 왕복용 `post_login_locale`(795·10분)은 별개.
- **Supabase** `@supabase/ssr` — server/browser client + admin client(SERVICE_ROLE · RLS 우회). 마이그레이션 = Cowork가 MCP로 적용, Claude Code가 `.sql` 아카이브.
- **Vercel** 배포 · 크론(§4) · Analytics · Sentry(@sentry/nextjs v10).

## 2. ⚠️ DB 프로젝트 (footgun 주의)
- **정답 = "Trillion" `ccbwxcszdoyjxvckedfp`** (ap-northeast-2). 앱 런타임 `NEXT_PUBLIC_SUPABASE_URL` = 이거 ✅(라이브 실측). 마이그레이션·MCP도 전부 이 ref.
- ⛔ **금지 ref**: POTAL `zyurflkhiregundhisky` · 구 "OT-Marketing" `qxkmwlkchyxfzxbonhtj`.
- 🐞 **잔존 footgun(2026-07-17 발견 · 정리 대상)**:
  - `supabase/.temp/linked-project.json` = **CLI가 OT-Marketing(`qxkmwlkchyxfzxbonhtj`)에 링크됨** → **`supabase db push` 등 CLI DB 명령 절대 금지**(옛 프로젝트 침). 쓰려면 `ccbwxcszdoyjxvckedfp`로 재링크 먼저.
  - `.env.local`의 `DATABASE_URL` = 옛 ref(앱 코드 미사용 = 무해하나 정리 권장).
  - docs 13개에 옛 ref 잔존(통합·아카이브로 정리 중).

## 3. 🌍 6개국 데이터 파이프라인 (핵심 — 유니버스 자동 vs 시드)
| 국가 | 유니버스 소스 | 자동/시드 | 가격 파이프라인 | 크론(UTC) | 종목명 |
|------|--------------|-----------|-----------------|-----------|--------|
| 🇰🇷 KR | **KRX 전종목 일일피드**(`stk_bydd_trd`·`ksq_bydd_trd`) | **자동**(신규상장 다음날 편입) | `lib/krSnapshot.ts`(전시장 1콜) → `kr_stock_snapshot`(2,772) | `kr-perf` 10:00 · `kr-etp` 10:15 · `kr-lens-scores` 10:30 | 한글(KRX) **+ `name_en`**(야후 백필 2766/2772 · **자동채움 ✅** `kr-perf` 크론이 null만 증분·STEP 746) |
| 🇺🇸 US | `data/us_symbols.json`(주식 5,964+ETF 815) | **매일 자동 재생성**(Nasdaq Trader 심볼 디렉토리 → GitHub Action `refresh-us-symbols` 매일 09:00 UTC 자동 커밋 → 22:00 us-perf가 시세 채움 = **신규 상장 익일 편입·KR 동급**·STEP 754/754b/755·주식만·ETF 큐레이션 보존) | `lib/usPerf.ts`(종목별 야후·**하드닝**: 콜별 5s 타임아웃+신선도역순+예산 260s·755) → `us_stock_perf` | `us-perf` 22:00 · `lens-scores` 21:30(US 렌즈·STEP 829 §9: 20:00→21:30, EST 종가 21:00 UTC 뒤라 장중가 방지) | 영어(원본·SEC 실명·title-case) |
| 🇯🇵 JP | `data/jp_symbols.json`(4,268) | **시드** | `lib/jpPerf.ts` → `jp_stock_perf` | `jp-perf` 08:00 · `jp-disclosures` 16:00 | 일본어(`jp_names`) · **영문명 미완** |
| 🇨🇳 CN | `data/cn_symbols.json`(7,098) | **시드** | `lib/cnPerf.ts` → `cn_stock_perf` — HK=야후 · **A주=텐센트 ifzq kline 1차**(东方财富는 폴백 — Vercel IP 소프트차단·07-18) · 전체+신선도역순+예산 260s·콜별 5s 타임아웃(STEP 750b~752) | `cn-perf` 08:00 | 중국어(`cn_names`) · **영문명 미완**(시드 name은 영문·title-case만 필요 — §6c) |
| 🇻🇳 VN | `data/vn_symbols.json`(403 · HOSE+HNX) | **시드** | `lib/vnPerf.ts`(야후) → `vn_stock_perf` | `vn-perf` 08:00 | 베트남어(`vn_names`) · **영문명 미완** |
| 🇬🇧 GB | `data/gb_symbols.json`(349 · FTSE350) | **시드** | `lib/gbPerf.ts` → `gb_stock_perf` | `gb-perf` 08:00 | 영어(원본) |

- ⚠️ **프레시니스 격차(07-18 갱신)**: **KR·US = 유니버스 자동**(KR=KRX 일일피드·US=심볼 디렉토리 일일 Action). **JP·CN·VN·GB 시드는 정적** = 신규 상장 미편입 — US 패턴(스크립트+Action) 재사용으로 후속.
- 🛡️ **Perf 하드닝(750b~755 · 6개국 전부)**: 외부 콜별 5s 타임아웃(`withTimeout`) + 신선도 역순(오래된 것 먼저) + 시간 예산 260s — hang 소스가 하루를 통째 날리지 못하고, 부분 실패는 다음날 자연 만회. (KR은 KRX 전시장 1콜 구조라 해당 없음.)
- **🎯 활성 시장 게이트(STEP 799·806)**: `lib/activeMarkets.ts` — `ACTIVE_MARKETS=["KR","US"]` 단일 배열 + `isActiveSymbol(sym)`/`marketOfSymbol(sym)`. 검색 인덱스·관심등록·종목상세 페이지·사이트맵 + **`/api/lens`·`/api/brief`**(806 §6)가 전부 이걸 공유 → JP/CN/VN/GB 심볼은 온디맨드 계산·LLM 차단(400). 새 시장 개방 = 배열 한 줄. 복원 절차 `PARKED_FIELD_SURFACES.md §7`.
- **렌즈 선계산 + 분포 유도 판정 컷(STEP 802·805·806)**: `lens_scores`(실측 **KR 905 · US 998** · 값 컬럼 `*_value`/상태 `*_state`·렌즈별 non-null N 다름: KR 밸류 623[적자·우선주 제외] vs 모멘텀 883) — `kr-lens-scores`/`lens-scores` 크론. 밖의 종목은 live `/api/lens`(야후 계산·결정론·무료). **판정 컷 = `lens_cuts` 테이블**(시장별 값 분포 p30/p70). 5개 렌즈(모멘텀·저변동·밸류·퀄리티·자산성장)가 `lib/lensCuts.ts`(`loadCuts`·10분 TTL 캐시·`stateFromCut` dir 반영)로 이 컷을 읽어 verdict 산출 — **컷 없으면 state='pending'**(임의 상수 폴백 금지). RSI 30/70·F-Score 3/7만 고정 표준값. 라이브(`computeSymbolLenses` 자동 로드)=선계산(크론 주입) 동일 컷 → 판정 일치. 🔬 **깊이 표준 §10(STEP 831·퀄리티 첫 적용)**: `/api/lens`가 근거상세 4축 제공 — ①구성요소 분해·②시계열은 `compute()`(원자료), ③분포는 RPC **`lens_distribution(market,lens)`**(min/p30/중앙/p70/max·N·기준일·p30/p70=`lens_cuts` 동일 소스·시장 1h 캐시) 주입, ④판정이력은 미구현(`lens_cuts` 이력 없음·§10 참조). 🔴 **프루닝 가드(STEP 828 §2)**: 유니버스가 직전 `lens_scores` 행수의 70% 미만이면 붕괴로 보고 삭제 금지(성공률≥80%∧universeOk∧pass2Ok 3중 게이트). universe=0→`{ok:false}` 500. 🔴 **US 취득 완전성(STEP 833)**: `topByMarketCap` 3단(배치→개별 재시도 40s/400건→최근값 폴백 `us_market_cap` 7일)·배치 marketCap 결측을 조용히 안 버림(`classifyCaps`). **취득 게이트**(`capGateDecision`: fresh커버<97% ∨ 상위200 메가캡 fresh<95%)면 컷 재유도·프루닝 금지·전날 컷 유지·500. **정상화 diff 스킵**(`churnDecision`: churn>10%면 상태 재매핑하되 `lens_state_changes` 미기록). 🔴 **모집단 정의 = KR·US 모두 시총 상위 1,000(STEP 835·C안·문헌 정합)**: KR도 `topKrByMarketCap`(kr_stock_snapshot 시총순·우선주 제외·삼성전자우 미편입) + `computeKrLensScores`(커버리지 게이트 95%·구성 게이트 미적용[DB 벌크]·churn diff 스킵). `tradeAmountOf`는 유니버스 기준 아니어도 화면 정렬(lens_state_changes)용으로 계속 채움. (이전 KR=거래대금 상위는 문헌 밖+저변동 왜곡[판정 23.4% 뒤집힘]이라 834 측정 후 전환.)
  - **⚙️ 크론 2-pass(순환 의존 해소·`lib/lensPrecompute.ts`)**: 컷은 분포에서, 분포는 값에서, 판정은 컷에서 나오는 순환을 끊음 — **pass1**: 전 유니버스 값 계산 + '직전' 컷으로 상태·저장(cutValues 수집) → 분포 p30/p70로 **컷 재유도·`lens_cuts` upsert** → **pass2**(`pass2RemapAndDiff`): 저장 값에 새 컷 적용해 상태 재매핑(야후 재조회 0·DB 내 갱신) + 최종 상태로 `lens_state_changes` diff. 프루닝(유니버스 이탈 삭제)은 **저장 성공률 ≥80%일 때만**(부분 실행 대량삭제 방지·806 §3). 부트스트랩 = 기존 저장 값 분포서 SQL 즉시 산출.

## 4. 크론 (vercel.json · 🔴 2026-09-05 갱신 — 가동 5개, 아래 "가동(8)" 서술은 그 이전 시점)

🔴 **현재(2026-09-05) 실측 = 5개**: `us-perf` 22:00 · `kr-perf` 10:00 · `kr-etp` 10:15 · `health` 12:00 · `our-channels` 09:00(신규 — `our_channels` 테이블 갱신, `docs/STATE.md` ⓪ 참조). `npx vercel crons ls`로 확인.
🔴 **오늘 정지 5개**(스케줄만 vercel.json에서 제거·라우트/테이블/`lib/lensPrecompute.ts`·`lib/revdcf/*` 전부 보존): `kr-lens-scores`·`lens-scores`(렌즈 선계산 — 유일한 라이브 소비처였던 홈 "렌즈 변화" 섹션 제거로 정지) · `revdcf`·`daily-brief`·`email-brief`(더 이른 STEP — REVDCF_ENABLED/Q1_ENABLED OFF·이메일 브리핑 구독자 0명 실측 후 정지). `health` 크론 CHECKS·행수감시·`lens_cuts` 나이감시도 관련 항목 동반 제거(오탐 방지). 재개 조건·순서 = `docs/STATE.md` ⓪.

> 아래는 위 정지 이전(2026-07~08월) 시점 서술 — 정지된 크론의 **당시 스케줄·설계 근거** 기록으로 보존한다.

**(당시) 가동(8)**: `us-perf` 22:00 · `kr-perf` 10:00(+name_en null 증분·STEP 746) · `kr-etp` 10:15 · `kr-lens-scores` 10:30(2-pass·§3) · `lens-scores` 21:30(US 렌즈·2-pass) · **`health` 12:00(신선도+하트비트+신선행수+`lens_cuts`나이+`lens_state_changes` 감시·stale→Sentry·STEP 749·828·829)** · **`daily-brief` 22:30(한 입 브리핑 LLM·KR/US 각 로케일 1회·STEP 778)** · **`email-brief` 23:00(daily-brief 뒤·opt-in 발송·Resend batch·하트비트·STEP 784)**. 🔴 **STEP 829 §9 재배치**: US 데이터 의존 순서(us-perf 22:00 → lens-scores 21:30[EST 종가 뒤] → daily-brief 22:30[us-perf·US 렌즈 뒤라 US 가격·변화 당일값] → email-brief 23:00). KR 브리핑 배포 06:00→07:30 KST(pre-market). 이전: lens 20:00·brief 21:00·email 22:15(brief가 us-perf보다 앞서 US 가격 하루 뒤처짐·EST 장중가).
- **중지(7 · 스케줄만 vercel.json에서 제거 · 라우트/컴포넌트/테이블/데이터 전부 보존)**: `jp/cn/vn/gb-perf`·`fss-advisors`·`youtube-refresh`(794 §5 · `ToolboxClient` 렌더 0개) + **`jp-disclosures`(806 §6 · 소비처 0)**. **복원 = vercel.json 재등록**(`docs/PARKED_FIELD_SURFACES.md` §6). ⚠️ `kr-etp`는 종목상세 KR ETF/ETN 헤더가 `/api/etf-holdings`→`kr_etp_snapshot`으로 **라이브로 읽어 유지**. health 체크도 중지 항목 제거(오탐 방지·jp-disclosures 하트비트 감시 포함)·kr-etp 유지.
- **인증(전 크론 공통)**: `if (!process.env.CRON_SECRET || auth !== \`Bearer ${CRON_SECRET}\`) return 401` — env 미설정 시 `Bearer undefined`로 통과하던 버그 봉인(STEP 793).
- ⚠️ **Vercel Hobby 플랜 = 크론 일 1회 한도.** 더 촘촘한 스케줄(`*/3` 등)을 넣으면 **배포 전체가 조용히 거부**됨(07-18 실증). 빈도(daily-only) 제약이지 카운트 제약 아님(07-23 REST API 전수 확인).

## 5. DB 테이블 (62개 · 2026-08-16 실측 · 그룹 — 🔴 2026-09-05 이후 신설·상태변경 별도 표기)
> 🔑 **전수 인벤토리(행수·시장귀속·근거·화면도달·판정) = `docs/probe_1049_table_inventory.md`(69개 시점) + `docs/probe_1051_unused_disposal.md`(69→62, 이번 처분 반영).** 아래 그룹핑은 요약이며, 근거·판정 대조는 그 문서들이 정본이다.
> 🆕 **2026-09-05 신설(64개로 증가)**: **`channel_reports`**(채널 제작 증권사 리포트·실적 전망 — symbol/stock_name/country/report_date/broker/verdict/target_price/**current_price**/reasons jsonb/earnings_summary/**title**/episode_folder unique. RLS: anon SELECT만, 그 외 REVOKE. KR 15건·US 53건 실측) · **`our_channels`**(허브 채널 카드 — channel_key/country_code/channel_url/title/thumbnail_url, `youtube_channels`[경쟁사 랭킹용·주간 KR wipe]와 별도). 원료 조회 = `lib/channelReports.ts`(`getHomeReportFeed`)·`lib/ourChannels.ts`(`getOurChannels`/`refreshOurChannels`).
> 🔴 **2026-09-05 파킹으로 전환(삭제 아님, 크론만 정지)**: `lens_scores`·`lens_state_changes`·`lens_cuts`·`revdcf_results`·`damodaran_*`·`us_fundamentals*`·`us_valuation`·`us_sector_*` — 아래 §"렌즈/재무"·"역DCF" 그룹 서술은 **크론이 살아있던 시점** 기록. 지금은 값이 갱신되지 않는다(재개 조건 = `docs/STATE.md` ⓪).
> 🔴 **2026-09-05 보안 갱신**: RLS는 켰지만 REVOKE를 안 해 anon/authenticated에 TRUNCATE가 남아있던 테이블 30개(`lens_scores`·`us_stock_perf`·`link_hub` 등) GRANT 정리 완료 — `users`의 `"users public read"`(SELECT true) 정책도 제거(email 전체 공개 차단). 상세 = `docs/STATE.md` ⓪.
> 🔴 **2026-08-16 STEP1048**: `stocks`·`ai_analysis`·`disclosures`·`dividends`·`financials`·`insider_trades`·`news`·`quant_factors`·`short_credit`·`stock_prices`·`supply_demand`(11개) + 뷰 `stock_snapshot_v` DROP — 2026-06-25 시딩된 KR 전용 파일럿 스키마였다(US 무관). 데이터는 `spinoff/kr-pilot-2026-06-25/`로 이관 보존. 상세 = `docs/probe_1047_kr_pilot_removal.md`·`docs/probe_1048_kr_pilot_parked.md`.
> 🔴 **아래 §"유사투자자문/리딩방" 블록은 STEP1035(2026-08-15)로 전부 DROP돼 더 이상 존재하지 않는다**(`fss_advisors`·`leading_rooms`·`leading_room_votes`·`room_*`·`link_previews`·`business_*` — `spinoff/advisor-directory/`로 이관됨, `docs/probe_1035_advisor_spinoff.md` 참고).
> 🔴 **2026-08-16 STEP1051**: `ai_view_cache`·`banned_words`·`macro_indicators`·`discussion_reports`·`platform_discussion_reports`·`us_sector_relative_snapshot`·`products`(7개) DROP — 두 방법(정방향+역방향) 재확인 후 참조 0으로 남은 것만. `damodaran_capex`·`damodaran_working_capital`은 같은 "미사용" 후보였으나 재확인 결과 STEP846 정책상 능동적으로 write되는 대조용 참고자료라 **처분에서 제외**(살아있음). 데이터는 `spinoff/unused-tables-2026-08-16/`로 이관. 상세 = `docs/probe_1051_unused_disposal.md`.
- **시세/성과**: `kr_stock_snapshot` · `{us,jp,cn,vn,gb}_stock_perf` · `kr_etp_snapshot`
- **렌즈/재무**: `lens_scores`(값 `*_value`+상태 `*_state`, **26컬럼** — 🆕 STEP1087: 검산용 raw 컬럼 7개 추가·`gross_profit`·`total_assets`·`total_assets_prior`·`rsi14`·`pos52w`·`fscore_reason_code`·`adj_used`, 전부 nullable·`supabase/migrations/20260819_lens_scores_raw_verification_fields.sql`·쓰기 지점 단일 `lib/lensPrecompute.ts:569`·값은 다음 정규크론부터 채움, `total_assets_prior`만 배선 경로 없어 영구 null) · **`lens_cuts`**(판정 컷 · PK `market,lens_key` · `lo`/`hi`=p30/p70·`n`·`as_of`·`method` — 크론 2-pass가 upsert·STEP 802/805) · `lens_state_changes`(오늘/탐색 변화 피드 · pass2 최종 상태로 diff). 렌즈 재무는 매 요청 야후 `fundamentalsTimeSeries` 호출(별도 재무 원자료 테이블 없음).
- 🔴 **2026-09-05: `components/RevDcfSection.tsx`·`app/[locale]/revdcf`·`/api/cron/revdcf`(크론 §4)는 삭제됨.** `RevDcfBadge.tsx`·`/api/revdcf`·`/api/revdcf/batch`·`lib/revdcf/flag.ts`만 파킹된 `/toolbox`(`UsMarketBoard.tsx`)가 참조해 존치. 아래는 삭제 전 시점 서술.
- **🆕 역DCF(모델 트랙 838~850)**: `damodaran_{industry,tax_rate,country_tax,wacc,beta,capex,working_capital,global_inputs,credit_spread}`(846/847 재료·`as_of` 연1회. 🔴 `capex`·`working_capital` 2개는 읽는 코드가 없는 대조 전용 — STEP1051 재확인·§상단 참고) · **`revdcf_results`**(850 전종목 GAP · PK `as_of,cik` · 매일 쌓음 · verdict/gap 3점(WACC±1%p)/flags jsonb/skip_reason). 파이프라인 = `lib/revdcf/{engine,compute,drivers,registry}.ts` + `scripts/compute_revdcf_all.ts`. **🟢 853 화면 배선**: `components/RevDcfSection.tsx`(종목페이지·US 자체게이트) + `app/[locale]/revdcf`(방법론) + `/api/revdcf`(서빙) + **`/api/cron/revdcf`**(일일 배치·동시성6·270s예산·resumable·유니버스=직전 as_of·22:45). 컬럼 852 추가: `fixed_capital_rate_{level,marginal}`·`verdict_marginal`·`gap_years_marginal`. 원본 xls = Storage `sources`. **🔴 854 플래그 OFF**: 위 화면 배선은 전부 `REVDCF_ENABLED`(§7 env) 뒤 — 기본 미노출. 854 §2 추가: `components/RevDcfBadge.tsx`(보드 배지 순수표시) + `/api/revdcf/batch`(심볼 배치 verdict·플래그 OFF면 `enabled:false`) + `UsMarketBoard.tsx` 최소침습 컬럼(플래그 OFF면 미렌더). 854 §3: `skip_reason=MULTI_CLASS_SHARES`(멀티클래스 5사 V·STZ·FWONA·WMG·COKE=companyfacts 차원팩트 제외로 통합 주식수 부재·강제합산 금지 → 정직 건너뛰기·`drivers.ts`).
- **종목명**: `cn_names` · `gb_names` · `jp_names` · `vn_names` (KR·US는 스냅샷/시드에 내장)
- **AI 캐시(로케일 컬럼 `*_ko`/`*_en`)**: `stock_briefings`(R2) · `news_briefs`(R3) · `filing_summaries`(R1) · `translation_cache` · **`daily_brief`**(한 입 브리핑 — market별 PK·text_ko/text_en·source_facts jsonb·STEP 778)
- **공시/뉴스**: `jp_disclosures` · `dart_corp_codes`
- **링크/큐레이션**: `link_hub`(KR 140·US 139) · `link_hub_clicks` · `link_hub_favorites`
- **광고**: `ad_inquiries` · `brokers`
- **유저/UGC**: `users` · `watchlist` · `feedback` · `youtube_channels` · `discussions`·`discussion_comments`·`discussion_likes`(구축됐으나 UI 없음, 회원탈퇴 클린업만 참조) · `platform_discussions`·`platform_discussion_likes`(위와 동일) · **`email_subscriptions`**(이메일 모닝 브리핑 opt-in — user_id PK·daily_brief bool·locale·unsub_token·RLS 본인행만·STEP 784)
- ⚠️ **git에 없는 테이블 주의**: `link_hub` 등 일부는 MCP 직접 insert라 마이그레이션/git에 없음 → **DB 백업/이전 시 별도 export 필수.**

## 6. API 라우트 (`app/api/`)
- **크론(가동 8)**: `cron/{us-perf,kr-perf,kr-etp,kr-lens-scores,lens-scores,health,daily-brief,email-brief}` (라우트 파일은 15개 전부 존재 — 7개는 스케줄만 중지·§4·jp-disclosures 포함).
- **보드/시세**: `krx/ranking` · `yahoo/{us,jp,cn,vn,gb}-list` · `yahoo/indices`(지수바·심볼별 try/catch 격리) · `yahoo/us-etn-performance` · `krx/kr-performance` · `watchlist/quotes`
- **렌즈/AI(무인증 LLM — 캐시 미스 게이트)**: `lens` · `brief`(R2) · `news-brief`(R3) · `events/summary`·`{kr,jp,cn,gb,vn}-events/summary`(R1) · `etf-holdings`. **⚠️ `lens`·`brief`는 `isActiveSymbol` 게이트**(파킹 시장 심볼 400·806 §6) + `lens`는 `pending`(컷 준비 중) 응답 무캐시. **⚠️ 요약/브리핑 8종은 캐시 미스(=새 유료 LLM) 직전 `blockLLM(req)`(`lib/rateLimit.ts`) 통과 필요** — 봇-UA 차단 + IP 레이트리밋(12/분·100/시간·Vercel `x-real-ip` 키·차단 카운터 5분 Sentry·IP 미로깅). 캐시 히트는 게이트 없이 누구나. 요약 캐시 키 = **검증된 본문 URL의 sha1**(`lib/summaryCacheKey.ts` — CN/VN/GB 공용·포이즈닝 방지).
- **공시 리스트 3상태 계약(6개국 · STEP 797)**: `{kr,jp,cn,gb,vn}-events`·`events`가 **`{events:[…]}`(ok·0건 포함) / `{events:[],error:'fetch_failed'}`(상류 장애·캐시 안 함) / `{events:[],error:'unsupported'}`(심볼 미매핑)** 셋을 구분 반환. 클라 5층+`FilingsCard`: ok+0건 → "없어요" 카드 / fetch_failed·unsupported → 섹션 숨김(거짓 "없음" 금지).
- **피드/기타**: `news/feed`(lang 파라미터) · `ipo/us-feed` · `brokers` · `advisors` · `link-preview` · `feedback` · `watchlist` · `business/manage` · `rooms/favorite` · `toolbox/favorite`
- **이메일 모닝 브리핑(STEP 784)**: `email/unsub`(GET=본문 링크 클릭·POST=메일 클라 원클릭 RFC 8058 — 로그인 불필요·`unsub_token` 검증)

## 7. env 변수 (이름만 · 값은 `.env.local`/Vercel)
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` · `CRON_SECRET`
- **데이터 소스**: `KRX_API_KEY` · `DART_API_KEY` · `EDINET_API_KEY` · `KIS_*`(APP_KEY·SECRET·BASE_URL·TTL·RATE) · `NAVER_CLIENT_ID`/`SECRET` · `FRED_API_KEY` · `ECOS_API_KEY` · `DATA_GO_KR_KEY` · `SEC_USER_AGENT` · `YOUTUBE_API_KEY` · `FSS_FETCH_DELAY_MS`
- **AI/결제/기타**: `OPENAI_API_KEY` · `TOSS_CLIENT_KEY`/`NEXT_PUBLIC_TOSS_CLIENT_KEY`(결제 stub) · `NEXT_PUBLIC_LOGODEV_TOKEN` · `NEXT_PUBLIC_SITE_URL`
- **피처 플래그**: `REVDCF_ENABLED`(854 · 역DCF 노출 게이트 · `=== "true"`만 ON · 기본 OFF · 🔴 **NEXT_PUBLIC_ 접두어 금지**=빌드캐시 인라인 함정이라 서버 env로 · `lib/revdcf/flag.ts`). 🔴 **2026-09-05: 종목페이지 역DCF 섹션·`/revdcf`·`/api/cron/revdcf`는 삭제됨**(§4·§5 참조) — 이 플래그는 이제 파킹된 `/toolbox`의 `RevDcfBadge.tsx`/`/api/revdcf`/`/api/revdcf/batch`만 제어한다. 프로덕션 미설정=OFF.
- ⚠️ 비밀은 사용자 → `.env.local`(로컬)/Vercel(prod) → 코드는 `process.env.X` 참조만. Cowork는 값 취급 불가. **Vercel `NEXT_PUBLIC_*` 늦게 추가 시 빌드캐시 끄고 재배포**(안 그러면 미인라인).

## 8. 다크 테마 토큰 (`app/globals.css`)
- 배경 `#0A0A0A` · surface `#17181C` · border `#2A2C31` · **primary(글자)** `#E9EAEC` · **strong(배경전용)** `#2C303A` · muted `#9CA3AF`(AAA) · **accent/민트** `#2DD4BF` · 헤더/티커 바 `#0E1116`. (⛔ 옛 문서의 라이트색 `#0F1E3D`/`#D4AF37`는 폐기 — 참고하지 말 것.)

## 9. 폴더
`app/`(라우트·API) · `components/` · `lib/`(파이프라인·유틸·API) · `stores/`(Zustand) · `i18n/`·`messages/`(next-intl) · `data/`(시드 심볼·로고 도메인) · `supabase/`(마이그레이션) · `scripts/`(백테스트·enrich·시드) · `public/` · `types/` · `docs/` · `research/`.

**핵심 파일 맵** (🔥 07-21 필드 5면 전환 — CHANGELOG 07-21 · 🔴 2026-09-05 갱신 — 아래 참조):
- 🆕 **오늘(홈 `/`) — 2026-09-05부터 채널 리포트 피드로 교체**: `components/today/TodayClient.tsx`가 이제 렌즈 변화 다이제스트가 아니라 **국가별 `channel_reports` 피드**를 렌더(`lib/constants/reportCountries.ts`를 순회, `components/reports/ReportRow.tsx` 공유 카드). 원료 = `lib/channelReports.ts`(`getHomeReportFeed`) — `/api/today/changes`·`lib/todayChanges.ts`는 화면 호출이 끊기고 파킹(라우트는 존재, 소비처 없음).
- 🆕 **리포트 목록(`/reports`)**: `app/[locale]/reports/page.tsx`(`PageShell`) — 홈과 같은 `ReportRow` 재사용, `compact` 미지정이라 3줄(증권사·판정 포함).
- 🆕 **전역 검색 — 헤더로 이전**: `/explore`(탐색 탭) 삭제로 사라진 유일한 검색 진입로를 `components/layout/HeaderSearch.tsx`(신규, 검색 아이콘→전체화면 오버레이, PC+모바일 상시 노출)로 옮김. `/api/search`(6개국 인메모리 인덱스)는 그대로 재사용. **`app/[locale]/explore/`·`components/explore/ExploreClient.tsx`·`/api/explore/lens-top`는 삭제됨**(85356be) — 더 이상 존재하지 않는다.
- 🆕 **우리 채널 카드**: `lib/ourChannels.ts`(`getOurChannels`/`refreshOurChannels`) + `app/api/cron/our-channels`(§4) — 홈 "우리 채널" 섹션.
- **내비**: `components/layout/MobileTabBar.tsx`(모바일 하단 3탭 — 탐색 탭 제거) · Header(PC: 오늘·소개, 검색은 아이콘으로 별도)
- **PC 공용 셸(STEP 796)**: `components/layout/PageShell.tsx` — 5면(오늘·탐색·관심·마이 + about) 공통(본문 680 + 레일 320 opt·`max-w-[1040px]`·1280px 좌측 144 정합). `mobilePadded`로 px-4 모바일 보존(관심·마이). 종목상세/ETF/advertise는 셸 대신 바깥 `max-w-[1040px]`로 좌측만 맞춤(내부 폭 유지). 탐색은 셸 안에서 본문 680 고정(640~1023 회귀 차단·798). ⚠️ **PageShell 자체는 오늘 기준이라 함부로 바꾸면 5면 다 깨짐.**
- **가드/보안 유틸**: `lib/rateLimit.ts`(무인증 LLM 게이트 `blockLLM`·봇+IP · **쓰기 게이트 `blockWrite`**[feedback·ad-inquiry·click·STEP 829 §6]) · `lib/filingGuard.ts`(공시요약 입력정화+출력가드·STEP 828 §1) · `lib/summaryCacheKey.ts`(요약 캐시 키=sha1(url)·포이즈닝 방지) · **`filing_summaries` accession 키 = 시장 프리픽스**(`KR:`/`JP:`/`US:`·CN/HK/GB/VN은 `urlCacheKey` 해시·STEP 829 §5로 6개국 키공간 충돌 차단) · 파킹시장 공시요약 4라우트(jp/cn/vn/gb)는 `isActiveCountry` 게이트(STEP 829 §4) · `lib/lensCompute.ts`(per-lens try/catch 격리·`flushLensFailures` Sentry 집계) · 크론 하트비트 `cron_heartbeats`(email-brief·jp-disclosures 실행기록→health 감시).
- 🅿️ **파킹(렌더 경로 없음·코드/크론/데이터 보존)**: 구 6개국 터미널 보드·정보 탭·유튜브·검증(유사투자자문) — 목록·복원 절차 = `docs/PARKED_FIELD_SURFACES.md`
- (구) 홈/게이트웨이: `components/toolbox/ToolboxClient.tsx` — 파킹됨(피드·링크 UI 포함)
- 종목보드: `components/toolbox/{MarketBoard,UsMarketBoard,JpMarketBoard,CnMarketBoard,VnMarketBoard,GbMarketBoard}.tsx` + 공유 `LensPreview.tsx`·`BoardTopLensCard.tsx`
- 종목상세: `app/[locale]/stock/[symbol]/page.tsx` → `StockLensClient.tsx`(+`EtfLensClient.tsx`) · 이름 `lib/stockName.ts`
- 렌즈 엔진: `lib/lensCompute.ts`·`lib/lenses.ts`·`lib/lensCopy.ts`(이중언어) · 선계산 `lib/lensPrecompute.ts`
- **렌즈 계산 3단 공개(STEP 782/783)**: `StockLensClient.tsx`의 `LensNarrative`(7렌즈 공용 아코디언 — 렌즈 key로 분기) · `LensRead.cutoffs`(옵셔널·렌즈별 판정 컷 노출)
- **한 입 브리핑(STEP 778)**: `lib/dailyBrief.ts`(순수함수 — 금지어 가드·언어 검증·결정론 폴백 템플릿) · `app/api/cron/daily-brief/route.ts`
- **이메일 모닝 브리핑(STEP 784)**: `app/api/cron/email-brief/route.ts`(daily_brief+관심종목 전환 재조립·Resend batch) · `app/api/email/unsub/route.ts` · 마이페이지 opt-in 토글(`app/[locale]/mypage/page.tsx`)
- 파이프라인: `lib/{krSnapshot,usPerf,jpPerf,cnPerf,vnPerf,gbPerf,krEtpSnapshot}.ts`
- 관심목록/기타: `components/favorites/WatchlistClient.tsx` · 유사투자자문 `components/toolbox/AdvisorDirectory.tsx` · 헤더 `components/layout/Header.tsx`
- i18n: `i18n/{routing,navigation,request}.ts` · `messages/{ko,en}.json` · `lib/authRedirect.ts`(OAuth 로케일 쿠키)

## 10. 🐞 함정 (반복 확인 · 상세 = LENS_DEV_PLAYBOOK / COUNTRY_TAB_PLAYBOOK)
- **Turbopack**: API 라우트·서버 컴포넌트 변경 자동갱신 안 함 → `pkill -f "next dev"; rm -rf .next && npm run dev`. (클라 컴포넌트는 HMR 즉시.)
- **`[locale]` 캐시**: 페이지에 캐시 지시자 없으면 무한 정적 캐시로 굳음 → `force-dynamic`(클라 컴포넌트는 서버 `layout.tsx` 래퍼로 강제).
- **`Promise.all` 하나 실패 = 전체 reject** → 부분 허용은 심볼별 `try/catch` 격리(+`_lastGood` fallback). (지수 티커 소실 원인.)
- **PostgREST 기본 1000행 캡** → 전종목 처리 시 `.range(from, from+999)` 페이지네이션(안 하면 조용히 누락 · name_en 버그 원인).
- 🔴 **`.range()` 페이지네이션은 `.order()` 없이는 여전히 불안정하다**(STEP 952b·953, 2026-08-09). `ORDER BY` 없는 쿼리는 PostgreSQL이 행 순서를 실행마다 보장하지 않아, 별개의 `.range()` 페이지 호출들이 경계에서 행을 놓칠 수 있다 — 실측(동일 인자 10회 반복): `lib/sector.ts:21`·`:64`(`damodaran_industry` 읽기)는 10회 중 1회 각각 9건·118건 결측, 반면 같은 order-less 패턴의 다른 8개 지점(`us_cik_map` 10,432행 포함)은 10회 전부 안정적이었다 — **어느 지점이 실제로 흔들리는지는 예측이 아니라 반복 실측으로만 안다.** 전수·등급·처방 후보(미채택) = `docs/probe_953_pagination.json`·`docs/STATE.md` 00-e. **KR 계열은 전면 동결이라 수정 대상에서 제외.**
  - 🔴 **아키텍처 원칙(STEP 954, 2026-08-09 처방 적용) — Supabase 전체 조회는 `lib/supabasePaging.ts`의 `fetchAllRows()`를 쓴다.** 정렬 키는 **고유 전순서여야 하며 필수 인자**다(기본값 없음 · 빈 배열이면 즉시 throw). `.range()`를 직접 쓰지 않는다. 실측으로 흔들린 2곳(`lib/sector.ts`의 `fetchSectorMap`·`resolveSector` 4-fetch)만 이관 완료 — 잔여 28곳은 대장만 작성(`docs/probe_954_paging_backlog.json`, 우선순위 없음). 🔴 **`damodaran_industry`가 왜 유독 불안정했는지는 여전히 미확정** — 정렬을 걸어 증상은 사라졌으나 원인을 안 것은 아니다(`EXPLAIN`은 Index Scan 확인, 파라렐 스캔 가설은 기각).
- **PostgREST `.in()` 대량 심볼 = URL 길이 초과 400인데 조용히 실패**(`data:null`·2,000개부터 실측 실패) → **1,000개 청크**로 나눠 호출(STEP 757 · 6개 리스트 라우트 적용).
- **클라 빈 응답 무비판 반영 금지** — 데이터 있을 때만 갱신 + 재시도.
- **Supabase CLI가 옛 프로젝트에 링크됨**(§2) → CLI DB 명령 금지.
- **시간 예산 가드는 '새 작업 픽'만 막는다** — 진행 중 await는 못 끊음 → hang 콜 하나가 레인을 잠가 하드리밋행. **모든 외부 콜에 개별 타임아웃 필수**(AbortSignal/withTimeout · STEP 750b).
- **크론이 죽어도 화면은 안 깨진다**(스냅샷 서빙) → 조용히 낡음. 감시 = `health` 크론(§4) + 배포 반영 확인은 라이브 sentry-release 대조(캐시버스터).

## 11. 참조 (상세 문서)
- 국가탭 표준틀·DoD = `COUNTRY_TAB_PLAYBOOK.md` · 렌즈 개발·교훈 로그 = `LENS_DEV_PLAYBOOK.md` · 데이터소스 런북 = `LOCALE_SOURCE_PLAYBOOK.md` · 수익화 = `AD_MONETIZATION_PLAYBOOK.md` · 로드맵 = `ROADMAP.md` · 브랜드 = `BRAND_IDENTITY.md` · 문서 카탈로그 = `INDEX.md`.
