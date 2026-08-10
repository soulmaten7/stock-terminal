# STEP 984 — 3번 규칙 기록 (①-A 3회 · ①-B 3회)

> 조사 전용. 코드 0줄·DB 쓰기 0·크론 미호출·env 변경 0.

## A-0 (우리 자산) — 먼저 연 것

- `lib/lensPrecompute.ts:98-204`(`topByMarketCap`) — 코드로 직접 재확인.
- `node_modules/yahoo-finance2/esm/src/lib/getCrumb.js`·`yahooFinanceFetch.js` — **처음으로 라이브러리 내부를 직접 열어 crumb 메커니즘 확인**(984 신규).
- `cron_heartbeats.note`(lens-scores, 08-09) — 983이 이미 읽은 것 재사용(재조회 안 함, 982/983에서 이미 확보).
- `docs/probe_949_mcap_gap.json` — B그룹 82종목 전체 목록·D그룹 처리방식 재사용.

## ①-A — 야후 응답 스키마 (원전 없음, 실무문서로 대체)

🔴 **이 영역엔 원전이 없다** — `v7/finance/quote`는 야후의 **비공식·비문서화 API**다(공식 문서 자체가 없음). WebSearch로 3회 확인했으나 "marketCap이 어떤 조건에서 빠지는가"를 명시하는 공식 자료는 없었다.

**A-1.** `yahoo-finance2` 라이브러리 자체 소스(위 A-0) — marketCap 필드 자체에 대한 조건부 로직은 라이브러리에 없다(그대로 통과시킴, 필드 유무는 전적으로 야후 응답에 달림).

**A-2.** `gadicc/yahoo-finance2` GitHub 이슈 #764("Invalid Crumb")(WebFetch 직접 확인) — crumb 만료·무효 시 증상은 **"완전 실패"**(요청 자체가 거부·예외)라고 기록돼 있다. **부분 응답(일부 필드만 빠짐)에 대한 언급은 없다.** 🔑 **이건 우리 crumb 가설을 약화시키는 방향의 증거다** — crumb이 문제라면 노 응답(0)이 아니라 요청 자체가 실패(예외)해야 하는데, 우리 관측(noResponse=0·retryFailReasons={})은 정반대다.

**A-3.** WebSearch(yfinance 관련 실무 정리, 여러 출처 종합) — *"엔드포인트가 부하 시 스로틀되며 429·빈 페이로드·단기 차단이 나타날 수 있다"*, *"스케줄 파이프라인이 수천 티커로 팬아웃할 때 문제가 시작된다"*. 🔴 **1차 출처가 아니라 검색엔진의 종합 요약** — 참고자료로만 취급.

## ①-B — 같은 API를 쓰는 다른 서비스의 결측 처리 (US 한정, 3곳 목표)

| 서비스 | 결과 |
|---|---|
| **yfinance(Python)** | `fast_info['market_cap']`처럼 **가벼운 대체 경로**를 별도로 둠(WebSearch) — marketCap 전용 필드가 실패해도 다른 경로로 재시도하는 관행이 있다는 뜻(단 marketCap 자체를 sharesOutstanding×price로 직접 재구성한다는 명시적 언급은 못 찾음). |
| **gadicc/yahoo-finance2 이슈 트래커** | crumb 실패는 완전실패로 처리·보고됨(위 A-2) — "결측 처리"라기보다 "실패로 간주하고 재시도/보고"가 관행. |
| **(3곳 목표, 1곳 미확보)** | 🔴 **못 채움** — RapidAPI 미러·다른 npm 라이브러리(node-yahoo-finance-quotes 등)의 marketCap 결측 처리 방식은 이번엔 확인 안 함. "3곳" 요건 미충족, 미충족으로 명시. |

🔑 **①-B 결론**: sharesOutstanding×regularMarketPrice로 재구성하는 것이 **업계 관행으로 문서화된 것을 찾지는 못했지만**, 우리 자체 라이브 테스트(§2-2)에서 두 필드 모두 정상 수신됨을 확인했으므로 **기술적으로는 재구성 가능**(구현은 안 함).
