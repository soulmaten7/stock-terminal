<!-- 2026-08-14 STEP1028 신설 -->
# 🔑 이미 답한 질문 — 다시 묻기 전에 여기부터

> **왜 있는가**: Vercel 런타임 로그 접근 문제를 892→907→911→913→933→1017, **여섯 번** 따로 조사했다(STEP1027 발견). 규칙("검수 3 — 이전발언 대조")은 있었지만 대조 대상이 `REVDCF_SPEC.md`(2,117줄)+`CHANGELOG.md`(4,000줄+)+`STEP_LEDGER.md`라 매번 전문을 읽을 수 없었다. **이 문서는 그 검색을 대신한다.**
> **쓰는 법**: 새 STEP 착수 전 Ctrl+F로 주제를 찾는다. 있으면 그 답을 쓰거나(재검토 조건 미충족) 재검토 조건이 충족됐는지 확인한다(충족 시에만 다시 조사). **없으면 여기 없다는 것 자체가 정보다** — 새로 조사하고 끝나면 이 문서에 추가한다.
> **형식 강제**: 한 항목 **3줄 이내**(답·확정·재검토조건). 길면 링크만 걸고 본문은 원 문서에 둔다.

---

## Q. Vercel 런타임 로그를 읽을 수 있는가
- 답: **아니오(이 세션에서는).** MCP(`get_runtime_logs`)=403 Forbidden(인증 스코프 불일치, 오늘 1028에서도 재확인) · CLI(`vercel logs`)=**라이브 전용**(지금부터 5분, 과거 조회 불가 — 오늘 실제로 실행해 확인) · 인증 브라우저 대시보드(1시간 보존)만 유효하나 **그 채널은 Cowork 전용**(Claude Code에 브라우저 도구 없음).
- 확정: STEP 892(2026-08-04)·907·911·913(2026-08-05) · 근거: `docs/REVDCF_SPEC.md:2067,2089-2090,2100` · 1028이 오늘(2026-08-14) MCP·CLI 재시도로 재확인(무변화).
- 재검토 조건: Claude Code 세션에 브라우저 도구가 생기거나, MCP 인증 스코프가 프로젝트팀으로 바뀌면.

## Q. `cron_heartbeats.note`로 크론 실행 진단을 볼 수 있는가
- 답: **예, 그러나 그 크론이 heartbeat를 실제로 쓴 적이 있어야 한다.** `lens-scores`/`kr-lens-scores`는 매일 채워진다(917 배선). `revdcf`는 STEP1007이 배선했고 **1030(2026-08-14 수동 1회 호출)에서 첫 행이 생겼다** — `stage:"valuation_done"`. 🔴 단 `stage`는 하한이다: 실제로는 그다음 단계(`us_sector_relative` 계산·저장)까지 끝났는데 그 사실을 적는 heartbeat 한 번만 못 붙어 한 단계 뒤처져 보였다(1030).
- 확정: STEP932·933(2026-08-06, lens-scores 첫 실측)·**STEP1030(2026-08-14, revdcf 첫 행)** · 근거: `docs/REVDCF_SPEC.md` §10-K · `docs/probe_1030_revdcf_manual_run.md`. 🔴 **STEP1027이 933을 "Vercel 로그 문제의 답"으로 묶은 것은 부정확**(933은 lens-scores 얘기지 revdcf·Vercel 로그와 무관) — 1028에서 정정.
- 재검토 조건: 오늘 밤(08-14 22:45 UTC) 정규 크론에서 `stage`가 다시 관측되면(재현성 확인).

## Q. `revdcf`가 정규 실행 시 어디서 죽는가(`maxDuration=300s` 대비 진행도)
- 답: 08-14 수동 1회 관측 — SEC 루프(`loop_done`)와 `us_valuation` 저장(`valuation_done`, 286.2s 지점·잔여 13.8s)까지 heartbeat로 확인됐고, 이어지는 `computeAndSaveSectorRelative()`는 **DB 직접 대조로 완료가 확인**(08-14 `us_sector_relative` 4,000행 신규·80.3% sector 해소)됐으나 그 사실을 적는 heartbeat(`sector_relative_done`)는 못 붙고 죽었다. `us_sector_wide`·`us_fundamentals`·`us_valuation`은 순증행 없음(기존 유니버스 재갱신만).
- 확정: STEP1030(2026-08-14) · 근거: `docs/REVDCF_SPEC.md` §10-K · `docs/probe_1030_revdcf_manual_run.md` · 코드 `app/api/cron/revdcf/route.ts:103-184,361-427`.
- 재검토 조건: 08-14 22:45 UTC 정규 크론에서 같은 지점(`stage=valuation_done` + sector_relative 완료)이 재현되면 확정, 다른 지점이면 재조사.

