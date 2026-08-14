<!-- 2026-08-12 STEP 997 신설 · STEP998 ②단계 추가 -->
# 🗂️ 데이터 소스 카탈로그 — ① 이미 쓰는 5개 기관 + ② 3라운드 전수 조사

> **이 문서가 정본이다.** `docs/data_source_catalog.xlsx`는 같은 내용의 사본(필터·정렬용)이며, 갱신은 이 md 파일을 먼저 고치고 그다음 xlsx를 다시 낸다.
> 🔴 조사·문서 전용 STEP(997)의 산출물 — 코드 0줄·DB 쓰기 0·크론 미호출.
> 범위 = **①단계, 이미 쓰는 5개 기관만**(SEC·Yahoo Finance·Nasdaq Trader·Damodaran·SPDR/State Street). 새 기관(FRED·Treasury·Polygon·FMP 등)은 ②단계 — 이 문서 범위 밖.

## 왜 이 카탈로그인가 (장은태 지적, 원문 근거)

소스 기관은 유한하다(20~30개 수준). 한 기관이 수십 가지를 제공하는데 우리는 각 기관의 엔드포인트를 하나씩만 알고 썼다 — 필요할 때마다 새로 찾는 사후 대응이 반복됐다. 실증 두 건:

1. **SEC `companyfacts.zip` 벌크를 STEP947부터 993까지 46개 STEP 동안 몰랐다** — SEC 공식 문서(`edgar-application-programming-interfaces`)에 "가장 효율적인 방법은 벌크 아카이브 ZIP 파일"이라고 명시돼 있었다.
2. **SEC `frames` API는 "특정 태그의 전 기업 값"을 한 번에 주는데, 우리는 같은 것을 얻으려고 종목당 한 번씩 5,893번 부른다.** (단, §3-1에서 이 대안 자체는 이미 다른 이유로 기각됐음을 확인 — 아래 참조.)

🔴 **이 카탈로그는 Q1(밸류) 전용이 아니다.** Q2(배당)~Q5(변화감지)가 전부 같은 5개 기관의 다른 엔드포인트를 쓸 수 있다.

---

## §3. 즉시 이득 판별 (맨 앞에 둔다 — 보고 형식 지시)

🔴 판단만 하고 실행하지 않는다. 각 판단 = "쓸 수 있다/없다 + 근거".

### 3-1. SEC `frames` API가 993의 순증 병목(40건/일)을 대체할 수 있는가?

**판정: 쓸 수 없다 — 이미 다른 이유로 기각됐고(STEP838→840), 그 병목 자체도 이미 다른 수단(995·996 벌크ZIP)으로 해결됐다.**

- **기계적 잠재력은 실재한다**: `frames`는 태그 1개·기간 1개당 "전 기업의 최종 제출값"을 한 번에 준다. 우리가 쓰는 태그(순이익·자기자본·매출·영업이익·D&A·부채·비영업자산·주식수 등, 폴백 변형 포함)를 태그당 5개년 프레임으로 부른다고 가정하면 대략 **100~200콜로 전 유니버스(5,893종목)를 커버할 수 있었을 것**(추정, 미검증) — 종목당 1콜(현재 5,893콜)보다 극적으로 적다.
- **그러나 이미 실측으로 기각된 경로다**: `docs/REVDCF_SPEC.md`에 STEP838의 최초 판단("수집 경로 = frames 채택")이 **STEP840에서 뒤집혔다**고 명시돼 있다 — *"frames는 횡단면 카운트용이고 개별 값 판정에 못 씀(GE·DE·URI·PEG·ATO가 companyfacts엔 존재)"*. 즉 특정 종목이 `frames`에서 통째로 빠지는 사례가 실측으로 확인됐다. 원인은 `frames`가 "최근 제출된 사실 1건 + 기간 365일±30일에 맞는 것만" 담기 때문(SEC 공식 문서 재확인) — **정정본·53주 결산·비달력 회계연도 기업이 누락**된다. `lib/revdcf/registry.ts`에도 동일 경고가 이미 있다: *"개별 판정에 쓰지 말 것."*
- **설령 커버리지 문제가 없었더라도, 지금은 이미 필요 없다**: STEP995~996이 `companyfacts.zip` 벌크(Range 부분접근)로 **같은 목표(SEC 호출 수 최소화)를 커버리지 손실 없이** 이미 달성했다 — 벌크는 `companyfacts` API와 **같은 원자료**를 주므로(995: 20/20 완전일치 실증) 개별판정 부적합 문제 자체가 없다. `frames`가 풀 수 있었던 문제를 벌크가 더 잘 이미 풀었다.
- **남는 용도**: 개별 판정이 아니라 **횡단면 카운트·교차검증**(예: "이 태그를 보고하는 기업이 총 몇 개인가") — 원래도 이 용도로만 쓰기로 확정돼 있었다(838 재확정).

### 3-2. SEC Financial Statement Data Sets(분기 CSV)가 우리 태그 조립을 대신할 수 있는가?

**판정: 대신할 필요 없다 — 이득이 없고 비용만 있다.**

- 스키마가 다르다(`num`/`pre`/`sub`/`tag` 4개 CSV 관계형 덤프) — 우리 `computeDrivers()`가 바로 못 먹는다. **새 파서가 필요**하다.
- 갱신 주기가 더 느리다(**분기** — 벌크ZIP은 **매일** 밤 3시 ET).
- "as filed" 그대로 제공(가공 없음) — 정정본 처리(우리는 이미 965의 vintage 정책으로 "최신 제출값" 로직을 구현해뒀다)를 **새로 만들어야** 한다. `companyfacts`/벌크ZIP은 이미 이 문제가 없는 형태다.
- 결론: 벌크ZIP이 이미 같은 원자료를 우리 기존 코드가 그대로 소화하는 형태로 준다(995 실증) — 이걸 두고 다른 스키마로 갈아탈 이유가 없다. **교차검증용 후보로는 남는다**(별도 판정 대상, 이번엔 판단 안 함).

### 3-3. 야후 외에 시가총액을 받을 수 있는 곳이 5개 기관 안에 있는가? (미해결 14번 우회)

~~**판정: 있다 — 최소 2개 후보. 미해결 14번(LOCAL_OK_PROD_FAIL) 우회 실험 가치 있음, 단 정의 확인이 먼저다.**~~
🔴 **정정(STEP1019, 2026-08-14) — 후보 5개 전부 소진됐다.** 아래 1(나스닥)은 STEP1017·1018에서 접근 불가로 확정(로컬·프로덕션 모두 timeout, 60초로 늘려도 실패, `robots.txt` disallow), 2(quoteSummary)는 STEP1010에서 이미 사망 처리됐다. 3·4·5는 애초에 후보가 아니었다(개념 다름/데이터 없음/업종 집계뿐). **남은 유일한 길은 카테고리 1(SEC 주식수×종가 자체 조립)**이며, STEP1019가 그 실현 가능성을 처음으로 실측했다 — 결과 = **자체 조립 단독 커버리지 76.2%, 결측 코호트 보완 결합 시에도 96.95%로 97% 게이트에 근소하게 미달**. 상세 = `docs/probe_1019_sec_marketcap_assembly.md`, 카테고리1 서술(아래 §카테고리 표 1번) 갱신.

1. ~~**Nasdaq 스크리너(`api.nasdaq.com/api/screener/stocks`)의 `marketCap` 필드**~~ — 🔴 **정정(STEP1017·1018·1019) — 접근 불가 상태로 확정.** 🔑 **이미 우리 DB에 부분 적재돼 있다**(`us_sector_nasdaq.market_cap`, STEP940에서 섹터 목적으로 적재, 시총 자체는 부산물로 방치됨). 단: (a) 정의 미명시(나스닥이 서버사이드로 미리 계산한 값 — 발행주식수 기준·시점을 우리가 모른다) (b) 지금은 2026-08-08 1회성 스냅샷일 뿐 매일 갱신 안 됨(재수집하면 갱신 가능) (c) 나스닥 자체가 비공식 API라 SLA 없음. 🔴 **STEP1012 실측(2026-08-13) 추가**: 환경차이(284) 코호트 커버리지 **73.2%(208/284)** — 배선 시 예상 커버리지 `(5,601+208)/5,973=97.25%`로 97% 게이트를 넘긴다. 단 겹치는 208건 중 **13.5~20.2%가 야후값과 20% 초과 차이**(보정 전/후), 특히 $0.3B~$2B 구간 22~31%로 소형·중형주에서 정의 불일치 위험이 크다. 이중결측(86)군도 46.5%(40/86) 커버 — 원인 미해석. 재수집 스크립트(`scripts/ingest_us_sector.ts`)는 존재하나 **지금은 로컬 스냅샷 파일만 읽고 라이브 API를 안 때린다**(`:9,31`) — "매일 갱신 가능한 구조"가 되려면 코드 수정 필요. 상세 = `docs/probe_1012_nasdaq_marketcap.md`. **매일 갱신 배선됨(STEP1013, 2026-08-13)** — `lib/nasdaqMarketCap.ts`(라이브 취득) + `us_market_cap_nasdaq`(신규 테이블, `us_market_cap`과 완전 별도) + `app/api/cron/us-perf/route.ts`(22:00 UTC 부속, try/catch 완전 격리). 이 STEP은 재수집만 — `us_market_cap`·게이트에는 아직 안 섞임(폴백 배선은 장은태 판정 이후). D-1 지연 주의(lens-scores 21:30 UTC가 먼저 돎). 상세 = `docs/probe_1013_nasdaq_ingest.md`. 🔴 **STEP1017(2026-08-14) 실측 — 프로덕션 20초 timeout 실패**(`nasdaqError:"rate_limited_or_timeout"`, `nasdaqMs:20003`). 로컬 1회 재현도 동일하게 20,008ms에서 timeout. 🔴 **STEP1018(2026-08-14) 재확인 — 로컬 5가지 방식(timeout 60초·`tableonly=true`·페이지네이션·거래소분할) 전부 timeout.** timeout을 60초로 늘려도 정확히 60,002ms에서 그대로 실패 = 연결 자체가 완결되지 않는 상태(egress 전용 문제로 단정할 근거 약화). 🔴 **STEP1019(2026-08-14) 확인 — `api.nasdaq.com`의 `robots.txt`가 프로그램 접근을 금지**(Cowork WebFetch가 `ROBOTS_DISALLOWED`로 거부됨, 우회 시도 안 함). **결론: 이 후보는 접근 불가로 소진됐다.**
2. **야후 자체의 별도 코드 경로** — 현재 우리가 쓰는 `v7/finance/quote`(배치) 말고 `quoteSummary`(모듈 `price`/`summaryDetail`)가 **독립된 엔드포인트**로 `marketCap`을 준다. 340여 건 결측이 `v7/quote`만의 직렬화 문제라면 이 경로는 살아있을 수 있다(미검증 — 992·984 미해결 14번과 이어지는 별도 실측 필요). 또한 `defaultKeyStatistics.sharesOutstanding × price`로 **파생 계산**도 가능(원천이 다르진 않지만 필드 경로는 다름). ~~미검증~~ → 🔴 **STEP1010이 실측 완료·사망 처리(2026-08-13)**: 환경차이 284건 전수 + 대조군 20건 시험 결과 `quoteSummary`의 `price.marketCap`·`defaultKeyStatistics.sharesOutstanding` 등 프로파일 필드가 **전부 0/284** — `v7/quote`와 완전히 같은 결측(직렬화 문제가 아니라 프로덕션 환경 자체가 프로파일 데이터를 안 줌). **회복 경로 아님**(1010 정정).
3. SEC의 `dei:EntityPublicFloat`는 시가총액과 **다른 개념**(내부자·계열사 보유분 제외)이고 연 1회 갱신 — 실시간 대체재 아님, 완만한 교차검증용.
4. SPDR 홀딩스 파일에는 개별 종목 시총이 없다(펀드의 보유 비중·주식수만) — 후보 아님.
5. Damodaran은 업종 단위 집계만 있음 — 후보 아님.

---

## 기관별 엔드포인트 개수 요약

| 기관 | 전수 확인된 엔드포인트/데이터셋 수 | 우리가 쓰는 수 | 비고 |
|---|--:|--:|---|
| SEC (EDGAR) | 13 | 5(companyfacts·companyconcept·submissions·bulk zip·company_tickers_exchange) | frames는 조회는 하나 개별판정엔 안 씀(횡단검증 전용) |
| Yahoo Finance(비공식) | 25+ 모듈/엔드포인트 | 4(quote·quoteSummary[assetProfile]·chart·fundamentalsTimeSeries) | quoteSummary 자체는 30여 서브모듈 중 1개만 씀 |
| Nasdaq Trader/api.nasdaq.com | 24 | 4(symdir 2개·screener·ipo/dividends calendar) | 대부분 비공식(api.nasdaq.com), symdir 2개만 공식 문서 있음 |
| Damodaran(NYU) | 약 30개 파일(미국 컷 기준, 지역변형 제외) | 8(indname·taxrate·countrytaxrates·wacc·betas·capex·wcdata + totalbeta는 미사용) | ratings.xls·fundgrEB.xls·histimpl.xls가 즉시 검토 후보(아래 §신규 발견 참조) |
| SPDR/State Street | 5개 제품군(섹터ETF·핵심지수ETF·산업ETF·팩터ETF·펀드메타파일) | 1(11개 섹터 ETF 홀딩스) | `spdr-product-data-us-en.xlsx` 마스터 파일 신규 발견(전 SPDR 펀드 메타데이터 1파일) |

---

## 1. SEC (EDGAR)

**공식 문서**: `sec.gov/search-filings/edgar-application-programming-interfaces`(API 목록) · `sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data`(접근 정책) · `sec.gov/data-research/sec-markets-data/financial-statement-data-sets`(분기 데이터셋). **라이선스** = 미국 연방정부 저작물(17 U.S.C. §105) — 퍼블릭 도메인, 저작권 없음. **레이트리밋** = 10 req/s(전 IP·전 기기 합산, 원문 인용: *"Current max request rate: 10 requests/second"*), 초과 시 IP 임시 차단 가능. **User-Agent 필수**(조직명+연락처, 없으면 403).

