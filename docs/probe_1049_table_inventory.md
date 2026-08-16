# probe_1049 — DB 테이블 69개 인벤토리 + 범위를 「US 종목 분석」으로 명시

> STEP1049 실행 기록. 🔵 **조사·기록만 — 삭제·이관·코드 수정 0건.** 처분은 다음 STEP.

---

## 요약 한 장

| 구분 | 개수 |
|---|--:|
| 테이블 전체 | 69 |
| 뷰 | 0(STEP1035·1048로 전부 DROP됨) |
| 함수/RPC | 9(`lens_distribution`·`lens_percentiles`은 코드 호출 확인, 나머지 7개는 discussion 계열 트리거 함수 — 아래 참고) |
| **시장 귀속** — US | 27 |
| 〃 — KR | 3(`kr_stock_snapshot`·`kr_etp_snapshot`·`dart_corp_codes`) |
| 〃 — JP/CN/VN/GB(파킹, §7) | 9(`{jp,cn,vn,gb}_names`·`{jp,cn,vn,gb}_stock_perf`·`jp_disclosures`) |
| 〃 — 공용(국가 무관 인프라·다국가 서빙) | 21 |
| 〃 — 불명(더 봐야 정해짐) | 1(`products`) |
| 〃 — Damodaran 원천(값은 현재 US만 로드, 소스 자체는 157개 시장 보편) | 9(위 US 27개 중 서브셋으로 이미 포함, 중복 카운트 아님 — §1-4 참고) |
| **미사용(코드 참조 0)** | 8 — `ai_view_cache`·`banned_words`·`macro_indicators`·`discussion_reports`·`platform_discussion_reports`·`us_sector_relative_snapshot`·`damodaran_capex`·`damodaran_working_capital`(뒤 2개는 근거 원장으로 설계상 대조용만·읽기 코드가 없는 게 의도된 상태 — §1-1 각주 참고, 순수 죽은 테이블은 앞 6개) |
| **화면 도달 불가(파킹, 문서화된 의도적 결정)** | 15 — `PARKED_FIELD_SURFACES.md`(2026-07-28) 구 보드·정보탭·유튜브·검증 클러스터(`link_hub`·`link_hub_clicks`·`link_hub_favorites`·`youtube_channels`·`brokers`) + §7 JP/CN/VN/GB 시장 차단 9개(위) + `dividends`(STEP1048에서 이미 파킹) |
| **멈춘 것(크론 중지 후 스냅샷 정체)** | §7 대상 9개 전부 — 최신 갱신이 2026-07-27 전후에서 멈춤(§6/§7 크론 스케줄 제거) |

**⓪-4 매트릭스 결과**: 69개는 깔끔히 갈리지 않았다 — `products`(10행) 1건은 "더 봐야 정해지는" 불명으로 남긴다(아래 §1-1 표 근거란 참고). 미사용 8건, 화면 도달 불가(파킹) 15건 — 둘 다 10개를 넘는다(⓪-4 "🔑 KR 파일럿에 이은 패턴" 반증 조건 해당) — **처분은 다음 STEP.** `us_` 접두어 8개 중 `us_market_cap_nasdaq`는 접두어와 달리 **행수 0**(크론이 매일 upsert를 시도하는데 결과가 비어 있음 — 접두어가 보증이 아니라는 사례, §1-1 각주). 접두어 없는 51개 중 KR 추가 발견 = **0건**(STEP1048에서 다 걷어냄, `products`만 시장 귀속 불명이지 KR도 아님).

---

## ⓪-1a. 로드맵 원문 대조

| 층 | 확인 | 비고 |
|---|---|---|
| WHY | 조건1(정확) | 재료 귀속 오분류가 순위·판정을 틀리게 한다는 전제 — STEP1047·1048이 실사례 |
| HOW | H-2(카탈로그가 먼저)·H-2-1(3층) | 4층 「우리 DB 테이블」을 이번에 추가(§1-2) |
| WHAT | W-1~W-2-4 | 범위에 「US 종목 분석」 명시(§1-3) |
| 관문·순위 | F-4-3·F-5 | 모델별 보편/US특정 칸 추가(§1-4) — 처분(순위 재조정 등)은 이번 STEP에서 안 함 |
| 완성의 정의 | C-1 항목1·2 | 원전 표본 조건이 국가 어댑터의 일부라는 것을 §1-4가 명문화 |
| 수익 모델 | 없음 | 무관 |

## ⓪-1b. 기존 답 확인 — 재조사 금지

`DATA_SOURCE_CATALOG.md`(3층 구조·20슬롯, 재사용) · `SYSTEM_MAP.md` · `COUNTRY_TAB_PLAYBOOK.md` · `probe_1039`~`1048` · `STATE.md` · `MODEL_ROSTER.md` · `probe_1043`(칸별 확정 모델) 전부 확인. 🔴 **새로 발견한 기존 자산 — `docs/PARKED_FIELD_SURFACES.md`(2026-07-28)**: STEP1048이 "발견"이라 표현한 `components/toolbox/*` 도달 불가 사실은 사실 **7월 28일에 이미 문서화된, 의도적인 제품 축소 결정**(2026-07-21 장은태: "필드 = 오늘·탐색·종목상세·관심·마이 5면뿐")이었다 — STEP1048이 ⓪-5(자체 인벤토리 먼저)를 이 문서까지는 못 미쳤던 결과다. 이번 STEP이 그 누락을 메운다(§1-1 판정 근거에 전부 이 문서를 1차 근거로 인용).