## Q. `revdcf`는 SEC `frames`를 쓰는가
- 답: **아니오, 한 번도 쓴 적 없다.** `companyfacts`(창 없는 전체 이력)만 쓴다(`app/api/cron/revdcf/route.ts:278-281`). "6분기 조회창 결함"(1021~1022)은 프로덕션이 아니라 조사 프로브 스크립트 안에서만 존재했다.
- 확정: STEP1023(2026-08-14) · 근거: `docs/probe_1023_stale_shares_impact.md`.
- 재검토 조건: 없음(구조적 사실 — route.ts가 companyfacts를 바꾸지 않는 한 안 바뀜).

## Q. 베타는 어디서 조달하는가
- 답: Damodaran `betas.xls`(업종 단위, 연 1회) → `damodaran_beta.unlevered_beta_cash_adj` → `route.ts:224-227`. 개별 회귀 없음, 무료 대체 소스 없음(사실상 SPOF).
- 확정: STEP904(2026-08-04, §10 #10·#11 해소) · `docs/REVDCF_SPEC.md:1715-1716` · STEP1027이 B-2 요약표에 누락돼 있던 것을 신설.
- 재검토 조건: 무료 대체 소스가 발견되면(R1~R4 전체 조사에서 못 찾음, 재조사 시 근거 있어야).

## Q. 무위험수익률·ERP는 FRED인가 Damodaran인가
- 답: **Damodaran.** `ERPbymonth.xlsx`의 "$ Riskfree Rate"·"ERP(T12m) with adj riskfree rate" 열(월 1회, 짝으로 조달) — `damodaran_global_inputs`. FRED는 선택지A로 검토됐으나 **철회**(ERP와 짝이 안 맞음).
- 확정: STEP999→1001→1003→1005(2026-08-12) · 근거: `docs/REVDCF_SPEC.md:1104-1179`(§10-E~I).
- 재검토 조건: 없음(짝 제약이 구조적 — ERP를 다른 소스로 안 바꾸는 한 rf도 못 바꿈).

## Q. `FRED_API_KEY`는 `revdcf`가 쓰는가
- 답: **아니오.** `.env.local`에 키는 **존재**하나(VALUE 미확인 원칙 준수) `lib/revdcf/riskfree.ts`(미배선 프로토타입)조차 무키 CSV 엔드포인트를 쓴다. 이 키의 실사용처는 `app/api/fred/route.ts`·`app/api/macro/summary/route.ts`(역DCF와 무관한 매크로 표시 기능)뿐.
- 확정: STEP1027(2026-08-14) · 근거: grep 전수(`lib/`·`app/` 3파일).
- 재검토 조건: 없음.

## Q. SIC 6726(투자사무소=CEF)로 유니버스에서 CEF를 걸러낼 수 있는가
- 답: **아니오, 실사용 0건.** 등록 CEF는 1940년 투자회사법 소속이라 SEC SIC 체계(운영회사 전용) 자체에 안 잡힌다(`entityType='other'`, `sic=''`). 대신 `entityType≠'operating'`이 신호가 되나, **외국 상장사(20-F 제출자)와 뒤섞여** 단독 판별력이 약하다.
- 확정: STEP1024(2026-08-14) · 근거: `docs/probe_1024_universe_sic.md` §1-2.
- 재검토 조건: SEC가 SIC 체계를 투자회사에도 확장하면(가능성 낮음) 또는 entityType 기반 필터를 실제로 설계할 때.

## Q. 이름패턴으로 유니버스를 CEF/REIT로 분류해도 되는가
- 답: **아니오, REIT 오분류가 크다.** "CEF/신탁" 이름패턴 320건 중 **54건이 실제로는 REIT**(정상 운영회사, SIC 6798) — 그중 1건(`NTRS`)은 REIT도 아니고 은행이었다. 이름패턴 제외 시 커버리지가 96.95%→98.39%로 오르는 것처럼 보이나, SIC로 정확히 제외하면 오히려 96.91%로 **악화**된다(REIT 등 정상 운영회사를 대거 함께 잘랐던 산술 착시).
- 확정: STEP1021(2026-08-14, 최초 발견)→STEP1024(전수 확정) · 근거: `docs/probe_1024_universe_sic.md`.
- 재검토 조건: 없음(전수 실측이라 표본 재조사 불필요 — 단 유니버스 재정의 자체는 장은태 판정 대기).

## Q. 커버리지 게이트(97%, 🔴 정정(STEP1034) — 이제는 85%다)를 지금 넘길 방법이 있는가
- 답: **97% 기준으로는 없었다** — 분자·분모 둘 다 소진됐었다(STEP1017~1024). 그래서 2026-08-14 장은태 승인으로 **게이트 자체를 재정의해 실전환**했다(고정 97%→절대 하한 85%+낙폭 상한 3%p). 🔴 **확정(STEP1032, 실행 결과)**: 08-14 21:30 UTC 첫 실행에서 `lens_cuts` US가 08-14로 19일 만에 갱신됨, **판정 변화는 예상 11.3%가 아니라 실측 6.2%**(원인 미규명, 기록만). 새 85% 기준에서는 SEC 자체 조립(96.95%)도 야후(94.16%)도 둘 다 통과 — 카탈로그 §0-A′(STEP1034)가 재검토 목록으로 등재.
- 확정: STEP1017~1024(분자·분모 소진, 97% 기준)·STEP1025(재정의 드라이런)·STEP1031(실전환)·**STEP1032(첫 실행 확정)**·**STEP1034(카탈로그 §0-A 6곳 갱신)** · 근거: `docs/probe_1032_prune_activation.md`·`docs/probe_1034_catalog_sync.md`.
- 재검토 조건: 없음(이미 확정) — 단 SEC 자체 조립 vs 야후 정본 교체 여부는 별도 미판정 상태로 남음(§0-A′ 재검토 목록).

## Q. 커버리지 게이트 산식은 무엇인가
- 답: `freshCoverage >= ABS_FLOOR(0.85) && (priorCoverage==null || freshCoverage >= priorCoverage - DROP_LIMIT(0.03))`("급락 탐지" — 절대 하한 + 전일 대비 낙폭 상한). `compositionOk`(메가캡 상위 200 중 95% fresh 확보)는 별개 AND 조건, 무변경. KR은 `absFloor:0.95`만 넘기고 `priorCoverage`는 항상 없어 절대 비교만 함(구 산식과 수치 동일).
- 확정: STEP1025(설계, 관측 전용)→STEP1031(실전환, 2026-08-14 장은태 승인) · 근거: `lib/lensPrecompute.ts` `capGateDecision` · `docs/probe_1031_gate_activation.md`.
- 재검토 조건: `ABS_FLOOR`/`DROP_LIMIT` 상수 자체를 바꾸는 결정이 나오거나, self-check(`coverageOk`==`newCoverageOk`)가 어긋나는 사례가 관측되면.

## Q. 프루닝(오래된 lens_scores 행 삭제)은 지금 켜져 있는가
- 답: **US·KR 둘 다 켜져 있다**(STEP1032, 2026-08-15). 1031이 US만 `pruneEnabled:false`로 하루 껐던 것을 1032가 다시 `true`로 켰다 — 대신 삭제 상한(아래 Q)이 새 안전장치로 붙었다. `cron_heartbeats.job='lens-scores'.note.pruneBlockedByFlag`는 이제 `false`가 정상.
- 확정: STEP1031(끔, 2026-08-14)→STEP1032(다시 켬+상한 신설, 2026-08-15) · 근거: `docs/probe_1032_prune_activation.md`.
- 재검토 조건: `pruneBlockedByFlag=true`가 다시 나오면(누가 의도적으로 껐거나 배선이 깨진 것) 재확인.

## Q. 프루닝은 언제 몇 행을 지우는가(삭제 상한)
- 답: STEP833의 4중 게이트(저장 성공률≥80%·유니버스 하한·pass2 성공·취득 게이트 통과)를 전부 통과하고 `pruneEnabled=true`여도, 지울 행 수가 `PRUNE_MAX_ROWS`(기본 100)를 넘으면 **전량 중단**(일부만 안 지움). 순수 함수 `pruneDecision`(`lib/lensPrecompute.ts`)으로 분리돼 있어 값 잠금 테스트 대상. 근거는 **2일 관측뿐**(08-13 63행·08-14 76행) — 1026이 세운 기준을 그대로 씀.
- 확정: STEP1032(2026-08-15) · 근거: `docs/probe_1032_prune_activation.md` §1-2b.
- 재검토 조건: 실제 삭제 행수가 100에 근접하거나 넘는 날이 관측되면(현재 2일 관측으로는 76이 최대) 상한 재검토.

## Q. `us_sector_relative`가 정지하면 업종 대비(D)가 어떻게 실패하는가
- 답: `us_valuation`의 최신 `as_of`로 `us_sector_relative`를 조회하는데, `us_sector_relative` 자체가 최근 갱신을 멈추면 그 `as_of`에 0행 매치 → **전 종목이 `NO_SECTOR`로 표시**(신선도 게이트가 있어서가 아니라 조회 키가 안 맞아서). 서빙 API(`/api/lens`·`/api/watchlist/quotes`)는 신선도 임계값을 아예 안 본다 — `docs/CRON_OBSERVABILITY.md`의 49h/30h는 `health` 크론 전용 모니터링 값일 뿐.
- 확정: STEP1016(2026-08-14) · 근거: `docs/probe_1016_serving_gate_impact.md` §0·§2.
- 재검토 조건: `us_sector_relative`가 매일 정상 갱신되기 시작하면 재검토 — 🔴 **08-14 수동 실행(1030)에서 6일 만에 08-14 as_of로 4,000행 갱신됨(80.3% sector 해소)**. 단 이건 STEP1030의 **수동** 호출 결과이고 정규 크론(22:45 UTC)이 매일 이 지점까지 도달하는지는 아직 미확인 — "매일 정상 갱신"으로 판정하려면 오늘 밤 정규 실행을 봐야 한다.

---

**색인 초기 항목 수 = 10.** 매 STEP 종료 시 새로 확정된 사실을 여기 추가한다(형식 위 그대로, 3줄 이내).