| 엔드포인트 | URL 패턴 | 무엇을 주는가(필드) | 정의 | 형식 | 크기 | 갱신주기 | 우리가 쓰는가 | 어느 자리 |
|---|---|---|---|---|---|---|---|---|
| companyfacts | `data.sec.gov/api/xbrl/companyfacts/CIK##########.json` | us-gaap·dei 전 태그의 연도별 값(모든 unit) | 기업이 실제 제출한 XBRL 사실 그대로(정정 이력 `accn` 포함) | JSON | 종목당 평균 951KB(995 실측, 미압축) | 실시간(제출 즉시 반영, 처리지연 <1분) | ✅ **값 추출 정본** — route.ts·lib/revdcf/drivers.ts | 순이익·자기자본·매출·영업이익·D&A·부채·비영업자산·주식수 전부 |
| companyconcept | `data.sec.gov/api/xbrl/companyconcept/CIK##########/us-gaap/{tag}.json` | 단일 기업·단일 개념의 전 unit별 값 | companyfacts의 부분집합(태그 1개) | JSON | 작음 | 실시간 | 부분(구 probe 스크립트) | 위와 동일(단일태그 조회용) |
| frames | `data.sec.gov/api/xbrl/frames/{ns}/{tag}/{unit}/CY####[Q#][I].json` | 태그 1개·기간 1개의 **전 기업** 최종 제출값 | "가장 최근 제출된 사실 1건" + 기간 365일±30일(연간)/91일±30일(분기) 정합 | JSON | 태그·기간별 상이(작음) | 실시간 | ✅ **횡단면 카운트·교차검증 전용**(개별판정 금지, §3-1 참조) | 유니버스 커버리지 측정용(값 추출엔 안 씀) |
| submissions | `data.sec.gov/submissions/CIK##########.json` | 제출이력·현재상호·구상호·거래소·티커 | 기업 메타데이터(SIC 포함) | JSON | 종목당 수십~수백KB | 실시간(<1초 지연) | ✅ 8-K 피드(lib/eightK.ts)·구 probe | 섹터(SIC 보조)·8-K 이벤트 |
| companyfacts.zip(벌크) | `sec.gov/Archives/edgar/daily-index/xbrl/companyfacts.zip` | companyfacts 전체(20,200개 CIK) | 위와 동일(같은 원자료) | ZIP(내부 JSON) | 1.4GB 압축·19.2GB 압축해제(995 실측) | **매일 03:00 ET** | ✅ **STEP995~996 도입** — Range 부분접근 | 위와 동일, 전 유니버스 |
| submissions.zip(벌크) | `sec.gov/Archives/edgar/daily-index/bulkdata/submissions.zip` | submissions 전체 | 위와 동일 | ZIP(내부 JSON) | 미측정(이번 STEP 범위 밖) | 매일 03:00 ET | ❌ 미사용(개별 API로 충분한 빈도) | 섹터·메타 확장 후보 |
| Financial Statement Data Sets | `sec.gov/data-research/sec-markets-data/financial-statement-data-sets` | 재무제표 표면 숫자(num·pre·sub·tag 4개 CSV) + SIC | "as filed" 그대로(정정본 별도 처리 안 됨), 원문 인용: *"presented without change from the as filed financial reports"* | ZIP(CSV) | 미측정 | **분기**(다음 분기 게시에 반영) | ❌ 미사용(§3-2에서 불필요 판정) | 값 추출 대안(비권장) |
| Financial Statement and Notes Data Sets | `sec.gov/data-research/sec-markets-data/financial-statement-notes-data-sets` | 위보다 넓음(주석 전체 포함) | 위와 동일 원칙 | ZIP(CSV) | 미측정(더 큼) | **월별**(2023-04~) | ❌ 미사용 | 주석 상세 추출 후보(미검토) |
| company_tickers.json | `sec.gov/files/company_tickers.json` | 티커↔CIK(거래소 정보 없음) | SEC 자체 매핑 | JSON | 작음 | 매일 갱신(last-modified 확인) | ❌(exchange 버전 사용) | CIK 매핑 |
| company_tickers_exchange.json | `sec.gov/files/company_tickers_exchange.json` | 티커↔CIK↔거래소 | 위 + 거래소 | JSON | 작음(10,432행) | 매일 갱신(실측 확인) | ✅ **us_cik_map 정본** | CIK 매핑 |
| Full Text Search API | `efts.sec.gov/LATEST/search-index?q=...&forms=...` | 제출문서 전문검색(스니펫·CIK·양식·날짜) | 색인된 전문검색(2001~) | JSON | 쿼리당 소량 | 실시간 | ❌ 미사용 | 특정 키워드(소송·정정 공시 등) 탐지 후보 |
| EDGAR daily/full index | `sec.gov/Archives/edgar/daily-index/`·`full-index/` | 그날/그분기 전 제출 목록(CIK·회사명·양식·날짜·파일경로) | SEC 색인 그대로 | TXT/CSV/JSON | 일별 소량 | 매일 | ❌ 미사용 | "오늘 뭐가 제출됐나" 피드 후보 |
| Public Dissemination Service(PDS) | 별도 유료 실시간 피드 | 제출 즉시 원문 스트림 | — | — | — | 유료(구독) | ❌ 미사용(비용) | 실시간성 극대화 후보(비용 이슈) |

**🔑 신규 발견**: 없음(SEC는 이미 993·995에서 충분히 파악됨). 이번엔 companyfacts.zip 채택 후 정합성 재확인 + Financial Statement (Notes) Data Sets·Full Text Search·EDGAR index·PDS를 명시적으로 "안 쓰는 이유"까지 기록한 것이 이번 STEP의 몫.

---

## 2. Yahoo Finance (비공식 — 공식 문서 없음)

🔴 **공식 문서 자체가 없다.** `yahoo-finance2`(이미 보유 라이브러리) 소스코드·응답 필드에서 직접 확인. **정의(基準) 칸은 사실상 전부 "미명시"** — 이 사실 자체를 표에 남긴다(CLAUDE.md 규칙 5-1: 원전 없는 항목은 정의 공개표로 대체).

**인증**: crumb+cookie(라이브러리가 자동 획득, `finance.yahoo.com`→`guce.yahoo.com` 동의 리다이렉트→`v1/test/getcrumb`) — API 키 아님, 깨지기 쉬움(2023·2024 각각 흐름 변경 이력). **레이트리밋**: 공식 미공개, 커뮤니티 보고 시간당 약 360콜에서 429 시작. **비용**: 무료.