---

## ⓪-3중 규칙 요약

- **A-0 우리 자산**: `PARKED_FIELD_SURFACES.md`(신규 확인·핵심 근거) · `probe_1047`·`1048`(방법론 재사용) · `DATA_SOURCE_CATALOG.md`(20슬롯) · `probe_1043`(칸별 모델) · `vercel.json`(크론 9개) · `lib/activeMarkets.ts`
- **A 원문**: Piotroski(2000)·Altman(1968)·Novy-Marx(2013) 표본 조건 — 기존 `probe_1043`·`probe_1044` 인용 재사용, 재검색 안 함(⓪-1b 금지)
- **B 실무**: 해당 없음(이 STEP은 우리 것을 세는 일)
- **C 반대 증거**: 없음(모델 재검토 아님)
- **검증**: 우리실측 — SQL(행수·최신갱신 전수) + grep(두 방법, 아래) + `vercel.json` 대조 + `PARKED_FIELD_SURFACES.md` 교차확인
- **검수**: 반박 시도(§5 미사용 판정에 각각 방법①②로 재확인) · 수치 출처(전부 오늘 Supabase MCP 직접조회) · 이전 발언 대조(STEP1048의 "고아 코드 발견"을 이번에 "이미 문서화된 파킹"으로 정정) · 분기 비중(귀속 5분류 각각 개수 명시, §요약)
- 🔴 **미측정**: `us_market_cap_nasdaq` 크론이 왜 매일 upsert하는데 0행으로 남는지(코드는 있음, 원인 미규명) · `products`(10행)가 언제 어떻게 채워졌는지(1회 적재 스크립트 특정 못 함)

---

## 1-1. 🔑 테이블 69개 인벤토리 — 전수

🔴 **근거 열은 이름이 아니라 참조하는 데이터 소스·조인 대상·쓰는 코드다.** 표는 시장 귀속별로 묶어서 제시한다(가독성 — 원 순서는 알파벳순이었으나 귀속별 그룹이 근거 대조에 더 유용).

### A. US 귀속 — 27개 (Q1/역DCF 파이프라인 + 시세)