| 엔드포인트/모듈 | 주요 필드 | 정의 | 형식 | 갱신주기 | 우리가 쓰는가 | 어느 자리 |
|---|---|---|---|---|---|---|
| `quote()`(`v7/finance/quote`) | marketCap·sharesOutstanding·regularMarketPrice·trailingPE·priceToBook 등 | marketCap 계산기준 미명시(shares×price로 추정) | JSON | 실시간/15분지연 | ✅ **us_market_cap 정본**(배치) | 시총·주가·주식수 |
| `quoteSummary(assetProfile)` | sector·industry·주소·임원·리스크점수 | 자체 분류(GICS 아님, 매핑표 없음) | JSON | 비정기 | ✅ **섹터 3순위**(lib/sector.ts) | 섹터 |
| `quoteSummary(summaryDetail)` | marketCap·beta·trailingPE·dividendYield 등 | v7/quote와 **별도 코드경로** | JSON | 실시간/일별 | ❌ 미사용 | 🔑 **시총 대체경로 후보**(§3-3) |
| `quoteSummary(defaultKeyStatistics)` | sharesOutstanding·floatShares·bookValue·enterpriseValue·pegRatio | 미명시 | JSON | 분기 갱신 | ❌ 미사용 | 🔑 **주식수 독립 소스**(시총 파생계산 후보) |
| `quoteSummary(price)` | marketCap·regularMarketPrice·exchange | 미명시 | JSON | 실시간 | ❌ 미사용 | 시총·주가 대체경로 |
| `quoteSummary(financialData)` | totalCash·totalDebt·totalRevenue·ebitda·margins·FCF | TTM 기준(정확한 기준일 미명시) | JSON | 분기 | ❌ 미사용(SEC가 정본) | 재무 교차검증 후보 |
| `quoteSummary(incomeStatementHistory[Quarterly])` | 매출·매출원가·매출총이익·영업비용·영업이익·순이익 | 정정 반영 여부 미명시 | JSON | 분기/연 | ❌ 미사용 | 손익 교차검증 |
| `quoteSummary(balanceSheetHistory[Quarterly])` | 총자산·총부채·자기자본·현금·부채 | 미명시 | JSON | 분기/연 | ❌ 미사용 | 재무상태 교차검증 |
| `quoteSummary(cashflowStatementHistory[Quarterly])` | 영업현금흐름·CapEx·FCF·배당지급 | 미명시 | JSON | 분기/연 | ❌ 미사용 | 현금흐름 교차검증 |
| `quoteSummary(earnings)` | 분기 실적 실제vs추정·연간차트 | 추정치 출처 미명시 | JSON | 분기 | ❌ 미사용 | 어닝서프라이즈(과거 SUE 검토에서 이미 기각된 방향) |
| `quoteSummary(earningsHistory)` | EPS 실제·추정·서프라이즈% | 미명시 | JSON | 분기 | ❌ 미사용 | 상동 |
| `quoteSummary(earningsTrend)` | 향후 분기·연도 애널리스트 컨센서스(성장률·추정치) | 컨센서스 기여자 수 미명시 | JSON | 주간 갱신 | ❌ 미사용 | 🔑 **역DCF 성장경로(층5) 후보** — 컨센서스 부재가 "가장 큰 구멍"이었음 |
| `quoteSummary(recommendationTrend)` | 매수/보유/매도 등급 카운트(월별) | 미명시 | JSON | 월별 버킷 | ❌ 미사용 | 해당없음(추천 안 함 원칙과 충돌) |
| `quoteSummary(upgradeDowngradeHistory)` | 등급 변경 이력 | 미명시 | JSON | 이벤트성 | ❌ 미사용 | 해당없음 |
| `quoteSummary(insiderHolders/insiderTransactions)` | 내부자 보유·거래 내역 | Form4 기반(지연 미명시) | JSON | 이벤트성 | ❌ 미사용 | 소유구조 신호 후보 |
| `quoteSummary(institutionOwnership/fundOwnership/majorHoldersBreakdown)` | 기관·펀드 보유비율 | 13F 기반(법정 45일 지연) | JSON | 분기 | ❌ 미사용 | 소유구조 신호 후보 |
| `quoteSummary(netSharePurchaseActivity)` | 내부자 순매수/매도 | 미명시 | JSON | 분기/반기 | ❌ 미사용 | 소유구조 신호 |
| `quoteSummary(calendarEvents)` | 실적발표일·배당락일 | 미명시 | JSON | 확정시 갱신 | ❌ 미사용 | 이벤트 캘린더 후보 |
| `quoteSummary(secFilings)` | EDGAR 제출 목록(직접 링크) | SEC 색인 패스스루 | JSON | 이벤트성 | ❌ 미사용 | SEC 원문 링크 보조 |
| `quoteSummary(quoteType)` | 증권유형·거래소·최초거래일 | 미명시 | JSON | 정적 | ❌ 미사용 | 증권유형 게이트 |
| `quoteSummary(topHoldings/fundProfile/fundPerformance)` | 펀드 전용(ETF 보유내역·수익률) | 미명시 | JSON | 주기적 | ❌ 미사용 | 해당없음(개별주 전용 제품) |
| `chart()`(`v8/finance/chart`) | OHLCV 시계열·분할/배당 이벤트 | adjclose 조정방식 미명시 | JSON | 분~일 단위 | ❌ 미사용 | 가격 히스토리(현재 us_stock_perf가 별도 소스) |
| `fundamentalsTimeSeries()` | annual/quarterly/trailing 접두 재무 시계열 | quoteSummary 재무모듈과 같은 원자료, 시계열 형태만 다름 | JSON | 분기/연 | ✅ **일부 사용**(코드 확인) | 재무 시계열 |
| `options()` | 옵션체인(행사가·IV·미결제약정) | 미명시 | JSON | 실시간/지연 | ❌ 미사용 | 해당없음(범위 밖) |
| `screener()` | 15개 고정 스크린(day_gainers 등)만, 스크린당 종목별 marketCap 등 100여 필드 | quote와 동일 필드셋, 사전정의 목록만 | JSON | 실시간 재랭킹 | ❌ 미사용 | ⚠️ **전 유니버스 대체 불가**(고정 15개 목록만, 임의 종목 조회 안 됨) |
| `trendingSymbols()` | 지역별 인기 심볼 목록(값 없음) | — | JSON | 실시간 | ❌ 미사용 | 해당없음 |
| `esgScores` | (라이브러리 이슈 #952 — **현재 미제공/제한됨**) | N/A | N/A | N/A | ❌ 불가 | 해당없음 |

**🔑 신규 발견 — 즉시 검토 가치**: ① `quoteSummary(price/summaryDetail)`가 `v7/quote`와 **별도 코드경로**로 marketCap을 줌 — 미해결 14번(340여 건 결측이 v7 전용 버그라면 이 경로가 살아있을 수 있음, 미검증) ② `defaultKeyStatistics.sharesOutstanding`가 독립 주식수 소스라 시총 파생계산(주식수×주가) 가능 ③ `earningsTrend`의 컨센서스 성장률이 역DCF 성장경로(층5, 명시적으로 "가장 큰 구멍") 후보일 수 있음(단 컨센서스 기여자 수·품질 미명시라 신중 검토 필요).

---

## 3. Nasdaq Trader / api.nasdaq.com

**공식 문서 있는 것**: `nasdaqtrader.com/trader.aspx?id=symboldirdefs`(심볼 디렉터리 필드 정의 — 진짜 공식) · `nasdaqtrader.com/Trader.aspx?id=ShortInterest`(공매도 잔고, 유료 SFTP). **공식 문서 없는 것**: `api.nasdaq.com/*` 전부(nasdaq.com 웹사이트의 비공식 백엔드, 커뮤니티 역공학) — Origin/Referer 헤더로 브라우저 흉내(진짜 인증 아님). **레이트리밋**: 전부 미명시. **비용**: symdir·screener·api.nasdaq.com 전부 무료, 공매도 SFTP만 유료.

| 엔드포인트 | 필드 | 정의 | 형식 | 공식여부 | 갱신 | 우리가 쓰는가 | 어느 자리 |
|---|---|---|---|---|---|---|---|
| `nasdaqtrader.com/dynamic/symdir/nasdaqlisted.txt` | Symbol·Security Name·Market Category·Test Issue·**Financial Status**·Round Lot·ETB | Financial Status 원문: *"Indicates when an issuer has failed to submit its regulatory filings on a timely basis, has failed to meet Nasdaq's continuing listing standards, and/or has filed for bankruptcy"*(D/E/Q/N 등 코드) | 파이프구분 TXT | ✅ 공식 | 매일 | ✅ **유니버스 정본**(scripts/refresh_us_symbols.ts) | 유니버스·🔑 **상장폐지 위험 플래그 후보**(현재 미사용) |
| `nasdaqtrader.com/dynamic/symdir/otherlisted.txt` | ACT Symbol·Exchange·CQS Symbol·**ETF**·Round Lot·Test Issue | ETF = 자체신고 분류(발행사 제출 기준, 보유구조 기반 아님) | 파이프구분 TXT | ✅ 공식 | 매일 | ✅ 유니버스 정본 | 유니버스·ETF 필터 |
| 공매도잔고(SFTP) | 종목별 공매도 주식수·결제일·평균거래량·상환일수 | 반월 결제일 기준, 공식 정의페이지 존재 | CSV(SFTP) | ✅ 공식(정의만) | 반월 | ❌ **유료라 미사용** | 공매도 신호 후보(비용 이슈) |
| `api.nasdaq.com/api/screener/stocks` | symbol·name·sector·industry·country·ipoyear·**marketCap** | marketCap = 나스닥 서버사이드 사전계산(정의 미명시) | JSON | ❌ 비공식 | 취득시각 기준(응답에 as_of 없음) | ✅ **섹터 3순위 재료**(us_sector_nasdaq) | 섹터·🔑 **시총 대체경로 후보**(§3-3) |
| `api.nasdaq.com/api/quote/{symbol}/info` | 현재가·매수/매도호가·거래량·52주 고저 | 미명시 | JSON | ❌ 비공식 | 실시간 성격 | ❌ 미사용 | 가격 대체경로 |
| `api.nasdaq.com/api/quote/{symbol}/summary` | marketCap(서버계산)·섹터·업종·배당수익률·거래량 | 미명시 | JSON | ❌ 비공식 | 실시간 성격 | ❌ 미사용 | 시총·섹터 대체경로(screener와 중복) |
| `api.nasdaq.com/api/quote/{symbol}/historical` | 일별 OHLCV | 미명시(1개월 미만 구간 조회 시 빈 응답 버그 보고됨) | JSON | ❌ 비공식 | 일별 | ❌ 미사용 | 가격 히스토리 |
| `api.nasdaq.com/api/quote/{symbol}/dividends` | 배당락일·배당액·수익률·이력 | 미명시 | JSON | ❌ 비공식 | 이벤트성 | ❌ 미사용(캘린더는 별도 엔드포인트 사용중) | 배당 상세(현재 캘린더만 사용) |
| `api.nasdaq.com/api/quote/{symbol}/eps` | EPS 이력 | 미명시 | JSON | ❌ 비공식 | 분기 | ❌ 미사용 | 실적 히스토리 |
| `api.nasdaq.com/api/quote/{symbol}/option-chain` | 옵션체인 | 미명시 | JSON | ❌ 비공식 | 실시간 성격 | ❌ 미사용 | 범위 밖 |
| `api.nasdaq.com/api/quote/{symbol}/short-interest` | 공매도 잔고(반월 포인트) | 🔑 **유료 SFTP의 무료 비공식 미러로 추정**(정의 신뢰도 미검증) | JSON | ❌ 비공식 | 반월(추정) | ❌ 미사용 | 공매도 신호(무료 대체 후보) |
| `api.nasdaq.com/api/company/{symbol}/company-profile` | 사업설명·주소·임원 | 미명시 | JSON | ❌ 비공식 | 비정기 | ❌ 미사용 | 회사개요 |
| `api.nasdaq.com/api/company/{symbol}/financials` | 손익·재무상태·현금흐름(분기/연) | 🔴 필드-GAAP 매핑 완전 미확인(가장 신뢰도 낮음) | JSON | ❌ 비공식 | 분기/연 | ❌ 미사용 | 재무 대체경로(비권장, SEC 대비 신뢰도 낮음) |
| `api.nasdaq.com/api/company/{symbol}/revenue` | 매출 세부 | 미명시 | JSON | ❌ 비공식 | 분기/연 | ❌ 미사용 | 상동 |
| `api.nasdaq.com/api/company/{symbol}/earnings-surprise` | 과거 EPS 서프라이즈 | 미명시 | JSON | ❌ 비공식 | 분기 | ❌ 미사용 | SUE류(기각된 방향) |
| `api.nasdaq.com/api/company/{symbol}/insider-trades` | 내부자 거래내역 | Form4 추정(미확인) | JSON | ❌ 비공식 | 이벤트성 | ❌ 미사용 | 소유구조 신호 |
| `api.nasdaq.com/api/company/{symbol}/institutional-holdings` | 기관보유 요약·개별 기관명·보유주식·평가액 | 🔴 **회사 전체 발행주식수 필드 없음**(보유자별 절대주식수만) | JSON | ❌ 비공식 | 분기(13F 추정) | ❌ 미사용 | 소유구조(발행주식수 소스 아님, §3-3 관련 부정 결과) |
| `api.nasdaq.com/api/company/{symbol}/sec-filings` | 제출목록(양식·날짜·링크) | SEC 색인 미러 | JSON | ❌ 비공식 | 이벤트성 | ❌ 미사용(SEC 원본 우선) | 해당없음 |
| `api.nasdaq.com/api/analyst/{symbol}/earnings-date` | 다음 실적발표일 | 미명시 | JSON | ❌ 비공식 | 실적 전 갱신 | ❌ 미사용 | 이벤트 캘린더 |
| `api.nasdaq.com/api/analyst/{symbol}/earnings-forcast` | 애널리스트 EPS·매출 추정 | 출처·방법론 미명시 | JSON | ❌ 비공식 | 주기적 | ❌ 미사용 | 컨센서스 후보(원전대조 불가라 채택 어려움) |
| `api.nasdaq.com/api/analyst/{symbol}/ratings` | 매수/보유/매도 집계 | 미명시 | JSON | ❌ 비공식 | 주기적 | ❌ 미사용 | 해당없음(추천 안 함 원칙) |
| `api.nasdaq.com/api/analyst/{symbol}/targetprice` | 목표주가(평균/고/저) | 미명시 | JSON | ❌ 비공식 | 주기적 | ❌ 미사용 | 해당없음 |
| `api.nasdaq.com/api/calendar/earnings` | 그날 실적발표 예정 종목 | 미명시 | JSON | ❌ 비공식 | 매일 | ❌ 미사용 | 실적 캘린더 |
| `api.nasdaq.com/api/calendar/splits` | 그날 액면분할 예정 | 미명시 | JSON | ❌ 비공식 | 매일 | ❌ 미사용 | 주식수 연속성 보정 후보 |
| `api.nasdaq.com/api/ipo/calendar` | IPO 예정·최근 상장 | 미명시 | JSON | ❌ 비공식 | 매일 | ✅ **이미 사용**(app/api/ipo/us-feed) | IPO 피드 |
| `api.nasdaq.com/api/calendar/dividends` | 그날 배당락 종목 | 미명시 | JSON | ❌ 비공식 | 매일 | ✅ **이미 사용**(app/api/dividends/us-feed) | 배당 피드 |

**🔑 신규 발견**: ① `nasdaqlisted.txt`의 **Financial Status 플래그**(공식 정의 있음, D=Deficient·Q=Bankrupt 등)를 우리가 지금 안 씀 — 상장폐지·부실 위험 신호로 즉시 활용 가능한 후보 ② `/api/quote/{symbol}/short-interest`가 유료 공식 상품의 무료 비공식 미러로 추정됨(신뢰도 미검증이나 비용 0으로 공매도 데이터 확보 가능) ③ **`institutional-holdings`에 발행주식수 총계가 없다는 것을 확인** — 즉 나스닥은 발행주식수 독립 소스가 못 됨(marketCap은 서버 사전계산값만 가능, §3-3에 반영).

---

## 4. Damodaran (NYU Stern)

**공식 페이지**: `pages.stern.nyu.edu/~adamodar/New_Home_Page/datacurrent.html`(현재 데이터 목록, 1차 출처) · `.../datahistory.html`(갱신정책, 원문 인용: *"I update **most** of the data only once a year, in the first two weeks of January"*). **라이선스**: 명시적 라이선스 문구 없음(학술 공개 자료, 실무상 광범위 인용·활용됨) — 무료·키 불필요. **구조**: 거의 모든 데이터셋이 **미국+7개 지역변형**(Europe·Japan·Australia/NZ/Canada·Emerging·China·India·Global)으로 8중 발행 — 이 표는 **미국 파일명만** 적는다.

🔴 **갱신주기는 기관 단위가 아니라 파일 단위로 적는다(1002 추가지시, STEP1001 발견 반영).** 위 원문 자체가 "**most**"라고 명시했는데 997·998이 "Damodaran = 연1회"로 일반화해 파일마다 실제 확인하지 않고 적용했다 — 그 결과 `histimpl.xls`(연간)를 "월별 갱신 포함"으로 잘못 등재하는 오류가 났다(아래 표에서 정정). **실측(1001, HTTP `Last-Modified` 직접 대조)**: `wacc.xls`=2026-01-12 이후 **7개월+ 정체** vs `ERPbymonth.xlsx`=2026-08-01(월 1회 갱신 확인) — **같은 기관 안에서도 파일마다 갱신 주기가 다르다.** 이 표의 "갱신" 칸은 이제부터 원전 페이지 서술이 아니라 **개별 파일의 실측(Last-Modified 또는 내부 데이터 날짜)**을 우선한다.

이미 쓰는 8개(기존 registry.ts 그대로, 반복 생략): `indname.xls`·`taxrate.xls`·`countrytaxrates.xls`·`wacc.xls`·`betas.xls`·`capex.xls`·`wcdata.xls`·`totalbeta.xls`(미사용).

### 신규 발견 — 마진·수익성

| 파일 | 내용 | 정의 | 어느 자리(미사용 후보) |
|---|---|---|---|
| `margin.xls` | 업종별 매출총이익률·영업이익률·순이익률 | 94업종 집계, 시점 = 연1회 갱신 시점 | 마진 벤치마크(fade 목표치 후보) |
| `roe.xls` | 업종별 ROE 분해(마진×회전율×레버리지)·ROC/ROIC | 듀폰 분해 | ROIC 벤치마크(성장률=ROIC×재투자율 공식과 연결) |
| `EVA.xls` | 업종별 EVA($)·자기자본EVA($) | NOPAT − 자본비용×투하자본 | 미사용(가치창출 진단용, DCF 입력 아님) |

### 신규 발견 — 배수(Multiples)

| 파일 | 내용 | 정의 | 어느 자리 |
|---|---|---|---|
| `pedata.xls` | 업종별 트레일링/포워드 PE·PEG·기대성장률 | 시점 스냅샷(1월 갱신) | 업종 배수 벤치마크(Q1 교차검증) |
| `pbvdata.xls` | 업종별 P/BV·EV/BV·ROE | 시점 스냅샷 | 업종 배수(PBR 교차검증) |
| `psdata.xls` | 업종별 P/S·EV/S·마진 | 시점 스냅샷 | 업종 배수(PSR 교차검증) |
| `vebitda.xls` | 업종별 EV/EBIT·EV/EBITDA | 시점 스냅샷 | 🔑 업종 배수(EV/EBITDA 교차검증 — 역DCF 산출 NOPAT/EBITDA와 직결) |
| `mktcapmult.xlsx` | 시총 구간별(업종 아닌 규모별) 배수 | 규모 10분위 | 미사용(대안 분류축) |
| `countrystats.xls` | 국가별 배수 평균 | 국가 단위 | 미사용(US 단독 정책과 무관) |

### 신규 발견 — 자본비용·위험

| 파일 | 내용 | 정의 | 어느 자리 |
|---|---|---|---|
| `histretSP.xls` | 주식/국채/T-bill/부동산 연간수익률(1928~) | 실현 수익률 시계열 | 무위험수익률·ERP의 역사적 기초자료(현재 wacc.xls 상단값의 원천 추정) |
| `histimpl.xls` | 🔴 **정정(1002, 1001 발견 반영) — 연간뿐, "월별 갱신 포함"은 오류였다.** 내재 ERP 시계열(1960~, 연 1행 추가·연 1회 갱신). S&P500 DDM/DCF 역산 내재 ERP — **역사적(realized) ERP가 아니라 시장 내재치** | ~~ERP 대안(자주 갱신)~~ — **아래 `ERPbymonth.xlsx`가 진짜 월간 파일**(1001 발견, 998이 놓쳤던 별도 파일) |
| 🔑 **`ERPbymonth.xlsx`**(1001 발견, `/pc/implprem/ERPbymonth.xlsx`) | rf·ERP **월간** 페어 시계열(2008-09~, 매월 1행) — `T.Bond Rate`(raw)와 `$ Riskfree Rate`(Damodaran 자체조정 계열) 두 rf가 같은 행에, ERP 5변형도 같은 행에. 🔴 **정정(1003) — 산식은 공개돼 있다.** `$ Riskfree Rate = T.Bond rate − 해당등급 디폴트스프레드`(Moody's 2025-05-16 미국 Aaa→Aa1 강등에 대한 Damodaran의 대응, "Sovereign Ratings, Default Risk and Markets" 2025-06 블로그 원문 확인) | 우리 저장값(rf=0.0395·erp=0.0446, as_of 2026-01)이 이 파일 2026-01행의 `$ Riskfree Rate`·`ERP(T12m)with adj riskfree rate`와 정확 일치 — **Damodaran이 실제로 쓰는 값의 원천이 이것**. 단 Damodaran 자신의 요약시트는 raw T.Bond Rate+plain ERP(T12m) 조합을 더 눈에 띄게 제시(1003 발견, 다른 조합) | 🔑 **#14/#15 즉시이득 최우선 후보 — 1003에서 구현 완료(미배선)**(아래 즉시이득표 1번 참조) |
| `ctryprem.xlsx`(+연중 복수판) | 국가별 디폴트스프레드·ERP·컨트리리스크프리미엄(150여개국) | 국가신용등급 기반 | 🅿️ 파킹(비US 확장용, 지금 안 씀) |
| `ratings.xls` | 신용등급대별 이자보상배율 구간·스프레드(대형/소형 별도표) | 🔑 다모다란 자신의 WACC 모델이 쓰는 "합성등급" 룩업테이블 | 🔑 **종목별 부채비용 산출 후보** — 현재 업종평균 WACC 대신 기업별 이자보상배율로 개별 신용스프레드 추정 가능 |
| `mktcaprisk.xlsx` | 시총 구간별 베타·변동성 | 규모 10분위 | 미사용(대안 분류축) |

### 신규 발견 — 성장률

| 파일 | 내용 | 정의 | 어느 자리 |
|---|---|---|---|
| `fundgr.xls` | 업종별 EPS 기대성장률 | = ROE×유보율(공식 산출, 컨센서스 아님) | 성장률(EPS 기준) |
| `fundgrEB.xls` | 업종별 EBIT 기대성장률 | 위와 동일 로직을 EBIT에 적용 | 🔑 **역DCF 성장경로(층5) 후보** — "컨센서스 없음"이 가장 큰 구멍이었는데, 이건 컨센서스가 아니라 다모다란 자신의 공식산출 비컨센서스 성장률이라 우리 "과거추세" 원칙과 결이 맞음. NOPAT 기반 모델과도 EBIT이라 더 부합 |
| `histgr.xls` | 업종별 과거 5/10년 실현 이익성장률(CAGR) | 후행 실현치 | 성장률 교차검증(우리 Q3 층의 업종 벤치마크) |

### 신규 발견 — 자본구조·배당·기타(미사용, 진단용)

| 파일 | 내용 | 후보 여부 |
|---|---|---|
| `debtdetails.xls` | 부채 구성(고정/변동, 담보/무담보, 만기) | 부채 구성요소 세분화 후보(현재는 단일 부채 잔액만 사용) |
| `leaseeffect.xls` | 운용리스 자본화 조정 | ASC842 도입 이후 대부분 이미 재무제표 내 반영돼 유용성 감소 추정 |
| `R&D.xls` | R&D 지출/매출 비율 | 🔑 R&D 자본화 조정(등록부에 이미 "미검토·미배선" 이슈로 있던 항목) |
| `divfcfe.xls`·`divfund.xls`·`inshold.xls`·`goodwill.xls`·`finflows.xls`·`Employee.xls`·`DollarUS.xls`·`MktCap.xls`·`macro.xls`·`macrodur.xls`·`optvar.xls` | (각각 배당정책·소유구조·영업권·자금조달·인당지표·달러표시 업종총계·업종시총·거시변수·옵션변동성) | 대부분 미사용, 밸류에이션 핵심 슬롯과 직결 안 됨(문서에 개별 기재, 표는 위 §신규발견 5절 원문 참조) |

**🔑 즉시 검토 가치 상위 4개**(원전 대조표 절차 전제, 이번 STEP은 판정 아님): `ratings.xls`(종목별 부채비용) · `fundgrEB.xls`(성장경로 층5 후보) · `histimpl.xls`(내재 ERP) · `vebitda.xls`/`pedata.xls`(배수 교차검증).

---

## 5. SPDR / State Street Global Advisors

**공식 페이지**: 개별 ETF 상품페이지(예: `ssga.com/us/en/intermediary/etfs/state-street-spdr-sp-500-etf-trust-spy`) · 홀딩스 파일 자체(자기 설명적). **라이선스 — 🔴 확인 필요**: 홀딩스 XLSX 파일 내부에 직접 명시된 문구: *"The whole or any part of this work may not be reproduced, copied or transmitted or any of its contents disclosed to third parties without SSGA's express written consent."* — 우리가 이 데이터에서 **파생시킨 섹터 라벨을 내부적으로 쓰는 것**과 **원본 홀딩스 표 자체를 재배포하는 것**은 다른 행위이나, 그 경계가 별도로 명문화돼 있지 않음(법무 검토 필요 항목으로 등재).

| 제품군 | 예시 티커 | 무엇을 추종 | 홀딩스 파일 확인 | 정의 | 형식 | 갱신 | 우리가 쓰는가 | 어느 자리 |
|---|---|---|---|---|---|---|---|---|
| 섹터 Select ETF(11개) | XLK·XLF·XLV 등 | S&P 500 GICS 11섹터 | ✅ 사용중 | 일별 보유종목·비중·섹터 라벨 | XLSX | 매일("As of" 자기표기 확인) | ✅ **GICS 진짜 정답지**(939) | 섹터 |
| 핵심지수 ETF | SPY(S&P500)·MDY(S&P400) | 대형/중형주 벤치마크 | ✅ SPY 직접 확인(504종목) | 위와 동일 스키마 | XLSX | 매일 | ❌ 미사용 | 🔑 커버리지 확장 후보(S&P500 넘어서는 확장은 안 됨, SPY 자체가 S&P500) |
| 산업 ETF(섹터보다 세분) | KBE(은행)·KRE(지방은행)·XHB(주택건설)·XBI(바이오)·XSD(반도체) | S&P Select Industry Indices | ✅ KBE 직접 확인(103종목) | Sector 컬럼은 **여전히 대분류 GICS**(세분류는 "어느 ETF에 속하는가"로만 판별 가능) | XLSX | 매일 | ❌ 미사용 | 🔑 서브인더스트리 근사 후보(간접적) |
| 팩터 ETF | SPYV/SPYG(가치/성장)·MDYV/MDYG(중형가치/성장)·ONEV·ONEY·QUS | 가치·성장·저변동성·수익률·품질 팁트 | ✅ MDYV 직접 확인, 나머지 패턴만 확인 | 팩터 정의(지수사 기준) | XLSX | 매일 | ❌ 미사용 | 미사용(팩터 렌즈와 잠재 연결 가능하나 이번 범위 밖) |
| Kensho 테마 ETF | (Intelligent Structures 등) | Kensho 자체정의 테마지수(GICS 아님) | 미확인 | — | XLSX(추정) | 매일(추정) | ❌ 미사용 | 미사용(GICS 대체재 아님) |
| 🔑 **전체 SPDR 펀드 메타데이터**(신규 발견) | `spdr-product-data-us-en.xlsx` | 약 253개 SPDR 상품 전체 1파일 | ✅ 직접 확인·파싱 | Ticker·ISIN·만기비용비율·**AUM(Total Net Assets)**·**주식수(Shares Outstanding)**·**시가총액가중평균(Weighted Average Market Cap)**·P/E·P/B 등 | XLSX | 매일(추정) | ❌ 미사용(이번에 처음 발견) | 펀드 레벨 메타(개별종목 시총 아님 — 펀드 전체 지표) |

**핵심 한계(재확인)**: 홀딩스 파일에는 **개별 종목의 시가총액·발행주식수가 없다**(펀드의 "보유 주식수"·"비중"만 있음 — 펀드 관점 데이터이지 종목 관점 데이터가 아님). §3-3의 시총 대체 후보에서 SPDR은 제외되는 이유가 이것으로 재확인됨.

**🔑 신규 발견**: ① 섹터 ETF 패턴이 **최소 SPY·KBE·MDYV 3개 다른 상품에서도 동일하게 작동**함을 직접 fetch로 확인(즉 11개 섹터ETF 전용이 아니라 SPDR 전 상품군에 적용되는 일반 엔드포인트) ② 산업 ETF(KBE 등)로 서브섹터(은행 vs 지방은행 등) 근사 가능성 ③ 라이선스 문구를 이번에 처음 원문으로 확인 — 법무 검토 대상으로 등재.

---

## §1-B. 동종 US 서비스가 이 조합을 어떻게 쓰는가 (3곳 + 보충)

🔴 US 한정. 조사 결과: **"SEC XBRL 원문 + Damodaran 업종 벤치마크"를 동시에 쓰는 서비스는 확인된 3곳 중 사실상 없다** — 이 조합 자체가 드물다.

| 서비스 | SEC 원문 직접 사용? | Damodaran 사용? | 어떻게 조합하는가 |
|---|---|---|---|
| **Simply Wall St** | ❌ (S&P Global Market Intelligence가 정규화한 것을 씀) | ❌ | 펀더멘털=S&P Global, 가격=ICE — 원문 XBRL 미접촉 |
| **stockanalysis.com** | ❌ (S&P Global·Fiscal AI 이원화) | ❌ | 데이터 종류별로 벤더를 따로 명시(펀더멘털·가격·애널리스트·기업행동·ETF보유 전부 별도 벤더) — "카테고리별 벤더 분리"가 이들의 패턴 |
| **Finbox** | ❌ (S&P Global 정규화) | ✅ **유일하게 확인된 SEC+Damodaran 병존 사례** | 단, **같은 화면에 병치할 뿐 하나의 계산 파이프라인으로 융합하지 않음**(Damodaran 자본비용 테이블을 별도 탭/섹션으로 노출) |

**보충 확인**: `GeminIQ`(신생 서비스)는 "원문 SEC XBRL 직접 사용"을 **경쟁사(GuruFocus·Finbox 등이 전부 벤더 정규화 데이터를 쓴다는 것)에 대한 차별점**으로 마케팅하고 있으나, Damodaran류 업종 벤치마크 통합은 없음. `OpenBB`(오픈소스)는 SEC 전용 공식 확장(`openbb-sec`)은 있으나 Damodaran 확장은 미확인.

🔑 **결론**: 우리 조합("원문 SEC XBRL + Damodaran 학술 업종 벤치마크 + Nasdaq 심볼/스크리너 + Yahoo 시세")은 확인된 범위에서 **업계에 흔한 패턴이 아니다** — 대다수는 벤더 정규화 데이터(S&P Global 등)로 SEC를 우회하고, Damodaran을 실제로 쓰는 곳은 찾은 것 중 1곳뿐이며 그마저 병치일 뿐 융합이 아니다.

---

## 부록 — 3중 규칙 처리

🔴 **①-A(공식문서 3회 이상)**: SEC(공식페이지 2곳 직접 curl + 3rd-party 종합 1회) · Nasdaq(공식 심볼정의 페이지 1곳 — 나머지는 비공식이라 "공식문서 없음"이 곧 조사결과) · Damodaran(공식 데이터페이지 3곳: datacurrent·databreakdown·datahistory) · Yahoo(공식문서 자체 없음 — 라이브러리 소스코드로 대체, 명시) · SPDR(개별 상품페이지 3개 + 마스터 메타파일 1개 직접 fetch).
🔴 **①-B(동종 US 서비스 3곳)**: 위 §1-B(Simply Wall St·stockanalysis.com·Finbox) + 보충(GeminIQ·OpenBB).
🔴 US 한정 — 전부 준수(Damodaran 지역변형·비US SPDR 상품은 조사 범위에서 명시적으로 제외).

---
---

<!-- STEP998 신설 -->
# 🗂️ ② 3라운드 전수 조사 + 카테고리 분류 + 슬롯 매핑 (STEP 998, 2026-08-12)

> 🔴 조사·문서 전용 — 코드 0줄·DB 쓰기 0·크론 미호출. 유료 가입·API 키 발급·결제 전부 안 함. **개별 문제로 빠지지 않고 발견은 전부 등재만 한다**(장은태 지시 — 997 직후 나스닥 시총 검증으로 샜다가 되돌린 전례).

## 라운드별 신규 발견 수 · 수렴 판정 (맨 앞)

| 라운드 | 각도 | 조사 대상 | 신규 발견 | R1 대비 비율 |
|---|---|---|--:|--:|
| **R1** | 기관 중심("누가 주는가") | 27개 기관(공공6·거래소4·분류4·상용API9·기관급4) | **27**(기준) | — |
| **R2** | 데이터 중심 역방향("이 값을 어디서 받나", 16개 값별 검색) | — | **29** | 107.4% |
| **R3** | 타자 역추적("동종서비스는 뭘 쓰나" + 비교글 + OSS 의존목록) | — | **28** | 103.7% |
| **R4** | 규제/구조 기록 중심("규제 때문에 존재하는 데이터") | 13F·내부자거래·CAT·DTCC·주정부 등기소·Form15 등 8건 | **3** | **11.1%** |

**🔴 수렴 판정: 종결(장은태 판단 필요 — 아래 근거 그대로 보고).** R4의 원시 비율(11.1%)은 10% 규칙을 형식상 살짝 넘는다. 그러나:
- R4에서 찾은 3개(SEC Form 13F 데이터셋·SEC 내부자거래 데이터셋·델라웨어주 법인등기소) **전부 우리 16개 슬롯 중 어디에도 안 들어간다** — 13F·내부자거래는 소유구조 데이터(밸류에이션 슬롯 아님), 델라웨어는 유료라야 쓸만한 필드(active/dissolved)가 나온다.
- R2(29)·R3(28)에서 R4(3)로 **한 자릿수 배 감소**했다 — 각도를 3번 바꿔도 계속 비슷한 규모(28~29)가 나오다가 4번째 각도에서 급격히 줄어든 것은 탐색 공간이 실제로 좁아지고 있다는 신호다.
- 🔴 **정직하게 남긴다**: 이건 "라운드 5를 안 해도 된다"는 뜻이 아니라 "이 4개 각도로는 더 안 나온다"는 뜻이다. 다섯 번째로 전혀 다른 각도(예: 학술 데이터베이스·오픈데이터 포털·AI 에이전트 전용 신생 서비스군)를 쓰면 또 몇 개가 나올 수 있다. **이번엔 여기서 멈춘다 — 장은태 판정 대기.**

**누적 카탈로그 규모**: 997의 5개(SEC·Yahoo·Nasdaq·Damodaran·SPDR) + 998의 87개(R1 27 + R2 29 + R3 28 + R4 3) = **총 92개 기관/소스**.

---

## R1 — 기관 중심 조사 (27개 기관)

### R1a. 공공/무료(정부 인접) 6개

| 기관 | 핵심 데이터셋 | 정의 | 형식 | 인증 | 갱신 | 비용 | 슬롯 |
|---|---|---|---|---|---|---|---|
| **FRED** | `DGS3MO/DGS2/DGS10/DGS30`(국채수익률) · `BAMLC0A1CAAA~BBB`(IG 등급별 스프레드) · `BAMLH0A1HYBB~HYC`(HY 등급별) · `BAA10Y`(Baa-10Y스프레드) | 재무부 CMT 곡선 재발행("Market Yield... at N Constant Maturity") · ICE BofA OAS(시총가중 등급별 지수) | JSON/CSV/XML | 무료키 필요 | **매일** | 무료 | 무위험수익률·신용스프레드 |
| **US Treasury**(fiscaldata·home.treasury.gov) | Daily Par Yield Curve Rates(1개월~30년) | CMT 원천(FRED가 재발행하는 바로 그 곡선), NY Fed 오후3:30 지표호가 기반 | CSV/XML | 불필요 | 매일 | 무료 | 무위험수익률(원천) |
| **BLS** | CPI·PPI·고용 시계열(Public API v2) | 조사 기반 공식 통계 | JSON | 무료키(없어도 25콜/일) | 월별 | 무료 | 해당없음(거시, 16슬롯 밖) |
| **BEA** | NIPA Table 1.14(법인세전이익·법인세·세후이익, 국민계정 집계) | 거시 집계, **기업단위 아님** | JSON/XML | 무료키 | 분기 | 무료 | 법인세율(약한 대리, 집계치) |
| **FINRA** | Reg SHO 일별 공매도량 · 공매도잔고(월2회) · Threshold List(상환실패 지속종목) | 미명시 세부 | Flat file/CSV | 대부분 불필요 | 일/월2회 | 무료(비상업 조건) | 상장상태/폐지위험(약한 대리) |
| **CFTC** | Commitments of Traders(COT, 선물 포지션) | 상품선물 롱숏 포지션(국채·주가지수선물 포함) | JSON/CSV/XML(Socrata) | 불필요(토큰 선택) | 주별(금) | 무료 | 해당없음(선물시장 구조, 16슬롯 밖) |

### R1b. 거래소 4개

| 기관 | 핵심 데이터셋 | 정의 | 무료 여부 | 슬롯 |
|---|---|---|---|---|
| **NYSE** | Security Master·TAQ 이력·실시간 피드 | 문서화됨(스펙PDF) | ❌ 전부 유료/기업계약 | 종목마스터·주가(전부 유료라 실사용 불가) |
| **Cboe** | 옵션 레퍼런스데이터(무료 CSV) · DataShop(유료, 14일 체험) | 미명시 | 🟡 옵션 종목목록만 무료 | 종목마스터(옵션 한정) |
| **OTC Markets** | Security Master·실시간시세·OTC Disclosure API | 미명시(문서 접근 실패, 미검증) | ❌ 전부 유료로 보임(무료API 확인 안 됨) | 종목마스터·상장상태(현재 나스닥 파생 데이터보다 권위 있으나 접근 불가) |
| **IEX(거래소)** | HIST(과거 틱데이터) 무료 · TOPS/DEEP(실시간)은 계약 필요 | 🔴 **IEX Cloud(무료 개발자API)는 2024-08-31 종료 확정** — 후속업체는 IEX와 무관 | 🟡 과거 틱데이터만 무료 | 주가(과거 틱, 일상 파이프라인엔 안 맞음) |

### R1c. 지수/분류 4개 — 핵심 질문: "무료 전체시장 GICS 경로가 있는가"

**답 = 없다.** MSCI·S&P DJI 둘 다 GICS **분류체계(정의)는 무료 공개**하지만 **종목별 매핑("GICS Direct")은 라이선스 상품**이라고 명시(재배포 시 "사전 서면동의 필요" 원문 확인). FTSE Russell의 ICB도 체계는 무료지만 종목별 매핑은 라이선스. Morningstar는 개별 종목 페이지에서 무료로 보이나 대량조회는 ToS 위반(재배포 금지) + Morningstar연계 ETF(ILCB 등)도 커버리지가 SPDR과 비슷한 규모(~530종목)라 확장 이득 없음.

| 기관 | 체계(무료) | 종목별 매핑(유료여부) | 슬롯 |
|---|---|---|---|
| **MSCI**(GICS 공동소유) | 방법론 PDF 무료 | ❌ GICS Direct 라이선스 | 섹터분류(체계 참고만) |
| **S&P DJI**(GICS 공동소유) | 지수 방법론 PDF 무료 | ❌ 라이선스, 무료 구성종목 목록도 공식으로는 없음(위키·Barchart 등 비공식 미러만 존재) | 섹터분류(체계 참고만) |
| **FTSE Russell** | ICB 구조 정의 XLSX 무료(11산업/20슈퍼섹터/45섹터/173서브섹터) | ❌ 종목별 라이선스 필요 | 섹터분류(다른 체계, 대체재 아님) |
| **Morningstar** | 개별종목 페이지 무료(대량조회 ToS 위반) | 🟡 Morningstar연계 ETF로 근사 가능하나 SPDR과 커버리지 동급 | 섹터분류(SPDR과 대체 관계, 확장 아님) |

### R1d. 상용 API 9개 — 전부 SEC 원문 벤더 정규화(재분류), 우리 원칙과 충돌

| 기관 | 무료tier(정확한 한도) | 재무데이터 원문추적성 | 슬롯 |
|---|---|---|---|
| **Polygon.io/Massive** | 5콜/분, EOD만, 2년치 | 🟡 `include_sources=true`로 부분 추적(정규화+출처표기) | 전체(유료전환 필요) |
| **Financial Modeling Prep** | 250콜/일 | ❌ 미확인(공식문서 접근 실패) | 전체 |
| **Alpha Vantage** | 25콜/일 | ❌ "GAAP/IFRS로 정규화" 자인 | 전체 |
| **Tiingo** | 1,000콜/일(가격), 재무는 Dow30 한정 | ❌ 미공개 서드파티 | 가격 위주 |
| **Intrinio** | 사실상 없음(2주 체험뿐) | 🟡 as-reported 엔드포인트=원문+출처링크(가장 추적성 좋음) | 전체(비쌈) |
| **EODHD** | 20콜/일 | ❌ 미명시, GICS 4단계 필드 명시 보유(9곳 중 유일) | 섹터분류(GICS 필드 있음, 출처 신뢰도 별도 확인 필요) |
| **Twelve Data** | 8콜/분·800/일, 완전재무는 $329/월 | ❌ 미확인 | 전체 |
| **Finnhub** | 60콜/분이나 **비상업용 한정** | 🟢 `financials-reported`=원문 태그명+출처filing 보존(사실상 SEC 재서빙) | 전체(단 상업이용 불가) |
| **Nasdaq Data Link(구Quandl)** | 무료 WIKI는 **2018-03 영구중단** | ❌ Sharadar=정규화, 유료 | 사실상 무료 대안 없음 |

### R1e. 기관급 4개 — 전부 접근 불가(비용), 카탈로그 완전성 목적으로만 기록

| 기관 | 고유 카테고리 | 비용 |
|---|---|---|
| **LSEG/Refinitiv** | I/B/E/S 컨센서스 추정치(방법론 공개: SmartEstimate=이상치 제외+최신성 가중+애널리스트 트랙레코드) | ~$1,500-3,000/월 플랫폼 + 데이터 별도 |
| **Bloomberg** | BEst 컨센서스(방법론 비공개) | ~$24,000-30,000/년/좌석 |
| **FactSet** | Revere 택소노미(7,000+ 세분류, GICS보다 깊음) | 계약별(비공개) |
| **S&P Capital IQ** | Visible Alpha(200+ 브로커·100만+ 컨센서스 라인아이템, 포함기준 문서화) | $12,000~$300,000+/계약 |

🔑 **컨센서스 성장률(역DCF 층5의 구멍)은 이 4곳이 유일한 제도권 소스이나 전부 유료** — 무료 경로는 여전히 없음(994 이전부터 미해결 확정 유지).

---

## R2 — 데이터 중심 역방향 검색 신규 발견 (29개)

> 997·R1에 없던 곳만. "이 값을 누가 주는가"로 검색해 나온 것.

| 값 | 신규 발견 | 핵심 한줄 |
|---|---|---|
| 시가총액/주가/배당 | stooq.com·Marketstack·Finviz·macrotrends.net·Wisesheets·Financial Datasets·Eulerpool·DTCC·Databento·sec-api.io | 🔴 **발행주식수의 free 이력 시계열**은 SEC DERA 벌크(우리가 이미 씀)가 사실상 최선 — 대부분 스냅샷 1건뿐 |
| 순이익/자기자본/매출/부채 | xbrl.us·edgartools(OSS)·OpenBB·SimFin·WSJ(FactSet소싱)·Simply Wall St·stockanalysis.com·오픈소스 XBRL 파서군 | 🟢 **edgartools**(OSS, MIT)가 `get_raw_data()`로 SEC 원문 그대로 접근 — 우리 원칙과 완전히 부합(단, SEC를 대체가 아니라 같은 소스에 접근하는 다른 클라이언트) |
| 업종배수/베타/ERP/세율/신용스프레드 | Siblis Research·Yardeni Research·FullRatio·GuruFocus·CSIMarket·Fernandez(IESE 서베이)·Duke CFO Survey(Graham&Harvey)·Tax Foundation·IRS | 🟢 **Duke CFO Survey = 분기 갱신 ERP**(Damodaran 연1회보다 빠름, 단 서베이 정의라 시장내재치와 다른 개념) · 🟢 **FRED ICE BofA OAS = 매일 등급별 신용스프레드**(위 R1a에 이미 기재, 가장 강한 발견) |
| 섹터분류/상장폐지위험/종목마스터 | OpenFIGI·GLEIF | 🟢 **OpenFIGI**(Bloomberg 무료 공개, 티커/CUSIP/ISIN↔FIGI 매핑, CIK 필드는 없음) · **GLEIF**(LEI, 무료 ISIN-LEI 매핑) |

---

## R3 — 동종서비스 역추적 신규 발견 (28개)

> stockanalysis.com·Simply Wall St·Finbox·Koyfin·GuruFocus·Wisesheets·macrotrends 자체 출처공개페이지 + 비교글 + OSS 의존목록(OpenBB·pandas-datareader).

**🔑 가장 많이 반복된 이름 = S&P Global Market Intelligence**(stockanalysis.com·Simply Wall St·Finbox 3곳 전부가 펀더멘털 벤더로 지목) — S&P Capital IQ(추정치)·S&P DJI(지수)와는 별개 사업부. **결론: 동종 서비스 대다수가 SEC 원문이 아니라 이 벤더를 거친다** — 997의 결론("SEC원문+Damodaran 조합이 드물다")을 재확인.

| 그룹 | 신규 발견 |
|---|---|
| 동종서비스 자체 공개 소스 | S&P Global Market Intelligence·Fiscal AI·Nasdaq UTP·Hiive·TipRanks·Quartr·BlueMatrix·ICE Market Data·QuoteMedia(CSI)·True FX·Trading Economics·Koyfin |
| 비교글 발견 | Calcbench·Daloopa·FinancialData.Net |
| OSS 의존목록 발견(OpenBB·pandas-datareader) | EconDB·Ken French Data Library·Bank of Canada·World Bank·Eurostat·OECD·Benzinga·Biztoc·Deribit·TMX Group·Tradier·Seeking Alpha |

🔴 **macrotrends.net은 출처를 전혀 공개하지 않는다**(ToS에 "various third-party providers"뿐) — 역추적 실패, 그 자체로 기록.

---

## R4 — 규제/구조 기록 신규 발견 (3개)

> "규제 때문에 존재하는 데이터"라는 4번째 각도. 13F·내부자거래·CAT·DTCC·주정부 등기소·Form15 등 8건 조사.

| 소스 | 무엇 | 슬롯 매핑 |
|---|---|---|
| **SEC Form 13F 데이터셋** | 분기별 기관투자자 보유내역 전체 벌크(무료) | ❌ 16슬롯 밖(소유구조 데이터) |
| **SEC 내부자거래 데이터셋**(Form3/4/5 벌크) | 분기별 내부자거래 전체 벌크(무료) | ❌ 16슬롯 밖(소유구조 데이터) |
| **델라웨어주 법인등기소** | 법인 존재확인(무료) / 상태(active·dissolved, $10~20 유료) | 🟡 상장상태/폐지위험 — 핵심 필드가 유료라 실사용 어려움 |

🔴 **부정적 발견 2건도 기록**: CAT(통합감사추적)는 규제기관 전용, 공개 경로 전혀 없음(공식 확인) · SEC는 DEF14A 임원보수 구조화 데이터셋을 발행하지 않음(XBRL 의무 대상이 아님, 공식 확인).

---

## 🟢 유니버스 종류 구성 (신규, STEP1021, 2026-08-14)

🔴 **커버리지 게이트(97%)의 분모(`data/us_symbols.json` "stock" 5,976건)에 무엇이 들어 있는지 한 번도 검증된 적이 없었다** — STEP1021이 최초로 이름 패턴(1차) + `lens_scores`/`revdcf_results` 편입 여부(교차확인)로 전수 분류했다.

| 종류 | 건수 | 비율 | 판별 근거 |
|---|---|---|---|
| COMMON(잔여) | 5,124 | 85.7% | 패턴 불일치 → 보통주 추정 |
| CEF_TRUST(펀드·신탁 명칭) | 320 | 5.4% | 🔴 이름 패턴 추정 — **7건은 REIT 오분류로 확인됨**(아래 참조), 나머지 313건은 `lens_scores`·`revdcf_results` 어디에도 없어(교차검증) 진짜 CEF·신탁일 가능성 높음 |
| ADR | 306 | 5.1% | 이름:American Depositary Shares/ADS/ADR(철자변형 "Depository"는 미포착) |
| SPAC | 217 | 3.6% | 이름:Acquisition Corp + Ordinary/Class 주식 |
| 로열티트러스트 | 9 | 0.2% | 이름:Royalty Trust/Units of Beneficial Interest |
| 우선주·워런트·라이트 | 0 | 0% | `scripts/refresh_us_symbols.ts`의 `EXCLUDE_NAME` 정규식이 이미 걸러냄(확인됨, 정상 동작) |

🔴🔴 **분류 방법의 결함을 발견·정정**: "CEF_TRUST" 320건 중 7건이 `lens_scores`에 있어 "CEF가 모델 대상에 섞였다"를 기대했으나, 직접 확인 결과 **7건 전부 REIT**(`FRT`·`EQR`·`CPT`·`AMH`·`NTRS`·`ESS`·`DLR` — REIT는 "Trust"·"Common Shares of Beneficial Interest"라는 CEF와 같은 법적 표기를 쓰지만 실제로는 10-K/10-Q를 내는 정상 운영회사다). **`revdcf_results`(604건)엔 CEF·신탁·SPAC이 단 0건**(모델이 이미 이들을 올바르게 배제 중 — 새 결함 아님, 정상 동작 확인).

**가상 커버리지(🔴 채택 안 함, 참고용)**: CEF/신탁·로열티트러스트 제외 시 결합 커버리지 96.95%→**98.39%**(97% 게이트를 넘김) — 단 **분모를 줄이면 커버리지가 오르는 건 산술적으로 당연**하며, 이게 개선인지 눈속임인지는 "빠진 종목이 정말 모델 대상이 아닌가"로만 판정된다. **판정은 장은태 몫, 유니버스는 이 STEP에서 바꾸지 않았다.** 상세 = `docs/probe_1021_universe_composition.md`.

---

## 카테고리 분류

🔴 "무엇을 주는가"가 아니라 **"어느 자리에 넣을 수 있는가"**로 나눈다. 같은 카테고리 = 서로 대체 가능. 정의가 다르면 카테고리를 쪼갠다(예: 시가총액을 계산기준별로 3분할 — 975에서 실측된 8.29% 차이 근거).

| # | 카테고리 | 대표 소스 | 핵심 정의 |
|---|---|---|---|
| 1 | 시가총액·기말발행주식수 기준 | ~~(우리 정본, SEC 주식수×종가로 직접 조립)~~ → 🔴 **정정(STEP1019, 2026-08-14) — "우리 정본"은 과장이었다. 실제 파이프라인은 이 방식을 안 쓰고 야후를 쓴다. 실현 가능성을 처음 실측한 결과: SEC `dei:EntityCommonStockSharesOutstanding`(+ `us-gaap:CommonStockSharesOutstanding` 보조) × `us_stock_perf.price`로 조립 시 유니버스(5,976) 대비 단독 커버리지 76.2%(4,556건) — 97% 게이트 미달. 야후 결측 코호트(365건)만 보완하는 용도로는 183건(50.1%) 회복, 결합 커버리지 96.95%로 97%에 근소하게 미달.** 값 자체는 겹치는 4,513건 기준 중앙값 사실상 0(대형·유동성 좋은 종목은 정의가 사실상 같다), 단 p99 4064%·소형주(<0.3B) p90 225%로 꼬리가 극단적이며 복수클래스 종목(737건, 겹치는 표본 중 16.2%)은 985가 이미 "신뢰 불가"로 판정한 구간이라 별도 취급 필요. 상세 = `docs/probe_1019_sec_marketcap_assembly.md` | ~~975 정본 — 외부 대조 시 이 기준~~ → 🔴 **정정 — 지금은 어떤 계산에도 실제로 쓰이지 않는다. "외부 대조용 참고 계열"로만 유효, 97% 미달로 정본 승격은 이 STEP에서 판정하지 않음(장은태 몫)** |
| 2 | 시가총액·가중평균희석주식수 기준 | 일부 벤더(구체 미확인) | 975에서 8.29% 차이 확인 — 다른 카테고리 |
| 3 | 시가총액·계산기준 미명시(벤더 사전계산) | Yahoo(quote/quoteSummary)·Nasdaq스크리너/quote·FMP·Alpha Vantage·EODHD·Wisesheets 등 | 위 1·2 중 어느 쪽인지 불명 — 검증 없이 신뢰 불가 |
| 4 | 발행주식수·SEC원문 태그(시점 명시) | SEC `dei:EntityCommonStockSharesOutstanding` | 우리 정본 |
| 5 | 발행주식수·이력 시계열(free) | SEC DERA 벌크(FSDS) | 유일한 free 다년 시계열 |
| 6 | 발행주식수·벤더 스냅샷(시점 불명) | Yahoo defaultKeyStatistics·Alpha Vantage OVERVIEW·Finviz 등 | 현재값만, 이력 없음 |
| 7 | 주가·비조정 종가 | 각 거래소·벤더 | — |
| 8 | 주가·배당/분할조정 종가 | stooq·Tiingo·EODHD·Yahoo chart 등 | 조정방식 대부분 미명시 |
| 9 | 재무제표·SEC원문 태그(추적가능) | SEC companyfacts/벌크ZIP/FSDS·edgartools·xbrl.us·오픈소스 XBRL파서군 | 우리 정본 — 태그명 보존 |
| 10 | 재무제표·벤더 정규화(추적불가) | FMP·Alpha Vantage·Tiingo·EODHD·SimFin·WSJ 등 대다수 | 재분류 규칙 비공개 |
| 11 | 재무제표·벤더 정규화+출처표기(부분추적) | Polygon(`include_sources`)·Wisesheets(XBRL인용)·Intrinio(as-reported) | 정규화하되 원문 링크 제공 |
| 12 | 섹터분류·GICS(라이선스, 무료경로 없음) | MSCI/S&P DJI GICS Direct | 무료 아님 |
| 13 | 섹터분류·GICS 근사(ETF보유 역산, S&P500 한정) | SPDR 11섹터 ETF(정본)·Morningstar연계ETF(대체재, 커버리지 동급) | ~500~530종목 상한 |
| 14 | 섹터분류·비GICS 자체체계(서로 대체 불가) | 나스닥(12개)·야후(11개,GICS 1:1대응)·SEC SIC·Damodaran(94개)·ICB(FTSE, 45섹터)·Morningstar(11개) | 체계가 달라 섞으면 안 됨 |
| 15 | 업종 집계배수·연1회 학술 | Damodaran(pedata·pbvdata·psdata·vebitda 등) | 우리 정본 |
| 16 | 업종 집계배수·반기 이상(부분무료) | Siblis Research(반기)·Yardeni(주간, 차트뿐)·stockanalysis.com(주기미상) | 문서화된 방법론은 Siblis뿐 |
| 17 | 업종 베타·연1회 학술(대체 소스 없음 확인) | Damodaran betas.xls | R1~R4 전체에서 무료 대체재 못 찾음 |
| 18 | ERP·연1회 시장내재 | 🔴 **정정(1002) — `histimpl.xls`(연간)와 `ERPbymonth.xlsx`(월간, 1001 발견)는 서로 다른 파일이다.** Damodaran | 시장가격 역산. 우리가 실제로 쓰는 값(wacc.xls 상단)은 `ERPbymonth.xlsx`의 페어드 계열과 일치 |
| 19 | ERP·분기 서베이(다른 정의) | Duke CFO Survey(Graham&Harvey) | 실무자 기대치, 시장내재와 다른 개념 — 대체재 아니라 병기용 |
| 20 | 무위험수익률·매일 국채수익률(raw Treasury) | FRED DGS10·Treasury.gov 원천 | 🔴 **정정(1002) — STEP999의 "완전 일치" 판정은 값 층위에서 오류였다.** 999는 정의 문구("10-year Treasury bond rate")만 대조해 일치를 확인했으나, **Damodaran이 실제로 ERP와 짝지어 쓰는 값은 raw Treasury가 아니라 별도의 자체조정 "$ Riskfree Rate" 계열**임을 1001이 발견했다(`ERPbymonth.xlsx` 직접 개봉). 산식은 1003에서 확인됨 — `T.Bond rate − 해당등급 디폴트스프레드`(2025-05 Moody's 미국 신용등급 강등 대응, Damodaran 블로그 원문). 우리 저장값 3.95%는 raw Treasury(FRED·`T.Bond Rate`≈4.18%)가 아니라 "$ Riskfree Rate"(0.0395)와 정확 일치 — **정의는 같은 말을 써도 실제 계열이 다르다.** 🔴 **결론: 카테고리20(raw Treasury, FRED 포함)은 #14 슬롯의 후보 부적격.** 유일한 유효 후보는 `ERPbymonth.xlsx`의 "$ Riskfree Rate"(카테고리18 내부, 짝인 ERP와 함께) — `docs/probe_999_fred_damodaran.json`(원 판정, 정정 대상)·`docs/probe_1001_erp_pair.json`(정정 근거) |
| 21 | 무위험수익률·연1회 학술 스칼라 | Damodaran wacc.xls 상단값 | 현재 정본이나 🔴 **실질 정체(1001) — 2026-01-05 이후 7개월+ 미갱신**(HTTP Last-Modified 실측), "연1회"라는 서술과 달리 사실상 갱신이 멈춰 있다. 🔴 **STEP999 부수발견의 정체 해소(1001)**: as_of(2026-01-05) 당일 실제 raw DGS10은 4.15~4.19%대였는데 저장값은 3.95% — 그 괴리는 "원인 미상"이 아니라 **Damodaran의 "$ Riskfree Rate" 계열이 raw Treasury와 원래 다른 숫자이기 때문**이었다(1001에서 완전 해소, 판정 불필요 상태로 전환) |
| 22 | 법인세율·연방 고정 | IRS(21%, 2018~) | 입법 전까지 불변 |
| 23 | 법인세율·주별 | Tax Foundation(연1회, 입법과 동주기) | Damodaran countrytaxrates와 별도 층위 |
| 24 | 법인세율·업종별 실효세율 | Damodaran taxrate.xls | 현재 정본 |
| 25 | 신용스프레드·매일 등급별 | FRED ICE BofA OAS(IG AAA~BBB, HY BB~CCC) | 🔑 R2 최대 발견. 🟡 **STEP999 대조 완료 — 부분적으로만 대응 가능**: FRED는 신용등급 문자(7개 대분류) 축, Damodaran(wacc.xls)은 **주가변동성 표준편차** 축·Damodaran(ratings.xls)은 **이자보상배율** 축 — 서로 다른 분류축. 단 두 Damodaran 파일이 **같은 마스터 스프레드표를 공유**한다는 것을 값 일치로 확인(예 0.011113=Baa2/BBB 양쪽 동일) → 간접 브릿지로 등급 역추정은 가능하나 (a)등급노치 손실(Damodaran 20여단계→FRED 7개) (b)개념차이(모델추정 vs 실제시장관측) (c)모집단차이(FRED는 실채권 거래기업만) 3중 문제로 직접 대체 불가 |
| 26 | 신용스프레드·연1회 학술(등급→스프레드 룩업) | Damodaran ratings.xls | 현재 정본, 종목별 부채비용 산출 가능(997 발견). 🔴 **STEP999 값대조**: 브릿지된 등급 기준 IG~하위IG는 Damodaran이 FRED보다 14~33bp 높게(보수적), 최하단(CCC)은 반대로 FRED가 129bp 더 높음(실제 시장스트레스가 모델추정보다 훨씬 넓음) — 균일 편향 아님 |
| 27 | 배당·이벤트 캘린더 | 나스닥 dividends calendar(현재 사용) | — |
| 28 | 배당·개별종목 이력 | Tiingo·EODHD·FMP·Polygon 등 다수 | 상용 API 대부분 보유 |
| 29 | 상장상태/폐지위험·거래소 자체신고(공식정의) | 나스닥 Financial Status 플래그(997 발견, 미사용) | D/E/Q 코드 공식 정의 있음 |
| 30 | 상장상태/폐지위험·SEC 공식(구조화 검색) | SEC Form 25(거래소 상장폐지)·Form 15(등록말소, R4 발견) | 서로 다른 시점 신호(15가 더 이를 수 있음) |
| 31 | 종목마스터·SEC 공식(CIK 중심) | company_tickers_exchange.json(현재 정본) | — |
| 32 | 종목마스터·거래소 심볼 디렉터리 | 나스닥 심볼디렉터리(현재 정본) | — |
| 33 | 종목마스터·글로벌 식별자 매핑(CIK 없음) | OpenFIGI(티커/CUSIP/ISIN↔FIGI)·GLEIF(ISIN↔LEI) | CIK 브릿지는 티커 조인 필요(미검증) |

**카테고리 총 33개.**

---

## 슬롯 매핑

우리 공식의 변수 자리 20개. 각 자리 = 지금 쓰는 소스+우선순위 · 자격있는 다른 후보(카테고리 번호) · 요구정밀도 · 검증방법.

🔴 **STEP1011 전수 코드 대조 완료(2026-08-13)** — 20줄 전부를 실제 코드(`파일:줄번호`)와 대조. 일치 15 / 불일치 5(#1·#2·#14·#15·#18, 아래 취소선으로 정정) / 확인불가 0. 전체 5칸(실제읽는지점·저장소·채우는주체·외부소스·폴백순서) 상세 + 런타임 도달률(Supabase 실측) = `docs/probe_1008_slot_audit.md`.

| # | 슬롯 | 지금 쓰는 소스(우선순위) | 자격있는 후보(카테고리#) | 요구정밀도 | 검증방법 |
|---|---|---|---|---|---|
| 1 | 시가총액 | ~~Yahoo 배치조회(정본, us_market_cap)~~ → **Yahoo 3단 취득(배치→개별재시도 400건/40s→7일폴백)**(정본, us_market_cap. `lib/lensPrecompute.ts:107-236`) (1011 정정 — 코드 대조 결과 배치 1단계만 기재돼 있었음, 실제론 개별재시도·7일폴백 2단계가 더 있다) | 카테고리3 전부(Nasdaq스크리너 등) — 전부 계산기준 미명시라 **검증 없이 못 씀** | 값 자체가 답(Q1 분모) | 카테고리1(기말발행×종가)과 대조해야 신뢰 가능. 🔴 **단, #5(자기자본)·#6(매출)과 주식수 기준이 같아야 함(의존관계②·ⓑ) — 975 실측 PBR 8.29%·PSR 8.34% 잔차가 이 불일치 때문이었고, 프로덕션엔 아직 처방이 안 배선됨** |
| 2 | 발행주식수 | SEC XBRL 태그(역DCF), ~~Yahoo 부수값(밸류)~~ → **(밸류에이션은 shares 미사용 — marketCap 직접사용, `lib/valuation.ts:38-49` ValuationInputs에 shares 필드 자체가 없음)** (1011 정정 — 코드 근거 없는 서술이었음. 부수 발견: `us_fundamentals.source_tags`에 shares 키 없음, 채택 태그명은 `revdcf_results.flags.sharesTag`에만 실림·604건 한정) | 카테고리4(SEC 정본)·5(이력, 미사용) | 값 자체가 답 | 카테고리4와 직접 대조 |
| 3 | 주가 | us_stock_perf(야후계열, 표시용) | 카테고리7·8 다수 | 값 자체가 답(역DCF sharePrice) | 거래소 종가와 대조 |
| 4 | 순이익 | SEC companyfacts(정본) | 카테고리9(edgartools 등, 같은 원문) | 값 자체가 답 | 이미 원문 — 검증 불요 |
| 5 | 자기자본(보통주) | SEC companyfacts(963 정책) | 카테고리9 | 값 자체가 답 | 원문 |
| 6 | 매출 | SEC companyfacts | 카테고리9 | 값 자체가 답 | 원문 |
| 7 | 영업이익 | SEC companyfacts(폴백 포함) | 카테고리9 | 값 자체가 답 | 원문 |
| 8 | D&A | SEC companyfacts | 카테고리9 | 값 자체가 답 | 원문 |
| 9 | 부채 | SEC companyfacts(969 3분류) | 카테고리9 | 값 자체가 답 | 원문 |
| 10 | 비영업자산/현금 | SEC companyfacts | 카테고리9 | 값 자체가 답 | 원문 |
| 11 | 세율 | Damodaran countrytaxrates(한계세율, US행) | 카테고리22(IRS 연방)·23(주별)·24(업종실효) | **순위만 필요할 수 있음**(WACC 구성요소) | IRS 21%와 국가한계세율 정합 대조 |
| 12 | 자본지출률 | 원전 T5 방식(내부 계산) | 🔴 **후보 1개뿐**(원전 계산 방식 자체가 유일 정의, 외부 소스 대체 불가) | 값 자체가 답 | 원전 대조표 |
| 13 | 운전자본률 | 원전 T4 방식(내부 계산) | 🔴 **후보 1개뿐**(동일 사유) | 값 자체가 답 | 원전 대조표 |
| 14 | 무위험수익률 | ~~Damodaran wacc.xls 상단값(연1회라 서술되나 실질 정체 7개월+)~~ → **Damodaran `ERPbymonth.xlsx` "$ Riskfree Rate"열(월1회, STEP1005가 새 행 as_of=2026-08-01 적재 — `damodaran_global_inputs`가 이제 2행이고 `latestAsOf()`가 항상 최신행을 골라 이 값이 프로덕션에서 실제로 쓰이는 중. wacc.xls 유래 구행[as_of=2026-01-05]은 테이블에 남아있으나 더 이상 안 읽힘)** (1011 정정 — 카탈로그가 아직 옛 소스로 적혀 있던 것을 STEP1011이 최초로 코드 대조로 발견) | 🔴 **카테고리20(FRED/Treasury raw) = 부적격, 정정(1002).** 짝 제약(의존관계①·ⓐ) 때문만이 아니다 — **raw Treasury 자체가 Damodaran이 실제로 쓰는 "$ Riskfree Rate" 계열과 다른 숫자**임을 1001이 확인했다(999의 "완전 일치"는 정의 문구만 대조한 오판, 카테고리20 참조). 짝을 맞춰 FRED를 쓰더라도 짝지을 ERP 자체가 "$ Riskfree Rate" 기준으로 산출된 값이라 FRED와는 애초에 안 맞는다. **유일한 유효 후보 = `ERPbymonth.xlsx`의 "$ Riskfree Rate"열**(카테고리18 내부, 짝인 ERP와 함께, 1001 발견) | 값 자체가 답(WACC) | `ERPbymonth.xlsx` 최신행과 함께 재계산해 대조(FRED 단독 대조는 애초에 무의미) |
| 15 | ERP | ~~Damodaran wacc.xls 상단값(연1회, 사실상 정체 7개월+)~~ → **Damodaran `ERPbymonth.xlsx` "ERP(T12m) with adj riskfree rate"열(#14와 같은 행에서 짝으로 옴, as_of=2026-08-01 활성)** (1011 정정 — #14와 동일 사유) | 🔴 **단, #14(무위험수익률)와 함께 바꿔야 함(의존관계①·ⓐ짝제약).** 카테고리19(Duke서베이, 분기·다른정의)는 병기용(대체 아님). 유효 후보 = `ERPbymonth.xlsx`(#14와 짝, 1001 발견) | 값 자체가 답(WACC) | #14와 함께 재계산해 대조 |
| 16 | 베타 | Damodaran betas.xls(업종, 연1회) | 🔴 **후보 1개뿐(실질적 단일=진짜 SPOF, R1~R4 전체에서 무료 대체 못 찾음).** 🔴 **단, #11(세율)과 releveraging 시 세율 불일치 가능성(의존관계③·ⓑ, 0.63%p, 미측정)** | 값 자체가 답이나 업종 대표값이라 개별종목은 근사 | 대체 소스 없어 검증 불가(원전 신뢰 외 방법 없음) |
| 17 | 신용스프레드 | Damodaran ratings.xls/wacc.xls(연1회) | **카테고리25(FRED ICE BofA OAS, 매일)** — 🔑 최대 발견, 갱신빈도 개선 후보(999: 부분적만 가능). 🔴 **단, #14/#15와 같은 as_of 배치에서 갱신되고 있음(의존관계⑤·ⓒ) — #14/#15만 더 자주 갱신하면 as_of가 갈라짐** | 값 자체가 답(부채비용) | FRED와 등급별 직접 대조 |
| 18 | 섹터분류 | resolveSector() 0~4순위(SPDR→Damodaran→형제→야후→미분류) — **추가: `us_sector_wide`는 새 as_of를 안 만들고 기존 as_of(현재 2026-08-08)에 신규 심볼만 append(STEP974 방식ⓐ, `route.ts:116-148`)** (1011 정정 — 알고리즘명은 정확했으나 갱신방식이 누락돼 있었음) | 카테고리14(비GICS 다수) 전부 이미 후보에 포함됨 | **순위/그룹핑만 필요**(업종 대비용) | 기존 3중 대조 체계 유지 |
| 19 | 업종배수 | 🔴 **정정(1002) — 비어 있다.** 998이 "Damodaran pedata/pbvdata/psdata/vebitda(연1회)"라 적었으나 코드 확인 결과(`lib/valuation.ts`·`lib/revdcf/drivers.ts`) 이 파일들은 **정의 근거 주석으로만 인용**되고 실제 데이터로 ingest되지 않는다. 실제 업종 배수는 STEP980 `sectorMedianRelative()`가 **우리 자신의 유니버스 값을 섹터별로 묶어 자체 계산**한다(외부 배수 벤치마크 없음) | 카테고리16(Siblis 등, 반기) — 자체계산과의 교차검증 후보로만 유효 | 순위/비교만 필요(업종 대비 분자) | 미검증(외부 배수와 대조된 적 없음) |
| 20 | 업종베타 | 🔴 **정정(1002) — #16과 동일 슬롯이다, 별도 항목 아니다.** `app/api/cron/revdcf/route.ts:183,267`을 코드로 확인 — `damodaran_beta.unlevered_beta_cash_adj`가 유일한 beta 소스이고, 쓰는 곳도 `releveredBeta` 계산 단 한 곳뿐이다. #16과 #20은 998이 같은 값을 두 슬롯으로 중복 등재한 카탈로그 오류였다 | (해당없음 — #16 참조) | (해당없음) | (해당없음) |

**슬롯 총 20개(단 #20은 #16의 중복 등재였음이 1002에서 확인됨 — 실질 19개 자리).**

### 🔴 후보 1개뿐인 슬롯 — 원리적 단일 vs 실질적 단일 (1002 재분류)

998은 "#12·#13·#16/#20(실질 1소스 2슬롯) = 3~4개"로 뭉뚱그렸다. 성격이 다른 것을 섞으면 진짜 위험한 자리가 안 보인다 — 갈라서 센다.

| 유형 | 슬롯 | 판정 | 근거 |
|---|---|---|---|
| **원리적 단일**(취약점 아님) | #12 자본지출률 | 대체 소스가 "없는" 게 아니라 **개념 자체가 우리 계산법(원전 T5 방식)으로만 정의됨** — 시장에 발행되는 데이터가 아니라 우리가 산출하는 값이라 "대체 소스"라는 질문 자체가 성립하지 않는다 | 원전(Expectations Investing) 계산방식이 정의 그 자체 |
| **원리적 단일**(취약점 아님) | #13 운전자본률 | 위와 동일 사유(원전 T4 방식) | 위와 동일 |
| **실질적 단일**(🔴 진짜 SPOF) | #16 베타(≡구 #20 업종베타) | 시장에 "업종별 무차입 베타"를 발행하는 무료 기관이 92개 소스 전수조사(997+998, R1~R4)에서도 **하나도 안 나왔다** — 대체재가 있을 법한데 못 찾은 경우 | Damodaran `betas.xls`가 연1회 갱신을 멈추거나 접근이 막히면 역DCF WACC 전체가 계산 불가 (999·STATE.md 68번 기존 등재와 동일 결론, 1002가 정확한 개수로 재확인) |

🔑 **결론: 진짜 단일장애점(실질적 단일) = 1개 — Damodaran `betas.xls`.** 원리적 단일(#12·#13)은 애초에 "찾아야 할 대체 소스"가 없는 자리라 위험도가 다르다. 998의 "3~4개"는 두 성격을 섞어 실제보다 위험해 보이게(또는 반대로 흐릿하게) 만들었다.

---

## 슬롯 간 의존관계 (신규, 1002)

🔴 998이 "슬롯은 독립"이라 암묵적으로 다뤘던 것이 틀렸다 — 20개(실질 19개) 슬롯 사이에 최소 6건의 실제 의존관계가 있다. **묶인 슬롯은 여기 표시된 대로, 후보 교체 시 짝도 함께 검토해야 한다.**

### ⓐ 짝 제약 — 한쪽만 바꾸면 모순

| # | 묶이는 슬롯 | 왜 묶이는가(원전 근거) | 한쪽만 바꾸면 | 실측 근거 |
|---|---|---|---|---|
| 1 | **#14 무위험수익률 ↔ #15 ERP** | Damodaran의 내재 ERP는 그의 riskfree 가정으로 **역산**된 값 — 원전 명시: *"The riskfree rate chosen in computing the premium has to be consistent with the riskfree rate used to compute expected returns... Using equity risk premiums that are very different from the implied premium will introduce a market view into individual company valuations"*(ERP2022Formatted.pdf, 1001 확인) | `Ke=rf+β×ERP`가 서로 다른 시점의 시장가정을 섞는다 — 999·1000이 이 제약을 놓치고 rf만 FRED로 교체하려다 1001에서 철회됨 | **1001 실측**: rf만 교체(mismatched)=카테고리전환 6.4%(28/440) vs rf·ERP 짝으로 교체(paired)=5.9%(26/440) — 짝을 깨면 인위적으로 더 큰 변화가 나온다는 것을 604전수로 확인 |

### ⓑ 동일 소스(기준) 제약 — 같은 기준이어야 정합

| # | 묶이는 슬롯 | 왜 묶이는가 | 한쪽만 바꾸면 | 실측 근거 |
|---|---|---|---|---|
| 2 | **#1 시가총액(분자) ↔ #5 자기자본·#6 매출(분모, PBR·PSR)** | 시가총액의 주식수 기준과 재무제표 배수 계산에 쓰이는 주식수 기준이 다르면 비율이 어긋난다 | PBR·PSR이 실제 오차가 아닌 "기준 불일치"로 왜곡된다 | **975 실측**: 기말발행주식수로 재구성 시 PBR 8.29%→0.053%·PSR 8.34%→0.112%로 수렴(13~14종목). 🔴 **이 수정은 975의 진단용 재구성에만 적용됐고, 프로덕션 `us_valuation`(Yahoo `us_market_cap`÷SEC 자기자본·매출)은 여전히 원래 기준 그대로다 — 잔차는 프로덕션에 남아 있을 가능성이 높다(미검증)** |
| 3 | **#11 세율 ↔ #16 베타** | Damodaran의 unlevered beta는 그가 `betas.xls`에서 가정한 세율(약 25.00%, `wacc.xls` 입력값과 동일 반올림값)로 이미 **unlever된** 값이다. 우리는 이를 **다른 세율**(`countrytaxrates.xls` 25.63%)로 **relever**한다(`releveredBeta = unleveredBetaCashAdj×(1+(1−taxRate)×D/E)`) | unlever에 쓰인 세율과 relever에 쓰이는 세율이 미세하게 어긋난다(25.00% vs 25.63%, 0.63%p) | 🔴 **미측정 — 이번 STEP 범위 밖(개별 실행 금지 규칙).** `data/sources/README.md`에 "알려진 내부 불일치"로 이미 기록돼 있었으나(2026-08-01), 그 기록은 "어느 세율을 쓸지"만 판정했고(25.63% 채택, REVDCF_SPEC.md:1769 "해소") 이 **releveraging 방향의 불일치**는 별도로 다뤄진 적이 없다. 0.63%p라 영향은 작을 것으로 추정되나 실측 없음 |

### ⓒ 시점(as_of) 제약 — 같은 시점이어야 함

| # | 묶이는 슬롯 | 왜 묶이는가 | 한쪽만 바꾸면 | 실측 근거 |
|---|---|---|---|---|
| 4 | **#1 시가총액(오늘) ↔ #4~10 재무제표(최근 제출연도)** | 분자(시총, 매일 갱신)와 분모(재무제표, 연 1~4회 제출)의 시점이 근본적으로 다르다 — TTM/FY 시점차 | 밸류에이션 배수가 시점 불일치만큼 흔들린다 | **981 실측**: 상위20 괴리 원인분류 중 TTM/FY 시점차 **10건**(SEC companyfacts 로컬캐시로 정량 부합 확인) |
| 5 | **#14/#15 무위험수익률·ERP ↔ #17 신용스프레드** | 우리 `damodaran_global_inputs`(rf·ERP)와 `damodaran_credit_spread`(신용스프레드)는 지금 **같은 배치 실행(같은 `as_of`)에서 함께 채워진다** — 둘 다 `as_of=2026-01-05`(1002 직접 조회로 확인, DB SELECT) | rf·ERP만 독립적으로(예: 1001의 월간 ERPbymonth.xlsx로) 더 자주 갱신하면 신용스프레드는 예전 시점에 머물러 as_of가 갈라진다. 신용스프레드 자체가 rf에서 역산되는 값은 아니므로(ⓐ와 달리 산술적 모순은 아니다) — **모순은 아니지만 시장조건 정합성이 약해진다** | 실측 없음(이번 STEP은 조사만, 아래 시나리오가 아직 발생하지 않았음 — 1001의 C안이 배선되면 처음 생기는 문제) |
| 6 | **#18 섹터분류(정지 가능) ↔ #1/#4~10** | 업종 대비 계산은 종목의 섹터가 최신이어야 정확하다(신규 상장·섹터 재분류 반영) | 973/974에서 실측된 것처럼 섹터 배선이 멈추면 신규 종목이 계속 `NO_SECTOR`로 남는다 | **973·974 실측**: 08-09 신규 40종목/일 미부착, 크론 배선(974)으로 해소. 섹터 자체가 거의 안 변해 **약한 제약**(973/974가 이미 처방 완료 상태) |

### 🔴 검사했으나 제약이 아닌 것(기각 근거도 기록)

| 후보 | 검사 결과 |
|---|---|
| #14 무위험수익률 ↔ #17 신용스프레드 | **ⓐ 짝 제약 아님.** Damodaran의 신용스프레드 룩업표(이자보상배율→스프레드)는 rf로부터 산술적으로 역산되는 값이 아니라, 관측된 회사채 스프레드를 등급대별로 별도 집계한 것(atCoD 공식에서 rf에 **더해지는** 항이지 rf에서 **파생되는** 항이 아님). ⓒ(시점) 제약은 있음(위 5번) |
| #12/#13(자본지출률·운전자본률) ↔ #6 매출 | 원전 공식상 `fixedCapitalRate`·`workingCapitalRate`는 매출 대비 비율로 정의되므로 매출과 함께 움직이는 것은 **당연한 산식 구조**이지 별도 소스 간 "짝 제약"이 아니다(같은 소스·같은 계산식 내부 관계라 이 절의 대상이 아니다) |

**요약 — 1-1: 슬롯 간 의존관계 = 6건**(ⓐ 1건 · ⓑ 2건 · ⓒ 3건), 그 외 검사했으나 제약이 아닌 것 2건 기록. 별도로 **카탈로그 자체의 이중 등재 오류 1건**(#16=#20)을 위 슬롯 재분류에서 정정.

🔑 **결론: 진짜 단일장애점(실질적 단일) = 1개 — Damodaran `betas.xls`.** 원리적 단일(#12·#13)은 애초에 "찾아야 할 대체 소스"가 없는 자리라 위험도가 다르다. 998의 "3~4개"는 두 성격을 섞어 실제보다 위험해 보이게(또는 반대로 흐릿하게) 만들었다.

---

## 즉시 이득 통합 목록 (997+998+999+1000+1001, 1002가 상태 갱신 · 판단만 · 고치지 않음)

🔴 **우선순위 없음(905 원칙)이 기본값이나, 아래 1번은 장은태가 명시 지시(1002 추가지시)로 최우선 등재를 요청해 예외적으로 맨 앞에 둔다.** 나머지는 상태(판정 완료/대기/철회)만 표시, 순서에 의미 없음.

| # | 발견 | 어느 슬롯 | 예상 이득 | 선결 조건(의존관계 포함) | 실행 난이도 | 라이브 영향 | 승인 필요 |
|---|---|---|---|---|---|---|---|
| **1(1001, 최우선 — 장은태 지시)** | 🔑 **Damodaran `ERPbymonth.xlsx` 월간 rf·ERP 페어 도입** | **riskfree + ERP(짝)** | **7개월 정체 → 월 1회 갱신** | 🟢 **상태(1005): 적재 완료·크론 반영 대기.** `scripts/ingest_erp_monthly.ts`로 `damodaran_global_inputs`에 새 행(as_of=2026-08-01) INSERT 완료 — 기존 행 지문 불변 확인, 새 행 rf·erp 정확 일치. **헤드라인 검증 — 실제 프로덕션 2행 상태에서 `latestAsOf()`가 새 행을 정확히 고름을 확인**(1004 수정의 첫 실전 검증). rf·erp는 ERPbymonth(2026-08) 유래, `global_default_spread`·`marginal_tax_rate_used`·`expected_inflation`은 wacc.xls(2026-01-05) 그대로 복사(한 행 안에서 출처 혼재, 기록방식은 문서화만 — 옵션A 컬럼추가는 보류·재고권고). 다음 정규크론이 `revdcf_results` 26건 verdict 변경 반영 예정(단 `revdcfEnabled()` 기본OFF라 화면 노출은 별개 승인) | 중 | **카테고리 전환 5.9%(26/440) 재확인**(1005, 라이브 로드값 그대로 재계산) | **예(배포 승인 대기)** |
| 2(997) | Yahoo/Nasdaq 시총 대체경로 | #1 시가총액 | 미해결14번(LOCAL_OK_PROD_FAIL) 우회 가능성 | 계산기준 검증(카테고리1·2·3 구분) 먼저 + **의존관계#2**(자기자본·매출과 같은 주식수 기준이어야 함) | 중 | 있음(us_market_cap) | 필요 |
| 3(997) | Damodaran `ratings.xls`(종목별 부채비용) | #17 신용스프레드 | 업종평균 대신 종목별 이자보상배율 기반 부채비용 | 원전대조표 | 중 | 있음(WACC) | 필요 |
| 4(997) | Damodaran `fundgrEB.xls`(EBIT 성장률) | 역DCF 성장경로(층5, 범위 밖 슬롯) | "가장 큰 구멍"의 비컨센서스 대안 | 원전대조표 | 중 | 있음(GAP) | 필요 |
| 5(997) | ~~Damodaran `histimpl.xls`(내재ERP)~~ | #15 ERP | 🔴 **정정(1001) — histimpl.xls는 연간이라 부적합, 실제 후보는 `ERPbymonth.xlsx`(월간).** 위 1번으로 대체됨, 이 행은 폐기 | — | — | — | — |
| 6(997) | 나스닥 Financial Status 플래그 | 상장상태/폐지위험(범위 밖 슬롯) | 상폐위험 조기신호 | 코드 없음, 데이터 이미 우리 유니버스 갱신 스크립트가 지나감 | 하 | 없음(신규 필드) | 필요 |
| 7(997) | SPDR 전 상품군(섹터ETF 외) | #18 섹터분류 | 산업(서브섹터) 근사 가능성 | 라이선스 문구 법무검토(997에서 이미 등재) | 중 | 있음(섹터) | 필요(법무) |
| 8(998,R2) | 🔑 FRED ICE BofA OAS(등급별 매일 신용스프레드) | #17 신용스프레드 | Damodaran 연1회→매일 갱신으로 정밀도 개선 가능 | ✅ **999 대조 완료 — 🟡 부분적 대응만 가능**(등급노치 손실·모집단차이·모델추정 vs 시장관측 개념차이). 직접 교체 불가, 하이브리드만 원리적으로 가능. **의존관계#5**(rf·ERP와 같은 as_of 배치) | 중 | 있음(WACC) | 필요 |
| 9(998,R2) | ~~FRED/Treasury 매일 국채수익률(raw)~~ | #14 무위험수익률 | 🔴 **폐기(1002) — 후보 자격 자체가 없다.** 999의 "정의 완전일치" 판정이 오류였다: Damodaran이 실제 쓰는 rf는 raw Treasury가 아니라 별도의 "$ Riskfree Rate" 계열(1001 발견, 카테고리20 참조) — **짝 제약 문제 이전에 값 자체가 다른 계열**이라 raw FRED는 애초에 대체 후보가 못 된다. → 위 1번(`ERPbymonth.xlsx`의 "$ Riskfree Rate")으로 완전 대체 | — | — | — |
| 10(998,R2) | Duke CFO Survey(분기 ERP) | #15 ERP | 서베이 기반 병기용(대체 아님) | 정의 차이(서베이 vs 시장내재) 화면 공개 필요 | 하 | 없음(병기 표시만) | 필요 |
| 11(998,R2) | edgartools(OSS, SEC 원문 그대로 재접근) | #4~#10 재무제표 전체 | 코드 대안(현재 route.ts 자체 파서 유지 이유 재확인용) | 이득이 아니라 "현재 방식이 최선"이라는 대조 자료 | — | 없음 | 불필요(정보용) |
| 12(998,R2) | OpenFIGI(무료 식별자 매핑) | #33(종목마스터, 슬롯 밖) | CIK-티커 매핑 교차검증 | CIK 필드 없음 — 티커 조인 검증 필요 | 하 | 없음 | 필요 |
| 13(998,R3) | S&P Global Market Intelligence가 동종서비스 대다수의 실제 소스 | (참고, 슬롯 없음) | 우리 "SEC원문+Damodaran" 조합이 여전히 드문 조합임을 재확인 | 판단 대상 아님(정보) | — | 없음 | 불필요 |
| 14(1002) | 시가총액↔재무제표 주식수 기준 정합(신규 발견 아님, 975의 미완결 처방) | #1 시가총액 ↔ #5/#6 | PBR·PSR 잔차 축소(975: 8.29%→0.05% 수준) | 🔴 **975는 진단만 하고 프로덕션에 배선 안 함 — 지금도 잔차가 남아있을 가능성.** 어느 기준(기말발행 vs 가중평균희석)으로 통일할지 판정 필요, 화면 영향 범위(us_valuation 전체) 파악 필요 | 중 | 있음(PBR·PSR 전체) | 필요 |

🔴 **판단만, 실행 안 함.** 14건(5번·9번 폐기 포함 12건 유효) 전부 원전대조표·정의검증 등 **선결 조건이 있다** — 이번 STEP에서 어느 것도 고치지 않았다. **1번만 최우선으로 등재됐을 뿐 자동 실행은 아니다** — 조달 배치 위치 판정 후 별도 승인 필요.

---

## 3중 규칙 (998)

🔴 **①-A(각 라운드 자체가 3중 이상 각도)**: R1(기관 27개 공식문서)·R2(16개 값별 역방향 검색)·R3(동종서비스 7곳 자체공개+비교글+OSS의존목록 3갈래)·R4(규제기록 8건). **①-B는 R3 자체가 담당**(동종 US 서비스 역추적). US 한정 — 전부 준수(Damodaran 지역변형·해외 규제기록 등 명시 제외).

## 다음 단계

새 관점(라운드5, 각도 미정) 착수는 이번 STEP 범위 밖 — 장은태 판정 대기.

---

## 🔴 이 카탈로그의 완료 조건 (신규, 1002 — "완성됐나?"를 다음에도 판단할 수 있게)

아래 6개가 전부 ✅가 되면 이 카탈로그는 "완성"이다. 지금 상태를 함께 표시한다.

| # | 조건 | 현재 상태(1002 기준) |
|---|---|---|
| 1 | 20개(실질 19개) 슬롯의 "지금 쓰는 소스" 칸이 **주장이 아니라 코드 대조로 검증**됨 | 🟡 부분 — 1002가 #19(오류 발견·정정)·#20(중복 발견·병합)을 검증. 나머지 슬롯은 대체로 이전 STEP들에서 이미 코드로 확인됐으나 **전 슬롯 일괄 재검증은 이번에도 안 함**(못 한 것 참조) |
| 2 | 슬롯 간 의존관계(ⓐⓑⓒ)가 전수 조사되고 카탈로그에 표시됨 | ✅ 1002 완료(6건 + 기각 2건) — 단, "전수"는 **현재 알려진 20개 슬롯 기준**이며 라운드5로 새 슬롯이 추가되면 재조사 필요 |
| 3 | 과거 판정(보류/기각/미채택)이 흩어진 문서에서 전수 수집되고, 각 판정의 전제 변화 여부가 표시됨 | 🟡 부분 — 지시된 8개 문서 중 **3개 전수 완료**(REVDCF_SPEC·VALUATION_SPEC·DECISION+AUDIT, 약 52건 수집·전제변화 5건 식별). **5개 미조사**(LENS_COMPLETION_STANDARD·CHANGELOG·STEP_LEDGER·STATE·LOCALE_SOURCE_PLAYBOOK) — 아래 "과거 판정 흡수" 절 참조 |
| 4 | 후보 1개뿐인 슬롯이 원리적/실질적으로 구분됨 | ✅ 1002 완료(원리적 2·실질적 1) |
| 5 | 즉시이득 목록의 각 항목이 선결조건까지 포함해 "장은태가 판정만 하면 실행할 수 있는" 상태 | 🟡 부분 — 14건 중 다수가 선결조건(원전대조표 등)이 아직 안 끝나 판정 자체가 아직 불가능한 항목이 섞여 있음(판정 가능 상태 ≠ 판정 완료 상태, 이 둘을 구분해 표시함) |
| 6 | 라운드5(새 각도) 착수 여부가 판정됨 | ⬜ 미판정 — 998이 열어둔 채 유지 |

🔴 **이 표 자체를 매번 갱신한다.** 새 STEP이 카탈로그를 건드릴 때마다 이 표의 상태를 다시 체크하지 않으면, "카탈로그가 완성됐는지" 다음 세션이 또 판단 못 한다.

---

## 과거 판정 흡수 (신규, 1002)

🔴 **커버리지 — 정직하게 표시.** 지시된 8개 문서 중 **3개를 전수 읽었다**(`docs/REVDCF_SPEC.md` 2071/2071줄 · `docs/VALUATION_SPEC.md` 403/403줄 · `docs/DECISION_*.md`+`docs/AUDIT_*.md` 16/16 파일). **나머지 5개는 이번 STEP에서 조사하지 못했다**: `docs/LENS_COMPLETION_STANDARD.md`(903줄, 미조사)·`docs/CHANGELOG.md`(7,698줄+, 미조사)·`docs/STEP_LEDGER.md`(미조사, 단 1001에서 별도로 971~1000 구간을 이미 복구함 — 그 작업이 이 절의 "판정" 수집과 목적이 달라 여기 재사용하지 않음)·`docs/STATE.md`(미조사)·`docs/LOCALE_SOURCE_PLAYBOOK.md`(미조사 — 이름상 가장 관련 높을 파일인데 못 봄). 🔴 **"3/8"이 완성이 아니라는 뜻이다 — 위 완료조건 표의 3번 항목이 🟡인 이유.**

### 🔴 전제가 이미 바뀐 판정 — 맨 앞(2-3)

| # | 판정 | 원래 전제 | 무엇이 바뀌었나 | 재론 상태 |
|---|---|---|---|---|
| 1 | STEP838 — SEC bulk `companyfacts.zip` 기각 | 유니버스 N=**623**, 개별 API 호출이 저렴 | 유니버스가 **5,893**(9.5배)으로 커짐, 순증 40건/일 병목 발생 | ✅ 993~996에서 재론·역전(부분채택) |
| 2 | STEP849 — FRED 일간 rf 보류 | "짝 안 맞아 보류 — **일간 rf 변형은 후속**"(스스로 예고) | 예고된 후속이 실행되기까지 **STEP150개 이상 경과**, 그마저 999~1000이 최초엔 짝 제약 자체를 놓침 | ✅ 999~1001에서 재론(1001에서 정정) |
| 3 | STEP985 — 시총 재구성 폴백을 **배선한다** | 표본 **1건**(XOM, 재구성오차 0.001%) | **STEP986**(같은 조사 연속선, 며칠이 아니라 **하루~이틀 안**) — 전수 대조하니 p90 20%·최대 99.22%(복수클래스 주식 구조 문제) | ✅ 986에서 즉시 정정(저장 대신 관측만 배선) — **판정 수명이 1개 STEP도 못 갔다**, 소표본 함정의 가장 빠른 사례 |
| 4 | STEP934→935→937 — US 시총취득 실패 원인 | 각 STEP마다 새 가설(예산부족→개수절단→취득실패→"필드 자체가 없음") | 세 번 연속 반증됨 | ⬜ 937에서 원인 미확정으로 종결(재론 안 됨) |
| 5 | STEP952b — `RAYA` 섹터 미분류 원인 | "ticker_norm 중복(RAYA형) 문제" | 같은 STEP 안에서 조사 중 **전제 자체가 처음부터 틀렸음**을 발견(진짜 원인 = `fetchAll()` 페이지네이션 비결정성) | ✅ 같은 STEP 내 정정(전제 수명 < 1 STEP) |
| 6 | (대조군 — 전제가 아직도 유효한 사례) STEP873 — 무료 multi-year 성장률 컨센서스 소스 없음 | "무료 경로가 없다" | **998의 92개 소스 전수조사에서도 재확인** — LSEG/Bloomberg/FactSet/S&P CapIQ 4곳이 유일한 제도권 소스이나 전부 유료, "994 이전부터 미해결 확정 유지"라고 998 스스로 명시 | 전제 유효 — 재론 불필요(비교를 위해 기록) |

🔑 **패턴**: 전제 붕괴까지 걸린 시간이 838(수십 STEP)·849(150+ STEP)처럼 느린 것도 있고, 985→986·952b처럼 **하루 안**인 것도 있다. "판정을 오래 붙들면 안전하다"는 보장이 없다 — 소표본·단일가설 기반 판정은 다음 STEP이 곧바로 뒤집을 수 있다.

### REVDCF_SPEC.md 판정 목록 (전수 읽음, `docs/REVDCF_SPEC.md` 원문 인용은 해당 STEP 절 참조)

| STEP | 평가대상 | 판정 | 이유(요약) | 전제 |
|---|---|---|---|---|
| 841 | Damodaran 업종매칭 키 — 거래소+구두점정규화 vs 설립국 | 채택=거래소+정규화(95.5%) / 기각=설립국(오분류 있음, TEL·ET 등) | 설립국 기준은 90.4% 커버되나 아일랜드·스위스 설립 미국상장사를 엉뚱한 국가 업종으로 오분류 | 623종목 유니버스 — 유효(841 이후 지속) |
| 841→877 | driver3 세율 — 한계세율 vs 업종실효세율 | 뒤집힘 → 한계세율(25.63%) 기본 | Damodaran 원문 "영구가치엔 한계세율" + WACC 부채세금방패와 세율 통일 | 세율 글라이드 안 씀·터미널=영구연금 — 유효 |
| 841 | driver3 현금세율(16.5%) 금지 근거 | 기각(안 씀), 단 최초 사유가 오류였음이 뒤늦게 정정 | 최초: "이중계산" → 정정: 원전도 같은 현금세율을 WACC에 씀(이중계산 아님), 진짜 근거는 "영구구간=한계세율" | 847 실측(현금세율 커버리지 58%뿐) — 유효 |
| 841 | driver3 세율 병기 폴백값(수익기업평균 vs aggregate) | **미결(보류)** | 다모다란 본인 권고 문헌을 못 찾음 | 확인 필요 — 끝까지 미결 |
| 844→875→880 | driver4/5 — 수준형 vs 한계형(원전식) | driver4=수준형 채택 / driver5=수준형→한계형(marginal)으로 역전(880) | driver4는 한계형 연도간변동 94.95%p로 불안정. driver5는 반대 — 도미노 앵커 재현에서 marginal만 원전값(11.6%)과 일치 | 도미노 직접개봉 앵커재현 — 유효 |
| 844 | driver4 업종평균 WC/Sales 폴백 | 기각 | Damodaran 업종중앙값 14.52% vs 우리계산 1.86%(8배차), 정의불일치(이자부부채 못 뺌) | `wcdata.xls` 대조실측 — 유효 |
| 849→918→919 | WACC 조립 — 컴포넌트 개별조립 vs Damodaran 완성열 | 기각(완성열 미사용, 대조·검증용으로만) | 완성열엔 다모다란 자체세율(25.00%)이 내장, driver3(25.63%)와 두 세율 공존하는 정합붕괴 발생 | 검산 결과 조립로직 정확(94업종 중앙 0.08%p차) — 유효 |
| 866-867 | 유니버스 조달범위 — 거래소상장만 vs OTC포함 | 채택=거래소상장만(OTC 조달안함) | OTC 486사 넣어도 산출종목+8뿐. FTSE Russell §5.6.1(실시간가격 요건)이 유일 서술 1차출처 | 목표치(2,857) 미구현 상태로 문서 종료 — 확인 필요 |
| 873 | driver1 매출성장 — SEC 5년CAGR 유지 vs 원전식(가이던스/컨센서스) | 기각(교체 안 함) | 야후 컨센서스는 +1년까지뿐(원전은 전체지평 단일값 필요), CKL2003(매출성장 지속성 有 vs 애널장기전망 부정확) | 무료 multi-year 소스 없음 — **998이 재확인, 여전히 유효**(위 대조군 참조) |
| 875 | driver4 원전 증분식(T4) 교체 | 기각(교체 안 함) | Damodaran이 수준형을 명시 권고, 원전 증분식 자체가 불안정(도미노도 −26.7~+18.2% 변동) | 874/876 태그매핑률 12.6→29.5%뿐 — 유효 |
| 878-879 | driver5 대안 3종(capex-only·sales-to-capital·Δ매출하한) | 전부 미채택 | sales-to-capital은 도미노에 Book Equity 데이터 자체가 없어 앵커검증 불가. Δ매출하한은 다모다란 실제 처방과 다름 | 880이 marginal 이미 채택 — 재검증 필요성 소멸 |
| 903 | DoD3 외부검증 3종목 대조 | 부분채택(도메인 상한 🅿️) | GAP류 공개처가 세상에 3곳뿐(도미노·Mauboussin-Johnson·NewConstructs), 전부 동시점 재현 불가 | 새 공개처 등장 시 재개 — 유효 |
| 965 | 재무제표 vintage — 최신 제출값 vs 원본 고정 | 채택=최신 제출값(재작성 반영) | 분자(오늘 시총)·분모(재무) 시점정합, stockanalysis.com도 동일 방식 확인 | 백테스트 미도입 — 재검토조건=백테스트 도입 시점(현재 유효) |
| 967 | 은행형 매출 — REV 완전전무 시 순이자+비이자 폴백 | 채택(제한적) | FDIC 감독매뉴얼 정의, SEC 10-K 원문(CBSH) 대조 확정 | 19개 지역은행 회복, 604 역DCF 유니버스와 무관(영향 0) — 유효 |
| 969 | 부채 — 「확정0/확정값/모름」 3분류 | 기각(무조건0) → 채택(3분류) | GM 사례에서 진짜 부채인데 배열 밖 태그라 0으로 오계산되던 것 발단 | GM검산 137건 변화·verdict 6건 변화 — 유효(단 백필 중 191종목 오염사고 있었음) |
| 993-994 | SEC throttle — 공유변수 vs 사전예약(nextAt) | 기각(공유변수, 경쟁조건 있음) → 채택(사전예약) | 실측 22.76req/s로 SEC 공식상한(10req/s)의 2.3배 찍고 있었음 | 값불변 20/20 검증 — 유효(배포는 승인대기 상태로 문서종료) |
| 995-996 | SEC 벌크파일 재도입(838 뒤집음) | 부분채택(Range 부분추출) | 838 전제(N=623) 무효화, 벌크 통째 다운로드는 19.2GB라 불가하나 Range 파싱은 가능 | 20건 딥비교 완전일치·4,493건 1차적재 — 유효 |
| 999-1003 | 무위험수익률 소스 — FRED만 교체 → 짝 필요 발견 → ERPbymonth.xlsx 페어 구현 | 선택지A 철회 → 선택지C 구현완료(적재 대기) | rf만 바꾸면 ERP와 짝이 안 맞음(849가 이미 경고). ERPbymonth.xlsx가 짝을 제공 | Damodaran의 "$ Riskfree Rate" 산식 — 1003에서 확인됨(2025-05 Moody's 미국 신용등급 강등 대응, T.Bond rate−디폴트스프레드) |
| (반복) | 원전 3층 값불일치(T5 계산값·책 서술값·T8 리터럴) — T8을 원전으로 채택 | 채택=T8(출력 검증가능) | 책 서술값(p.92) 미보유라 판정 불가 | 책 원본 미확보 상태 지속 — 확인 필요 |
| (§9표) | 탈락후보 5건(Zacks Rank·REV6·시계열SUE/PEAD·HOLT복제·Damodaran동시역산) | 전부 기각 | 각각: 비공개모델·유료+한국55%·약한신호×약해지는신호·대조값자체가유료비공개·가정증가 | 개별 실측 기반 — 유효(재론 안 됨) |

### VALUATION_SPEC.md 판정 목록 (전수 읽음)

| STEP | 평가대상 | 판정 | 이유(요약) | 전제 |
|---|---|---|---|---|
| 947 | `unavailableWhen` — 원문 3조건 vs 구현 4조건(debt·nonOperatingAssets null 추가) | 원문보다 넓힘(4번째 조건 추가) | 0으로 채우면 "모른다"를 "무차입이다"로 둔갑 — 규칙5-1⑤ 위반 방지 | 구현 시 발견 — 유효(131건 실전 발생 확인) |
| 947 | Damodaran vebitda.pdf(EV 정의)·pbv.pdf(common equity 정의) | 채택(인용) — 단 원문 PDF 로컬 미확보 | ⓪ 원전 인벤토리 규칙상 "빚"으로 기록됨 | 🔴 **재대조 안 됨 — 확인 필요(⓪ 규칙 위반 상태 지속)** |
| 947 | PSR 표준정의 원문 | **미확보 — 일반론으로 안 채우고 "못 찾음" 유지** | psdata.xls FAQ·variable.htm·c21.pdf 확인했으나 종목단위 정의(총매출/순매출, 금융업 처리) 자체가 없음(962 재확인) | 확인 필요 — 계속 미결 |
| 948 | 야후 원시 PER/PBR 상대차 측정(§5) | **미실시 — 명령서 전제 오류** | "lens_scores에 야후 원시PER 저장"이 틀렸음(실제론 파생점수만 저장, 원시값은 DB에 없음) | 발견 즉시 반영 — 재측정 필요(대량 라이브 호출 필요해 임의 실행 안 함) |
| 952b | `RAYA` 섹터 미분류 원인 — ticker_norm 중복 가설 | **전제 자체가 틀림(같은 STEP 내 정정)** | 진짜 원인 = `fetchAll()`의 `.range()` 페이지네이션 비결정성(`.order()` 없음) | 위 "전제 변화" #5 참조 |
| 955 | 페이지네이션 비결정성 처방 — `.order()` 추가 vs 필터완화 vs 현행유지 | **판정 대기(3안 제시만)** | 성능저하 가능성·다른 fetchAll류 함수 영향 미조사 | 확인 필요 |
| 956 | `minSample` = 20 | 채택 | 44칸(11업종×4축) 중 5칸이 비게 됨(Real Estate 전축·Financials EV/EBITDA)을 감수 | 표본 실측표 기반 — 유효 |
| 962-963 | 자기자본 정의 — 총자기자본 vs 보통주장부가(ⓑ) vs 유형장부가(ⓒ) | 채택=ⓑ(보통주장부가) / 기각=ⓒ(유형장부가) | ⓒ는 49건 중 35건 변화(p90 388%)·12건 장부가 음수전환 — 파괴적 | 930종목 전량 실측(PBR p90 0%, Financials 8.8%·Utilities 11.8%) — 유효 |
| 966 | IFRS `ifrs-full` 태그 지원 추가 여부(3선택지) | **판정 없음(선택지만)** | ②안(태그확장)은 확실 25/197·잠재 52/197 회복하나 "IFRS·GAAP 배수를 같은 백분위에 섞어도 되는지" 미검증 | 확인 필요 — CLAUDE.md "ADR은 소속국탭" 정책과 겹칠 수 있음(재론 안 함) |
| 967 | 은행형 매출 폴백 | (REVDCF_SPEC.md와 동일 판정, 중복 기재 안 함) | — | — |
| 985→986 | 시총 재구성 — 프로덕션 배선 여부 | **985 "배선한다" → 986 "관측만"으로 정정** | 위 "전제 변화" #3 참조 — 표본1건 vs 전수(p90 20%) | 프로덕션 실효성은 여전히 미확인(재현 불가 환경) |
| 958 | DoD3 외부대조 소스 — stockanalysis.com 채택 / macrotrends·gurufocus | 채택(가능한 곳) / **접근불가로 미사용(기각이 아니라 403)** | stockanalysis.com만 연도별 배수+그 시점 종가를 무료로 제공, 나머지는 HTTP 403/유료 | 5종목 대조 완료(DoD3 최소3종목 충족) — 유효 |

### DECISION_*.md·AUDIT_*.md 판정 목록 (서브에이전트, 16/16 파일 전수 읽음 — 원 보고 재구성)

| STEP | 평가대상 | 판정 | 이유(요약) |
|---|---|---|---|
| 890 | 역DCF 모집단 정의 — 실제운영표본(604) vs 목표조달범위(2,857) | 조건부채택(두 숫자 문서에서 명시 분리) | 혼동 방지 |
| 902 | DoD3 외부검증 3종목 요건 | 도메인상한(🅿️)으로 대체 승인 | REVDCF_SPEC 903과 동일 판정(교차기재) |
| 906→910 | driver4 운전자본 — 하이브리드(플래그방식) | **최종 기각**, 현행(유동부채 전액차감)+한계공개로 종결 | 이자부제외 시 도미노와 정확일치하나 커버리지 53%로 급락 |
| 908 | Vercel 로그 조회 채널 — CLI(5분제한)·MCP(403) vs 대시보드 | 기각(CLI·MCP) / 채택(대시보드, Hobby플랜 1시간보존) | 접근성 |
| 913-914 | `lens_cuts` 신선도 판정 컬럼 — `updated_at` vs `as_of` | 기각(updated_at, 트리거없어 신뢰불가) / 채택(as_of) | 신뢰성 |
| 918-919 | driver3 세율 병기 / "판정불가" 라벨체계(Morningstar식) / 원전 저·기준·고 성장시나리오 알고리즘화 | 채택(병기) / 기각(라벨체계, 원전에 개념없음) / 기각(알고리즘화, 원전이 정성판단뿐) | — |
| 921/927/928 | DoD9 라이브검증 채널 — Vercel Preview | 부분채택(env 추가해 수리) | Production 대체인정 여부 미결 |
| 904 | SEC frames "하한" 재라벨링 | **무효 판정** | 866이 "frames는 하한이 아니라 다른 모집단"이라 뒤집어 전제 자체가 소멸 |
| 923-924 | 종목명 표시소스 — `lens_scores.name`(34.9%결손) 근본수정 vs 표시계층 대체 | 기각(근본수정) / 채택(B안, 표시계층에서만 `us_symbols.json` 대체) | 범위축소 |
| 934→935→937 | US 시총취득 실패 원인(4회 뒤집힘) | 위 "전제 변화" #4 참조 | — |

🔑 **총계(3개 문서 전수 + 5개 미조사)**: REVDCF_SPEC.md **20건** · VALUATION_SPEC.md **12건**(967 중복 제외) · DECISION/AUDIT **27건**(위 표는 대표 10건만 발췌, 나머지 17건은 두 문서가 UI·문구 판정이라 이 카탈로그[데이터소스 전용] 범위 밖으로 판단해 제외 — DECISION_922·925·929는 0건) = **약 52건.** 이 중 명확한 "전제 변화" 사례 = **5건**(위 표).