| 테이블 | 행수 | 근거(소스·코드) | 채우는 것 | 최신 갱신 | 쓰는 코드(대표) | 화면 도달 | 판정 |
|---|--:|---|---|---|---|---|---|
| `us_market_cap` | 5,917 | `/api/cron/revdcf`가 Yahoo 3단 취득으로 채움(슬롯#1) | `revdcf` 크론(일 22:45) | 2026-08-15 | `lib/lensPrecompute.ts:217` 외 다수 | 도달(감시목록·역DCF 계산 입력) | 유지 |
| `us_market_cap_nasdaq` | **0** | `/api/cron/us-perf`가 upsert 시도(대조용 2차 소스) | `us-perf` 크론(일 22:00) | — | `app/api/cron/us-perf/route.ts:41`(쓰기만, 읽기 코드 0) | 도달 불가(읽는 화면 자체가 없음) | 🔴 **미사용 — 단 원인 다름(§미측정)**. 접두어 `us_`인데 실제로는 안 쓰이는 사례 |
| `us_stock_perf` | 6,389 | Yahoo 시세, 슬롯#3 | `us-perf` 크론 | 2026-08-15 | `lib/usPerf.ts:63` 외 다수(`/api/watchlist/quotes`·`/explore`) | 도달 | 유지 |
| `us_fundamentals` | 5,820 | SEC companyfacts, 슬롯#4~10 | `revdcf` 크론 | 2026-08-15 | `app/api/cron/revdcf/route.ts:58` | 도달(간접 — `us_valuation` 계산 입력) | 유지 |
| `us_fundamentals_snapshot` | 5,755 | 백필 감사용 스냅샷(969 원칙) | 수동 백필 스크립트 5종 | 2026-08-10 | `scripts/backfill_step96*.ts`(쓰기 전용) | 도달 불가(감사 전용, 화면 아님) | 유지(감사 목적 — 미사용과 다름) |
| `us_valuation` | 32,561 | `revdcf` 크론 산출물(배수 4축) | `revdcf` 크론 | 2026-08-15 | `app/api/q1/[symbol]/route.ts:28` | **플래그 뒤**(`Q1_ENABLED=false`) | 유지 |
| `us_sector_gics` | 503 | SPDR holdings(정본 GICS) | 1회 적재(연1회 갱신 예정) | 2026-08-06 | `lib/sector.ts:159` | 도달(간접 — `resolveSector()`) | 유지 |
| `us_sector_nasdaq` | 7,127 | Nasdaq 공식 스크리너 | 1회 적재 | 2026-08-08 | `lib/sector.ts:102` | 도달(간접) | 유지 |
| `us_sector_yahoo` | 1,021 | Yahoo 폴백 | `revdcf` 크론 경로 | 2026-08-08 | `lib/sector.ts:136` | 도달(간접, 최하위 폴백) | 유지 |
| `us_sector_wide` | 5,820 | `resolveSector()` 결과 통합(슬롯#18) | `revdcf` 크론 | 2026-08-08 | `app/api/cron/revdcf/route.ts:111` 외 | 도달(간접) | 유지 |
| `us_sector_wide_snapshot` | 1,127 | 위 감사 스냅샷 | 수동/부분 | 2026-08-08 | 참조 0(쓰기 경로만 있었던 것으로 추정, 오늘 read 0건) | 도달 불가 | 🟡 감사용 추정 — 쓰는 코드 특정 못 함(미측정) |
| `us_sector_resolved` | 1,021 | 최종 섹터 확정값 | `revdcf` 크론 | 2026-08-08 | `app/api/sector/us/route.ts:11` | **도달**(`/explore` — `ExploreClient.tsx`가 `/api/sector/us` 호출) | 유지 |
| `us_sector_relative` | 13,361 | 업종 대비 백분위(슬롯#19 자체계산) | `revdcf` 크론 | 2026-08-15 | `app/api/q1/[symbol]/route.ts:37` | **플래그 뒤**(Q1_ENABLED) | 유지 |
| `us_sector_relative_snapshot` | 2,294 | 위 감사 스냅샷 | 불명(쓰기 코드도 0건) | 2026-08-09 | **참조 0**(방법①②둘다 0) | 도달 불가 | 🔴 **미사용 확정**(쓰기·읽기 전부 코드 참조 없음 — 데이터만 남은 상태) |
| `us_cik_map` | 10,432 | SEC `company_tickers.json` | `revdcf` 크론 | 2026-08-02 | `lib/lensPrecompute.ts:238` | 도달(간접 — CIK 매핑 인프라) | 유지 |
| `us_coverage_history` | 2 | 커버리지 추이 관측값 | 수동/`revdcf` 관측 | 2026-08-15 | `lib/lensPrecompute.ts:324` | 도달 불가(관측 로그, 화면 아님) | 유지(관측 목적) |
| `damodaran_beta` | 94 | Damodaran betas.xls(슬롯#16, 원리적 SPOF) | 연1회 수동 적재 | 2026-01-05 | `app/api/cron/revdcf/route.ts:227` | 도달(간접, WACC 계산 핵심) | 유지 |
| `damodaran_capex` | 94 | Damodaran capex 데이터(슬롯#12 **대조용만**) | 연1회 수동 적재 | 2026-01-05 | 참조 0(설계상 의도 — STEP846 "폴백금지·대조용만" 정책) | 도달 불가(설계상) | 🟡 미사용이지만 **의도된 상태**(정답은 원전 T5 자체계산, 이 테이블은 검산 참고자료) |
| `damodaran_country_tax` | 229 | Damodaran countrytaxrates(슬롯#11) | 연1회 수동 적재 | 2026-01-05 | `app/api/cron/revdcf/route.ts:217` | 도달(간접) | 유지 |
| `damodaran_credit_spread` | 7 | Damodaran ratings.xls(슬롯#17) | 연1회 수동 적재 | 2026-01-05 | `app/api/cron/revdcf/route.ts:221` | 도달(간접) | 유지 |
| `damodaran_global_inputs` | 2 | Damodaran ERPbymonth.xlsx(슬롯#14·#15) | 월1회 수동 적재(STEP1005) | 2026-08-01 | `app/api/cron/revdcf/route.ts:212` | 도달(간접, WACC 핵심) | 유지 |
| `damodaran_industry` | 48,144 | Damodaran indname 등(섹터 매핑 크로스워크) | 연1회 수동 적재 | 2026-01-05 | `lib/sector.ts:36` | 도달(간접) | 유지 |
| `damodaran_tax_rate` | 96 | Damodaran taxrate.xls | 연1회 수동 적재 | 2026-01-05 | `app/[locale]/revdcf/page.tsx:32`(방법론 페이지 직접 서빙) | **도달**(`/revdcf` 방법론 페이지) | 유지 |
| `damodaran_wacc` | 94 | Damodaran wacc.xls(레거시 정적값, ERPbymonth로 대체됨) | 연1회 수동 적재(현재 갱신 정지) | 2026-01-05 | 참조 0(SYSTEM_MAP·registry엔 있으나 오늘 grep 0건) | 도달 불가 | 🟡 **레거시 — `damodaran_global_inputs`로 대체 완료**(슬롯#14/15 각주 참고), 삭제 여부는 다음 STEP |
| `damodaran_working_capital` | 94 | Damodaran wcdata(슬롯#13 **대조용만**) | 연1회 수동 적재 | 2026-01-05 | 참조 0(damodaran_capex와 동일 설계) | 도달 불가(설계상) | 🟡 미사용이지만 **의도된 상태**(§damodaran_capex 참고) |
| `revdcf_results` | 9,060 | `revdcf` 크론 산출물(GAP) | `revdcf` 크론(일 22:45) | 2026-08-15 | `app/api/revdcf/route.ts:27` | **도달**(`/revdcf` 배지) + **플래그 뒤**(`REVDCF_ENABLED`, 종목상세 섹션) | 유지 |
| `sector_cuts` | 78 | 렌즈 판정 컷(US 섹터 상대) | `lens-scores`/`revdcf` 계열 크론 | 2026-08-08 | 코드 경로 확인 필요(테이블명만 매치, 상세 미확인) | 도달(추정 — `lens_cuts`와 같은 역할) | 🟡 쓰는 코드 파일:줄 특정 미완(미측정) |

### B. KR 귀속 — 3개

| 테이블 | 행수 | 근거 | 채우는 것 | 최신 갱신 | 쓰는 코드(대표) | 화면 도달 | 판정 |
|---|--:|---|---|---|---|---|---|
| `kr_stock_snapshot` | 2,776 | KRX/DART 원문(KR 실보드) | `kr-perf` 크론(일 10:00) | 2026-08-15 | `lib/krSnapshot.ts:126` 외 다수(`/explore`·`/api/watchlist/quotes`·`sitemap.ts`) | **도달**(다수 경로) | 🔴 **동결 — 절대 무접촉**(CLAUDE.md) |
| `kr_etp_snapshot` | 1,550 | KRX ETF/ETN | `kr-etp` 크론(일 10:15) | 2026-08-13 | `lib/instrumentType.ts:49`·`/api/etf-holdings` | **도달**(종목상세 KR ETF/ETN 헤더 — `PARKED_FIELD_SURFACES.md` §6이 명시적으로 "파킹 표면 아님"이라 예외 처리한 테이블) | 유지 |
| `dart_corp_codes` | 3,922 | DART corpCode.xml | 1회 적재(2026-07-06 이후 정체 — 갱신 크론 없음) | 2026-07-06 | `lib/dart.ts:38` → `lib/dartEvents.ts` → `app/api/kr-events/route.ts`(StockLensClient가 fetch) | **도달**(KR 종목상세 공시 요약) | 🟡 갱신 크론 부재(정체 40일) — 처분은 다음 STEP |

### C. JP/CN/VN/GB 귀속 — 9개 (🔴 전부 화면 도달 불가, `PARKED_FIELD_SURFACES.md` §7)

| 테이블 | 행수 | 근거 | 채우는 것 | 최신 갱신 | 쓰는 코드(대표) | 화면 도달 | 판정 |
|---|--:|---|---|---|---|---|---|
| `jp_names` | 4,014 | 야후 종목명 | 없음(크론 정지, STEP794 §5) | 2026-07-06 | `lib/jpName.ts:9` | 도달 불가(§7 `isActiveSymbol` 차단) | 파킹(문서화됨) |
| `jp_stock_perf` | 4,256 | 야후 시세 | 없음(정지) | 2026-07-27 | `lib/jpPerf.ts:63` | 도달 불가 | 파킹 |
| `jp_disclosures` | 13,600 | EDINET | 없음(STEP806 §6 정지) | 2026-07-27 | `app/api/jp-events/route.ts:34` | 도달 불가(호출부 자체가 `isActiveSymbol` 뒤) | 파킹 |
| `cn_names` | 7,095 | 야후 종목명 | 없음(정지) | 2026-07-06 | `lib/cnName.ts:8` | 도달 불가 | 파킹 |
| `cn_stock_perf` | 7,079 | 야후 시세 | 없음(정지) | 2026-07-27 | `lib/cnPerf.ts:119` | 도달 불가 | 파킹 |
| `vn_names` | 387 | 야후 종목명 | 없음(정지) | 2026-07-07 | `lib/vnName.ts:8` | 도달 불가 | 파킹 |
| `vn_stock_perf` | 402 | 야후 시세 | 없음(정지) | 2026-07-27 | `lib/vnPerf.ts:54` | 도달 불가 | 파킹 |
| `gb_names` | 349 | 야후 종목명 | 없음(정지) | 2026-07-07 | `lib/gbName.ts:8` | 도달 불가 | 파킹 |
| `gb_stock_perf` | 349 | 야후 시세 | 없음(정지) | 2026-07-27 | `lib/gbPerf.ts:54` | 도달 불가 | 파킹 |

### D. 공용(국가 무관 인프라·다국가 서빙) — 21개

| 테이블 | 행수 | 근거 | 채우는 것 | 최신 갱신 | 쓰는 코드(대표) | 화면 도달 | 판정 |
|---|--:|---|---|---|---|---|---|
| `lens_scores` | 2,017 | 렌즈 계산(KR+US 공용 엔진) | `kr-lens-scores`+`lens-scores` 크론 | 2026-08-15 | `lib/lensPrecompute.ts:357` 외 다수 | **도달**(종목상세·탐색·워치리스트) | 유지 |
| `lens_cuts` | 10 | 렌즈 판정 컷(p30/p70) | 위 크론과 동일 | 2026-08-15 | `lib/lensCuts.ts:65` | 도달(간접) | 유지 |
| `lens_state_changes` | 5,118 | 렌즈 상태 변화 diff | 위 크론 pass2 | 2026-08-15 | `lib/todayChanges.ts:64` | **도달**(홈 오늘 피드) | 유지 |
| `daily_brief` | 41 | LLM 생성 한 입 브리핑 | `daily-brief` 크론(일 22:30) | 2026-08-15 | `lib/dailyBrief.ts:88` | 도달(홈) | 유지 |
| `stock_briefings` | 3,065 | LLM 생성(R2) | `/api/brief` on-demand | 2026-08-16 | `app/api/brief/route.ts:52` | **도달**(종목상세, StockLensClient fetch) | 유지 |
| `news_briefs` | 1,828 | LLM 생성(R3) | `/api/news-brief` on-demand | 2026-08-16 | `app/api/news-brief/route.ts:64` | **도달**(종목상세) | 유지 |
| `filing_summaries` | 1,545 | LLM 생성(R1, 6개국 공용 스키마) | 각 `/api/*-events/summary` on-demand | 2026-08-14 | `app/api/kr-events/summary/route.ts:24` 외 5개국 | **도달**(KR·US만 실질 — JP/CN/VN/GB는 §7로 호출부 도달 불가) | 유지 |
| `translation_cache` | 446 | 구글 번역 캐시(무료) | `/api/news/feed` on-demand | 2026-07-18 | `app/api/news/feed/route.ts:157` | 도달(간접, 뉴스 피드 다국어) | 유지 |
| `link_hub` | 492 | 큐레이션 링크 원장 | 수동 관리 | 2026-07-07 | `app/api/toolbox/favorite/route.ts:44` | **도달 불가**(`PARKED_FIELD_SURFACES.md` §2 "정보 탭" — `ToolboxClient` 진입점 제거) | 파킹(문서화됨) |
| `link_hub_clicks` | 1 | 클릭 로그 | `/api/toolbox/click` | 2026-06-30 | `app/api/toolbox/click/route.ts:17` | 도달 불가(호출 컴포넌트 `LinkCard.tsx`가 파킹된 `ToolboxClient` 하위) | 파킹 |
| `link_hub_favorites` | 0 | 링크 즐겨찾기 | `/api/toolbox/favorite` | — | `app/api/toolbox/favorite/route.ts:17` | 도달 불가(`FavoritesClient.tsx` 호출 제거됨, `favorites/page.tsx` 주석에 명시) | 파킹 |
| `youtube_channels` | 100 | 유튜브 채널 랭킹 | 없음(`youtube-refresh` 크론 STEP794 §5 정지) | 2026-07-20 | `lib/youtube.ts:93` | 도달 불가(`YoutubeRanking.tsx`가 파킹된 `ToolboxClient` 하위) | 파킹 |
| `brokers` | 75 | 증권사 광고 슬롯 | 수동 관리 | 2026-07-07 | `app/api/brokers/route.ts:14`(`BrokerRanking.tsx` 전용) | 도달 불가(`PARKED_FIELD_SURFACES.md` §6 "잔여 이슈" — 광고 슬롯도 렌더 경로 소실) | 파킹(단 광고 카피 미정비 — 문서 자체가 후속 판단 필요라 명시) |
| `watchlist` | 0 | 사용자 관심종목 | `/api/watchlist` 사용자 액션 | — | `app/api/watchlist/route.ts:13` | **도달**(`/favorites` 라이브 페이지, 현재 등록 0건일 뿐 기능은 살아있음) | 유지 |
| `users` | 2 | 회원 | Supabase Auth 트리거(`handle_new_user`) | 2026-07-19 | `components/auth/AuthProvider.tsx:17` | **도달**(로그인 전역) | 유지 |
| `email_subscriptions` | 1 | 이메일 구독 | 사용자 액션 | 2026-07-23 | `app/[locale]/mypage/page.tsx:70` | **도달**(마이페이지) | 유지 |
| `ad_inquiries` | 0 | 광고 문의 | 사용자 액션 | — | `app/api/advertise/inquiry/route.ts:33` | **도달**(`/advertise`) | 유지 |
| `feedback` | 0 | 사용자 피드백 | 사용자 액션 | — | `app/api/feedback/route.ts:37` | **도달**(`/feedback`) | 유지 |
| `cron_heartbeats` | 6 | 크론 실행 로그 | 각 크론 자체 기록 | 2026-08-15 | `app/api/cron/health/route.ts:62`(감시) | 도달 불가(운영 감시용, 사용자 화면 아님) | 유지(운영 목적) |
| `products` | 10 | ETF 등 "상품" 카탈로그(019 마이그레이션, `discussion_count` 컬럼 보유 — 리뷰 기능과 함께 설계됐던 것으로 추정) | **불명**(1회 적재 스크립트 특정 못 함) | 2026-06-24 | 참조 0(방법①②모두 0 — STEP1035 README가 이미 "별개 도메인·미사용"으로 분류해뒀던 테이블) | 도달 불가 | 🔴 **불명 — 시장 귀속도 코드 참조도 없음.** 더 봐야 정해지는 것: 이 10행이 언제·어떻게 들어갔는지(수동 INSERT 추정, 스크립트 미발견) |
| `banned_words` | 0 | 금칙어(`001_initial_schema.sql`에 seed INSERT 있었으나 필터링 로직 자체가 코드에 없음) | 없음 | — | 참조 0 | 도달 불가 | 🔴 **미사용 확정** |
| `ai_view_cache` | 0 | AI 생성 뷰 캐시(symbol·content·model 컬럼 — 용도 추정만 가능) | 없음 | — | 참조 0 | 도달 불가 | 🔴 **미사용 확정**(마이그레이션 파일에도 없음 — MCP로 직접 생성된 것으로 추정, `advisor_directory`와 같은 패턴) |
| `macro_indicators` | 0 | 거시지표(용도 추정만) | 없음 | — | 참조 0 | 도달 불가 | 🔴 **미사용 확정**(`SYSTEM_MAP.md`가 이미 2026-08-07부터 "죽은 테이블"로 기록해둠) |

### E. 커뮤니티 기능(구축됐으나 UI 없음) — 6개

🔴 **`discussions`/`platform_discussions` 두 클러스터는 이름이 겹치지만 다르다** — `discussions`는 종목 토론, `platform_discussions`는 상품(`products`) 토론으로 보인다(019 마이그레이션 동시 정의). **둘 다 UI 컴포넌트가 코드베이스에 전혀 없다**(`find components -iname "*discussion*"` 결과 0건) — 스키마 + 트리거 함수(`update_discussion_*_count` 등 5개) + 회원탈퇴 클린업 코드만 존재하는, 만들어졌지만 한 번도 화면에 노출된 적 없는 기능으로 보인다.

| 테이블 | 행수 | 근거 | 채우는 것 | 최신 갱신 | 쓰는 코드(대표) | 화면 도달 | 판정 |
|---|--:|---|---|---|---|---|---|
| `discussions` | 0 | 종목 토론(019 마이그레이션) | 없음(UI 없음) | — | `app/api/account/delete/route.ts:23`(탈퇴 클린업만) | 도달 불가 | 🟡 구축됐으나 미노출(미사용과는 결이 다름 — 삭제 대상 판단은 다음 STEP) |
| `discussion_comments` | 0 | 위 댓글 | 없음 | — | `app/api/account/delete/route.ts:24` | 도달 불가 | 🟡 위와 동일 |
| `discussion_likes` | 0 | 위 좋아요 | 없음 | — | `app/api/account/delete/route.ts:25` | 도달 불가 | 🟡 위와 동일 |
| `discussion_reports` | 0 | 위 신고 | 없음 | — | **참조 0**(탈퇴 클린업 배열에도 없음 — `discussions`류 5개 중 유일하게 코드 참조가 전혀 없음) | 도달 불가 | 🔴 **미사용 확정**(같은 클러스터 안에서도 갈림 — 이름으로 뭉뚱그리면 놓치는 사례) |
| `platform_discussions` | 0 | 상품 토론 | 없음 | — | `app/api/account/delete/route.ts:26` | 도달 불가 | 🟡 구축됐으나 미노출 |
| `platform_discussion_likes` | 0 | 위 좋아요 | 없음 | — | `app/api/account/delete/route.ts:27` | 도달 불가 | 🟡 위와 동일 |
| `platform_discussion_reports` | 0 | 위 신고 | 없음 | — | **참조 0**(`discussion_reports`와 동일한 결여) | 도달 불가 | 🔴 **미사용 확정** |

**뷰**: 0개(과거 `stock_snapshot_v`·`advisor_directory` 전부 STEP1035·1048에서 DROP됨 — 오늘 `pg_views` 재조회로 재확인).

**함수/RPC 9개**:

| 함수 | 인자 | 쓰는 코드 | 화면 도달 | 판정 |
|---|---|---|---|---|
| `lens_distribution` | `p_market, p_lens` | `app/api/lens/route.ts:68` | **도달**(종목상세 렌즈 백분위) | 유지 |
| `lens_percentiles` | `p_symbol` | `app/api/lens/route.ts:33` | **도달** | 유지 |
| `handle_new_user` | — | Supabase Auth 트리거(코드 밖, DB 레벨) | 도달(간접 — 신규가입 시 `users` 행 자동 생성) | 유지 |
| `update_discussion_comment_count`·`update_discussion_like_count`·`update_discussion_report_count`·`update_platform_discussion_like_count`·`update_platform_discussion_report_count` | — | discussion 테이블 트리거(DB 레벨, 앱 코드 호출 없음) | 도달 불가(위 §E와 동일 클러스터, 발동 조건 자체가 없음) | 🟡 구축됐으나 미노출 |
| `update_target_discussion_count` | — | 위와 동일 클러스터 | 도달 불가 | 🟡 위와 동일 |

---

## 1-2. 카탈로그에 없던 층 추가 — `DATA_SOURCE_CATALOG.md`

🔴 **`DATA_SOURCE_CATALOG.md`는 이 STEP으로 처음 명시적으로 "US 전용"임을 문서 머리에 못박는다** — 지금까지는 암묵이었다(기관 5개 전부 US, DART/KRX 언급 0건이 그 증거였을 뿐, 선언은 없었다).

### 🔑 4층 — 「우리 DB 테이블」(슬롯 → 테이블 역인덱스)

| 슬롯 | 우리 DB 테이블 |
|--:|---|
| #1 시가총액 | `us_market_cap` |
| #2 발행주식수 | (전용 테이블 없음 — `us_fundamentals`에 SEC 태그로 포함, `revdcf_results.flags.sharesTag`에 채택 태그명만 기록) |
| #3 주가 | `us_stock_perf` |
| #4 순이익 | `us_fundamentals` |
| #5 자기자본 | `us_fundamentals` |
| #6 매출 | `us_fundamentals` |
| #7 영업이익 | `us_fundamentals` |
| #8 D&A | `us_fundamentals` |
| #9 부채 | `us_fundamentals` |
| #10 비영업자산/현금 | `us_fundamentals` |
| #11 세율 | `damodaran_country_tax`·`damodaran_tax_rate` |
| #12 자본지출률 | `damodaran_capex`(대조용만, 정답은 자체계산) |
| #13 운전자본률 | `damodaran_working_capital`(대조용만, 정답은 자체계산) |
| #14 무위험수익률 | `damodaran_global_inputs` |
| #15 ERP | `damodaran_global_inputs`(#14와 같은 행) |
| #16 베타 | `damodaran_beta` |
| #17 신용스프레드 | `damodaran_credit_spread` |
| #18 섹터분류 | `us_sector_gics`·`us_sector_nasdaq`·`us_sector_yahoo`·`us_sector_wide`·`us_sector_resolved` |
| #19 업종배수 | (전용 테이블 없음 — `us_sector_relative`가 산출물, 원자료는 `us_valuation` 자체) |
| #20 업종베타 | (#16과 동일 슬롯, 중복 등재였음 — 기존 정정 그대로) |

### 🔴 어느 슬롯에도 안 붙는 테이블 — 45개(69 − 24개 슬롯 연결)

**이것이 카탈로그 밖에서 살던 것들이다.** 크게 다섯 갈래:
1. **산출물/파생 테이블**(모델의 입력이 아니라 출력): `revdcf_results`·`us_valuation`·`us_sector_relative`·`us_sector_relative_snapshot`·`us_fundamentals_snapshot`·`us_sector_wide_snapshot`·`us_coverage_history`·`sector_cuts`·`lens_scores`·`lens_cuts`·`lens_state_changes` — 카탈로그는 "밖에서 무엇을 받아오나"의 지도이므로 우리가 계산해서 만든 값은 원리적으로 슬롯이 아니다.
2. **KR/JP/CN/VN/GB 시장 데이터**: `kr_stock_snapshot`·`kr_etp_snapshot`·`dart_corp_codes`·`{jp,cn,vn,gb}_names`·`{jp,cn,vn,gb}_stock_perf`·`jp_disclosures` — 카탈로그가 US 전용이라 애초에 범위 밖.
3. **AI 캐시·뉴스·커뮤니케이션**: `daily_brief`·`stock_briefings`·`news_briefs`·`filing_summaries`·`translation_cache` — 모델 입력이 아니라 제품 표면(브리핑·뉴스)의 데이터.
4. **제품 인프라**: `users`·`watchlist`·`email_subscriptions`·`ad_inquiries`·`feedback`·`cron_heartbeats`·`us_cik_map`(엄밀히는 슬롯#2에 인접하나 전용 슬롯 없음)·`us_market_cap_nasdaq`.
5. **파킹/미사용/불명**: `link_hub`·`link_hub_clicks`·`link_hub_favorites`·`youtube_channels`·`brokers`·`products`·`banned_words`·`ai_view_cache`·`macro_indicators`·`damodaran_wacc`(레거시)·discussion 계열 6개.

---

## 1-3. 범위 명시 — 「US 종목 분석」

🔴 **`ROADMAP_V2.md` 머리에 다음을 명시했다(원문은 파일 참조)**: *"이 로드맵의 모든 판정·순위·재료 실측은 US 상장 종목 분석을 범위로 한다. KR/JP/CN/VN/GB 데이터·화면은 별도 트랙(동결 또는 파킹)이며 이 로드맵의 판정 대상이 아니다."*

**다른 국가 탭 절차 연결**: `CLAUDE.md` 2026-07-18 배너 룰 ②(*"TR-AI 엔진 보편·어댑터만 나라별"*)와 `COUNTRY_TAB_PLAYBOOK.md` §0-2가 실행 장치다 — 이 로드맵(WHY/HOW/WHAT/관문/완성기준)이 만드는 것은 **엔진**(모델 계산 로직)이고, 새 국가 탭을 열 때는 **어댑터**(§1-4의 국가 파라미터·데이터 소스 축)만 그 나라 것으로 갈아끼우면 된다.

**`probe_1039` ⓒ 7건 중 판정**: `COUNTRY_TAB_PLAYBOOK.md`는 🔴 **존치 확정** — "US 단독이면 불필요"가 아니라, **이 STEP(1049)이 만드는 「범위 명시 + 엔진/어댑터 분리」가 실행될 때 그 실행 장치가 이 문서**이기 때문이다. `LOCALE_SOURCE_PLAYBOOK.md`도 같은 이유로 존치.

---

## 1-4. 🔑 모델별 「보편 / US 특정」

`probe_1043`의 칸별 확정 모델 전부에 세 축을 적용했다. 🔴 **「보편」은 세 축 모두 근거가 있어야 한다 — 근거 없으면 「불명」.**

| 모델(칸) | ① 원전 표본 조건 | ② 국가 파라미터 | ③ 데이터 소스 | 종합 |
|---|---|---|---|---|
| **배수**(EV/EBITDA·P/E·P/B·PSR) | 없음(Damodaran 정의 자체가 "같은 질문의 다른 분모" — 표본 제약 없는 산술) | 없음(비율 계산에 국가별 상수 없음) | 🔴 **US 특정**(SEC companyfacts, 미국 상장사만 제출) | **엔진=보편 · 소스=US특정** — 다른 나라는 그 나라의 재무제표 소스로 교체하면 같은 산식이 작동 |
| **재무건전성**(Piotroski F-Score) | 🔴 **표본 있음** — 원전은 고 B/M(가치주) 최상위 5분위, 우리는 전종목(부분일치, STEP1044) | 없음(9개 이진 신호, 국가 상수 없음) | 🔴 US 특정(SEC companyfacts) | **엔진=조건부 보편**(표본 caveat 화면 공개 필요) · 소스=US특정 |
| **시장 내재 기대**(역DCF) | 없음(Rappaport·Mauboussin 원전은 국가 무관 산식) | 🔴 **있음**(rf·ERP·세율 — 나라마다 값이 다름, 슬롯#11·14·15) | 🔴 US 특정(SEC + Damodaran US행) | **엔진=보편 · 파라미터+소스=US특정** — 다른 나라는 그 나라 rf·ERP·세율(Damodaran 157개 시장 데이터 이미 존재)로 교체 |
| **배당**(수익률+연속증가연수) | 없음(산술) | 없음 | 🔴 US 재료 0건(STEP1048로 확정) | 엔진=보편이나 US도 아직 미착수 |
| **부도위험**(Altman Z) | 🔴 **표본 있음** — 원전은 US 제조업 상장사(1968) | 없음(계수 자체가 표본 종속) | 🔴 US 특정(SEC) | **불명 — 계수 자체를 재추정해야 다른 표본에 쓸 수 있음**(제조업 외·비US엔 원전 계수가 안 맞을 수 있음, 원전에 개정판 존재하나 미검토) |
| **최근 변화**(모멘텀+기술) | 없음(Jegadeesh-Titman 12-1은 방법론, 표본은 미국이나 전세계 재현됨) | 없음 | 🔴 US 특정(현재는 `us_stock_perf`, KR은 `kr_stock_snapshot`로 **이미 국가별 소스 분리돼 있음** — 렌즈가 원래 KR+US 공용 엔진) | **엔진=보편 · 소스=국가별 이미 분리(선례)** |
| **성장**(매출 5년 CAGR) | 없음(산술, `chan_karceski_lakonishok_2003`은 반대증거일 뿐 원전 아님) | 없음 | 🔴 US 특정(SEC companyfacts) | **엔진=보편 · 소스=US특정** |

🔑 **이 표가 나중에 국가 탭을 만들 때 그대로 체크리스트가 된다** — 새 국가 탭 착수 시 ③(데이터 소스)을 그 나라 원문 공시로 교체하고, ②(국가 파라미터)가 있는 모델은 Damodaran의 해당국 행을 연결하고, ①(표본 조건)이 있는 모델은 원전이 그 표본 밖에서도 재현되는지 확인부터 한다.

🔴 **"전부 보편"으로만 나오지 않았다** — Piotroski·Altman 둘 다 원전 표본 조건이 발목을 잡는다(⓪-4 반증 조건이 실제로 걸림).

---

## 못 한 것 / 미측정 / 철회·정정

- **못 한 축(시도 기록)**: `sector_cuts`·`us_sector_wide_snapshot`을 쓰는 정확한 코드 파일:줄을 특정하지 못했다(테이블명 매치는 됐으나 인접 코드 문맥까지는 못 읽음) — 다음 STEP에서 정밀화 필요.
- **아직 안 함**: 8개 미사용 테이블·15개 파킹 테이블·6개 커뮤니티 미노출 테이블의 **처분**(DROP/유지/재활성화 판정) — 이번 STEP은 세기만 했다.
- **철회·정정**: STEP1048이 "발견"이라 표현한 `components/toolbox/*` 도달 불가 사실을 이번 STEP에서 **"2026-07-28에 이미 문서화된 의도적 파킹"**으로 정정(`PARKED_FIELD_SURFACES.md`). STEP1048의 판단(파킹·DROP 실행)은 결과적으로 옳았으나, "발견"이라는 서술과 ⓪-5(자체 인벤토리 먼저) 준수는 불완전했다.
- **미측정**: `us_market_cap_nasdaq`가 왜 크론이 매일 upsert하는데 0행인지(코드 확인은 됐으나 원인 미규명 — 다음 STEP 후보) · `products` 10행의 적재 경로(수동 추정, 스크립트 미발견) · Altman Z 원전에 갱신판(제조업 외 표본)이 있는지(재검색 안 함, ⓪-1b 금지 범위 안)

🔴 **판정 금지 — 처분(DROP·유지·재활성화)은 전부 다음 STEP·장은태 판정 대상. 이 STEP은 인벤토리·귀속·도달성·모델 축만 세고 기록했다.**
